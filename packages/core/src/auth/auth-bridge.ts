export const initAuthBridge = () => {
    // Signal to parent that we're ready for auth
    window.parent.postMessage({ type: 'DTRADER_AUTH_READY' }, 'https://tradexpro.co.ke');

    window.addEventListener('message', event => {
        if (event.origin !== 'https://tradexpro.co.ke') return;
        if (event.data?.type !== 'TRADEXPRO_AUTH') return;

        const { token, loginid } = event.data;
        if (!token) return;

        // Write into the exact key dtrader's getStoredToken() reads
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
