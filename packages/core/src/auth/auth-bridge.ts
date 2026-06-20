export const initAuthBridge = () => {
    // Signal parent we're ready — use '*' since we don't know parent's exact origin at this point
    window.parent.postMessage({ type: 'DTRADER_AUTH_READY' }, '*');

    window.addEventListener('message', event => {
        if (event.origin !== 'https://tradexpro.co.ke') return;
        if (event.data?.type !== 'TRADEXPRO_AUTH') return;

        const { token, loginid } = event.data;
        if (!token) return;

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

        window.location.reload();
    });
};
