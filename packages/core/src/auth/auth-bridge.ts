export const initAuthBridge = () => {
    // Signal parent we're ready
    window.parent.postMessage({ type: 'DTRADER_AUTH_READY' }, '*');

    window.addEventListener('message', event => {
        if (event.origin !== 'https://tradexpro.co.ke') return;
        if (event.data?.type !== 'TRADEXPRO_AUTH') return;

        const { token, loginid, accounts } = event.data;
        if (!token) return;

        // Avoid reload loop — if token already matches, do nothing
        try {
            const existing = JSON.parse(sessionStorage.getItem('auth_info') || '{}');
            if (existing.access_token === token) return;
        } catch {
            // ignore parse errors
        }

        sessionStorage.setItem(
            'auth_info',
            JSON.stringify({
                access_token: token,
                refresh_token: null,
                expires_at: null,
            })
        );

        localStorage.setItem('active_loginid', loginid);
        sessionStorage.setItem('active_loginid', loginid);

        if (accounts?.length) {
            localStorage.setItem('tradex-deriv-accounts', JSON.stringify(accounts));
        }

        window.location.reload();
    });
};
