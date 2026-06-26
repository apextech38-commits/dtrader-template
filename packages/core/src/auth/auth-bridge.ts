/**
 * auth-bridge.ts — dtrader-template
 *
 * Receives the auth token from the TradeXpro parent window and applies
 * it to the local session so the trading UI boots as authenticated.
 *
 * Protocol:
 *   1. dtrader sends  { type: 'DTRADER_AUTH_READY' }  to parent
 *   2. parent sends   { type: 'TRADEXPRO_AUTH', token, loginid, accounts }
 *   3. dtrader stores token and dispatches 'TRADEXPRO_AUTH_RECEIVED'
 */

const ALLOWED_PARENT_ORIGIN = 'https://tradexpro.co.ke';

// Token keys dtrader core reads from sessionStorage on boot
const TOKEN_KEY = 'access_token';
const LOGINID_KEY = 'active_loginid';

function applyAuth(data: { token: string; expiresAt?: string | null; loginid?: string; accounts?: unknown[] }): void {
    if (!data.token) return;

    sessionStorage.setItem(TOKEN_KEY, data.token);

    if (data.expiresAt) {
        sessionStorage.setItem('token_expires_at', String(data.expiresAt));
    }
    if (data.loginid) {
        sessionStorage.setItem(LOGINID_KEY, data.loginid);
    }

    // Let dtrader core know auth is applied
    window.dispatchEvent(new Event('TRADEXPRO_AUTH_RECEIVED'));
}

// ── Inbound listener — only trust messages from the main site ─────────
window.addEventListener('message', (event: MessageEvent) => {
    // Reject anything not from the exact parent origin
    if (event.origin !== ALLOWED_PARENT_ORIGIN) return;

    const data = event.data as { type?: string } & Parameters<typeof applyAuth>[0];
    if (data?.type !== 'TRADEXPRO_AUTH') return;

    applyAuth(data);
});

// ── Signal parent that we are ready to receive tokens ─────────────────
// targetOrigin is '*' here because we do not yet know the parent origin.
// The inbound listener above is what enforces security.
if (window.parent !== window) {
    window.parent.postMessage({ type: 'DTRADER_AUTH_READY' }, '*');
}

// ── Handle logout signal ───────────────────────────────────────────────
window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== ALLOWED_PARENT_ORIGIN) return;

    const data = event.data as { type?: string };
    if (data?.type !== 'AUTH_LOGOUT') return;

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(LOGINID_KEY);
    sessionStorage.removeItem('token_expires_at');
    window.location.reload();
});
