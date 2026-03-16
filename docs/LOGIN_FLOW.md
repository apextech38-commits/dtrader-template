# Login Flow — Documentation

Covers how the login and signup entry points work, from the user clicking a button to the browser landing on Deriv's authorization page.

**Key files:**

| File                                                                                      | Purpose                                                                |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`packages/shared/src/utils/login/login.ts`](../packages/shared/src/utils/login/login.ts) | `redirectToLogin()` and `redirectToSignUp()` — the public entry points |
| [`packages/core/src/Services/oauth.ts`](../packages/core/src/Services/oauth.ts)           | PKCE helpers, token exchange, token storage                            |

---

## Login Entry Point — `redirectToLogin()`

**File:** [`packages/shared/src/utils/login/login.ts`](../packages/shared/src/utils/login/login.ts)

This is the function called when the user clicks "Log In". It performs the full PKCE setup and then redirects the browser to Deriv's OAuth2 authorize endpoint.

### Why `window.location.replace()`?

The redirect uses `replace()` instead of `assign()` or `href =`. This removes the current page from browser history so the user cannot press the back button and return to a broken in-between state after being redirected to Deriv's login page.

---

## PKCE Setup

Before redirecting, `redirectToLogin()` generates and stores PKCE credentials:

### 1. Generate `code_verifier`

A cryptographically random 32-byte value, base64url-encoded:

```typescript
const array = new Uint8Array(32);
crypto.getRandomValues(array);
// base64url-encode (replace +→-, /→_, strip =)
```

Stored immediately in `sessionStorage`:

```
sessionStorage['oauth_code_verifier']          = <verifier>
sessionStorage['oauth_code_verifier_timestamp'] = <Date.now()>
```

> Note: The `@deriv/shared` package duplicates these PKCE helpers from `packages/core/src/Services/oauth.ts` to avoid a circular dependency. The logic is identical.

### 2. Generate `code_challenge`

```
code_challenge = base64url( sha256(code_verifier) )
```

This is sent to Deriv in the authorization request. Deriv stores it and later verifies it against the `code_verifier` submitted during token exchange — this is the PKCE proof that no client secret is needed.

### 3. Generate CSRF Token

A random 16-byte value, base64-encoded, stored as `sessionStorage['oauth_csrf_token']`. Sent as `state` in the authorization request and verified on the callback to prevent CSRF attacks.

---

## Authorization URL

The final URL built and navigated to:

```
{auth_base_url}/oauth2/auth
  ?response_type=code
  &client_id={getOAuthClientId()}
  &redirect_uri={getOAuthRedirectUri()}
  &scope=trade
  &state={csrf_token}
  &code_challenge={sha256(code_verifier)}
  &code_challenge_method=S256
```

All config values (`auth_base_url`, `client_id`, `redirect_uri`) come from `brand.config.json` via `@deriv/shared` brand utilities.

---

## What Happens Next

After the browser navigates to the authorization URL:

1. User logs in on Deriv's page
2. Deriv redirects back to `/callback?code=AUTH_CODE&state=CSRF_TOKEN`
3. The callback handler picks up from here — see [CALLBACK_FLOW.md](./CALLBACK_FLOW.md)
4. Token exchange and WebSocket connection — see [WEBSOCKET_INTEGRATION.md](./WEBSOCKET_INTEGRATION.md)

---

## Signup Entry Point — `redirectToSignUp()`

Opens the signup page in a new tab (does not redirect the current window):

```typescript
export const redirectToSignUp = (_language?: string): void => {
    const signup_url = getSignupUrl();
    if (signup_url) window.open(signup_url, '_blank', 'noopener,noreferrer');
};
```

- `getSignupUrl()` reads from `brand.config.json` → `signup_url.staging` or `signup_url.production`
- If the config has no signup URL, nothing happens (the feature is silently disabled)
- `noopener,noreferrer` prevents the new tab from accessing `window.opener` (security best practice)

The signup URL feature can also be hidden entirely via `brand.config.json` → `features.signup_button`.

---

## SessionStorage Keys Set During Login

| Key                             | Value                                        | Cleared                           |
| ------------------------------- | -------------------------------------------- | --------------------------------- |
| `oauth_code_verifier`           | Random PKCE verifier                         | After successful token exchange   |
| `oauth_code_verifier_timestamp` | Timestamp of verifier creation (TTL: 10 min) | After successful token exchange   |
| `oauth_csrf_token`              | Random CSRF state value                      | After callback state verification |

---

## Sequence Diagram

```
User clicks "Log In"
        │
        ▼
redirectToLogin()
        │
        ├── generateCodeVerifier()      → random 32 bytes, base64url
        ├── generateCodeChallenge()     → sha256(verifier), base64url
        ├── storePKCEVerifier()         → sessionStorage
        ├── generate csrf_token        → sessionStorage
        │
        ▼
window.location.replace(
  auth_base_url/oauth2/auth?
    response_type=code
    &client_id=...
    &redirect_uri=...
    &scope=trade
    &state={csrf_token}
    &code_challenge={sha256(verifier)}
    &code_challenge_method=S256
)
        │
        ▼
[Browser navigates to Deriv's login page]
        │
        ▼
[User authenticates]
        │
        ▼
[Deriv redirects to /callback?code=...&state=...]
        │
        ▼
→ See CALLBACK_FLOW.md
```
