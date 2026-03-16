# OAuth2 Callback Handler — Documentation

The callback page (`/callback`) is fully automatic. When Deriv redirects the user back after login, this page runs through steps 3–5 of the OAuth2 flow without any user interaction.

---

## What the URL Looks Like

On success:

```
/callback?code=aBcDeFgHiJkLmN...&state=xYzAbC...
```

On failure (e.g. user cancelled):

```
/callback?error=access_denied&error_description=The+user+denied+access
```

---

## Step 3 — Verify the Callback

**File:** [js/callback.js](js/callback.js) → `processCallback()`

Parses the URL and runs two security checks:

### 1. State Verification (CSRF protection)

- Reads `state` from the URL
- Reads stored `state` from `sessionStorage` (saved before the redirect in step 2)
- If they **don't match** → abort, show "Security Error: State Mismatch"
- If stored state is **missing** → abort, show "Session Error" (user navigated directly to `/callback`)

### 2. Authorization Code Check

- Confirms `code` is present in the URL
- If missing → abort, show error

If Deriv returned an `error` param instead of a `code`, the flow also aborts here with the error description displayed.

On success, the authorization code is displayed (first 20 chars) and the flow continues.

---

## Step 4 — Exchange Code for Token

**File:** [js/callback.js](js/callback.js) → `exchangeCodeForTokens()`

POSTs to your backend `/api/token`:

```json
{
    "code": "AUTH_CODE_FROM_URL",
    "code_verifier": "VALUE_FROM_SESSION_STORAGE",
    "redirect_uri": "https://yourapp.com/callback"
}
```

Your backend ([api/token.js](api/token.js)) forwards this to Deriv:

```
POST https://auth.deriv.com/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=YOUR_CLIENT_ID
&code=AUTH_CODE_FROM_URL
&code_verifier=VALUE_FROM_SESSION_STORAGE
&redirect_uri=https://yourapp.com/callback
```

Deriv validates that `sha256(code_verifier)` matches the `code_challenge` sent in step 2 — this is the **PKCE proof**. No client secret is needed.

On success, Deriv returns:

```json
{
    "access_token": "eyJ...",
    "token_type": "Bearer",
    "expires_in": 3600
}
```

After receiving the token, PKCE values are **cleared from sessionStorage** (they are single-use).

---

## Step 5 — First Authenticated API Call

**File:** [js/callback.js](js/callback.js) → `callDerivAPI()`

Immediately uses the `access_token` to fetch the user's accounts via your backend proxy:

```
POST /api/deriv
{
  "endpoint": "/trading/v1/options/accounts",
  "accessToken": "eyJ..."
}
```

Your backend ([api/deriv.js](api/deriv.js)) adds the `Authorization` header and proxies to Deriv:

```
GET https://api.derivws.com/trading/v1/options/accounts
Authorization: Bearer eyJ...
```

The response is used to persist the session:

```js
sessionStorage.setItem('deriv_access_token', accessToken);
sessionStorage.setItem('deriv_account_id', firstDemoAccount.account_id);
```

Then the success summary is shown with links to other modules.

---

## REST API Client (`DerivAPI`)

**File:** [js/api-client.js](js/api-client.js)

A static class exposed as `window.DerivAPI`. All REST calls are proxied through your backend `/api/deriv` — the frontend never calls Deriv directly.

### Token Management

```js
DerivAPI.saveToken(token); // stores in sessionStorage
DerivAPI.getToken(); // retrieves from sessionStorage
DerivAPI.saveAccountId(id); // stores account ID
DerivAPI.getAccountId(); // retrieves account ID
DerivAPI.isAuthenticated(); // returns true if token exists
DerivAPI.clearAuth(); // removes token + account ID
```

### Making REST Calls

All calls go through the generic proxy method:

```js
// Generic
const data = await DerivAPI.callREST('/trading/v1/options/accounts', {
  method: 'GET',           // default
  body: { ... },           // optional, for POST/PUT
  accessToken: 'eyJ...',   // optional, falls back to sessionStorage
});
```

Your backend receives:

```json
POST /api/deriv
{
  "endpoint": "/trading/v1/options/accounts",
  "method": "GET",
  "accessToken": "eyJ..."
}
```

And proxies to Deriv with:

```
Authorization: Bearer eyJ...
Deriv-App-ID: YOUR_APP_ID   (if configured)
```

### Built-in Convenience Methods

