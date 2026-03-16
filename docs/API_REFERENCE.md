# Deriv Options API — Reference

Source: https://developers.deriv.com/docs/options/

All REST endpoints are relative to the base URL provided by `getApiV4BaseUrl()` (from `brand.config.json` → `derivws`):

- **Staging:** `https://staging-api.derivws.com`
- **Production:** `https://api.derivws.com`

---

## Common Request Headers

All authenticated endpoints require:

| Header          | Value                                   |
| --------------- | --------------------------------------- |
| `Authorization` | `Bearer <access_token>`                 |
| `Deriv-App-ID`  | Your registered App ID                  |
| `Content-Type`  | `application/json` (for POST with body) |

---

## Common Error Response Shape

```json
{
    "errors": [
        {
            "status": 400,
            "code": "ValidationError | FieldIsRequired | Unauthorized | NotFound",
            "message": "Human-readable description"
        }
    ],
    "meta": {
        "endpoint": "/trading/v1/options/accounts",
        "method": "POST",
        "timing": 42
    }
}
```

---

## Endpoints

### 1. List Accounts

**`GET /trading/v1/options/accounts`**

- **Scope:** `trade`
- **Request body:** None
- **Response:**
    ```json
    {
        "data": [
            {
                "account_id": "VRTC12345",
                "balance": 10000.0,
                "currency": "USD",
                "group": "row",
                "status": "active",
                "account_type": "demo",
                "created_at": "2024-01-01T00:00:00Z",
                "email": "user@example.com",
                "last_access_at": "2024-01-01T00:00:00Z",
                "name": "John Doe",
                "server_id": "server-1",
                "rights": {}
            }
        ]
    }
    ```
- **Status codes:** `200`, `401`, `500`
- **Project implementation:** `fetchAccounts()` in [accounts-api.ts](../packages/core/src/Services/accounts-api.ts) — unwraps `.data`
- **Also used by:** `useDerivativesAccount` hook in [useDerivativesAccount.ts](../packages/api/src/hooks/useDerivativesAccount.ts)

---

### 2. Create Account

**`POST /trading/v1/options/accounts`**

- **Scope:** `account_manage`
- **Request body:**
    ```json
    {
        "currency": "USD",
        "group": "row",
        "account_type": "demo"
    }
    ```
- **Response:** Single account object (same shape as list item above), wrapped in `{ "data": { ... } }`
- **Status codes:** `201` (created), `200` (existing returned), `400`, `401`, `500`
- **Project implementation:** `createAccount()` in [accounts-api.ts](../packages/core/src/Services/accounts-api.ts) — unwraps `.data`

---

### 3. Get OTP WebSocket URL

**`POST /trading/v1/options/accounts/{account_id}/otp`**

- **Scope:** `trade`
- **Request body:** Not required by the API. Send no body (omit `Content-Type`).
    > **Note:** Sending `Content-Type: application/json` with an empty body causes a `400 Bad Request — SyntaxError: Unexpected end of JSON input`. The project works around this by sending `body: JSON.stringify({})`.
- **Response (double-encoded JSON):**
    ```
    Outer: { "data": "<JSON string>" }
    Inner (after parsing outer.data): { "data": { "url": "wss://staging-api.derivws.com/trading/v1/options/ws/demo?otp=xxx" } }
    ```
- **Status codes:** `200`, `400`, `401`, `404`, `500`
- **Important:** OTP URLs are **single-use**. Fetch immediately before opening the WebSocket. Do not cache.
- **Project implementation:** `fetchOTP()` in [accounts-api.ts](../packages/core/src/Services/accounts-api.ts) — handles both double-encoded and direct object shapes

---

### 4. Reset Demo Balance

**`POST /trading/v1/options/accounts/{account_id}/reset-demo-balance`**

- **Scope:** `trade`
- **Request body:** None
- **Response:** Updated account object wrapped in `{ "data": { ... } }`
- **Status codes:** `200`, `400`, `401`, `404`, `500`
- **Restriction:** Demo accounts only
- **Project implementation:** `resetDemoBalance()` in [accounts-api.ts](../packages/core/src/Services/accounts-api.ts) — unwraps `.data`

---

### 5. WebSocket — Public Endpoint

**`GET /trading/v1/options/ws/public`** (WebSocket upgrade)

- **Auth:** None required
- **Purpose:** Market data, active symbols — unauthenticated users
- **Project implementation:** Constructed lazily by `getPublicWSUrl()` in:
    - [socket_base.js](../packages/core/src/_common/base/socket_base.js)
    - [APIProvider.tsx](../packages/api/src/APIProvider.tsx)

---

### 6. WebSocket — Authenticated Endpoint

**`GET /trading/v1/options/ws/{account_type}?otp={token}`** (WebSocket upgrade)

- **Auth:** OTP embedded in URL (obtained from endpoint 3 above)
- **Purpose:** Authenticated trading — balance, proposals, buy/sell, subscriptions
- **`account_type`:** `demo` or `real` (embedded in the URL returned by the OTP endpoint)
- **Project implementation:** `BinarySocket.setWSUrl(ws_url)` in [client-store.js](../packages/core/src/Stores/client-store.js) and [switchAccount](../packages/core/src/Stores/client-store.js)

---

## OAuth / Auth Endpoints

These use the `auth` base URL from `brand.config.json` (not `derivws`):

- **Staging:** `https://staging-auth.deriv.com`
- **Production:** `https://auth.deriv.com`

### Token Exchange

**`POST /oauth2/token`**

- **Content-Type:** `application/x-www-form-urlencoded`
- **Body fields:**
    ```
    grant_type=authorization_code
    code=<auth_code>
    redirect_uri=<redirect_uri>
    client_id=<OAUTH_CLIENT_ID>
    code_verifier=<pkce_verifier>
    ```
- **Response:** `{ "access_token": "...", "refresh_token": "...", "expires_in": 3600 }`
- **Project implementation:** `exchangeCodeForToken()` in [oauth.ts](../packages/core/src/Services/oauth.ts)

### Token Refresh

**`POST /oauth2/token`**

- **Content-Type:** `application/x-www-form-urlencoded`
- **Body fields:**
    ```
    grant_type=refresh_token
    refresh_token=<refresh_token>
    client_id=<OAUTH_CLIENT_ID>
    ```
- **Response:** `{ "access_token": "...", "refresh_token": "...", "expires_in": 3600 }`
- **Project implementation:** `refreshAccessToken()` in [oauth.ts](../packages/core/src/Services/oauth.ts)

---

## Implementation Status

| Endpoint                                                    | Doc-compliant | Notes                                                                                   |
| ----------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| `GET /trading/v1/options/accounts`                          | ✅            | Path correct, unwraps `.data`                                                           |
| `POST /trading/v1/options/accounts`                         | ✅            | Body fields match                                                                       |
| `POST /trading/v1/options/accounts/{id}/otp`                | ⚠️            | Sends `{}` body as workaround for `Content-Type` issue; handles double-encoded response |
| `POST /trading/v1/options/accounts/{id}/reset-demo-balance` | ✅            | No body needed                                                                          |
| `GET /trading/v1/options/ws/public`                         | ✅            | URL built from `brand.config.json`                                                      |
| `GET /trading/v1/options/ws/{type}?otp=`                    | ✅            | URL from OTP response                                                                   |
| `POST /oauth2/token` (exchange)                             | ✅            | PKCE flow, form-encoded                                                                 |
| `POST /oauth2/token` (refresh)                              | ✅            | Refresh token flow                                                                      |