```js
// Get all accounts
const accounts = await DerivAPI.getAccounts(token);

// Create a new demo account
const account = await DerivAPI.createAccount(token, {
    currency: 'USD',
    group: 'row',
    account_type: 'demo',
});

// Reset demo balance
await DerivAPI.resetDemoBalance(token, accountId);

// Get an OTP URL for authenticated WebSocket connection
const wsUrl = await DerivAPI.getOTP(token, accountId);
// returns: wss://...?otp=...  (use this URL to connect DerivWebSocket)
```

---

## WebSocket Client (`DerivWebSocket`)

**File:** [js/ws-client.js](js/ws-client.js)

A class exposed as `window.DerivWebSocket`. Handles connection lifecycle, request/response matching, subscription streams, and keepalive pings.

### Authenticated WebSocket Setup

Unlike REST, the WebSocket connection is authenticated via a one-time password (OTP) embedded in the URL — not a header.

```js
// Step 1: Get OTP URL from REST API
const wsUrl = await DerivAPI.getOTP(token, accountId);
// e.g. wss://ws.derivws.com/websockets/v3?otp=abc123&app_id=...

// Step 2: Connect
const ws = new DerivWebSocket();
await ws.connect(wsUrl);
```

### One-Shot Requests (send + await response)

```js
// Send a request, await the matching response by req_id
const response = await ws.send({ ticks: 'R_100' });
```

`req_id` is auto-assigned. The promise resolves when the matching response arrives, or rejects on error.

### Subscription Streams (ongoing messages)

```js
// Register a handler for a msg_type
const unsubscribe = ws.on('tick', data => {
    console.log(data.tick.quote);
});

// Subscribe to ticks
await ws.send({ ticks: 'R_100', subscribe: 1 });

// Later: unsubscribe handler
unsubscribe();

// Cancel the server-side subscription
await ws.forget(subscriptionId);

// Or cancel all of a type
await ws.forgetAll('ticks');
// or multiple: await ws.forgetAll(['ticks', 'proposal'])
```

### Status Monitoring

```js
ws.onStatusChange(status => {
    // status: 'connecting' | 'connected' | 'disconnected'
});

ws.getStatus(); // current status string
```

### Keepalive

Pings are sent automatically every **30 seconds** (`{ ping: 1 }`) while connected. No manual handling needed.

### Cleanup

```js
ws.disconnect(); // closes connection, clears all handlers and pending requests
ws.off('tick'); // remove all handlers for a msg_type
```

### Message Dispatch Logic

Every incoming message is routed two ways:

1. **By `req_id`** — resolves the pending promise from `send()` (one-shot request)
2. **By `msg_type`** — fires all registered `on(msgType, cb)` handlers (subscriptions)

If a message has an `error` field, the pending promise is rejected with the error message and code attached.

---

## Session Storage Keys Set

| Key                  | Value                                            |
| -------------------- | ------------------------------------------------ |
| `deriv_access_token` | The Bearer token for all future API calls        |
| `deriv_account_id`   | First demo account ID from the accounts response |

These two keys are what all other modules check via `DerivAPI.isAuthenticated()`.

---

## Error Paths

| Situation                     | Cause                                  | What Happens                               |
| ----------------------------- | -------------------------------------- | ------------------------------------------ |
| `?error=access_denied` in URL | User cancelled login                   | Error shown immediately, no token exchange |
| State mismatch                | Possible CSRF attack, or stale session | Security error, flow aborted               |
| No stored state               | User navigated directly to `/callback` | "Did you start from the login page?" error |
| Token exchange fails          | Expired/invalid code, wrong verifier   | Deriv error response displayed             |
| API call fails                | Bad token, network error               | Error shown, but token is still saved      |

---

## Sequence Diagram

```
Browser (/callback)          Your Backend              Deriv
       │                          │                      │
       │── Parse URL params ──────┤                      │
       │── Verify state ──────────┤                      │
       │                          │                      │
       │── POST /api/token ───────►                      │
       │   { code, code_verifier} │── POST /oauth2/token ►
       │                          │   { grant_type,      │
       │                          │     client_id,       │
       │                          │     code,            │
       │                          │     code_verifier }  │
       │                          │◄─ { access_token } ──│
       │◄── { access_token } ─────│                      │
       │                          │                      │
       │── Clear PKCE from sessionStorage                │
       │                          │                      │
       │── POST /api/deriv ────────►                      │
       │   { endpoint, token }    │── GET /trading/v1/.. ►
       │                          │   Authorization: Bearer
       │                          │◄─ { accounts: [...] }│
       │◄── { accounts: [...] } ──│                      │
       │                          │                      │
       │── Save token + account_id to sessionStorage     │
       │── Show success summary                          │
```
