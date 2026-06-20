export const initAuthBridge = () => {
  window.addEventListener('message', (event) => {
    // Only accept messages from your main app domain
    if (event.origin !== 'https://tradexpro.co.ke') return; // Update to your main app domain

    if (event.data.type === 'TRADEX_AUTH') {
      const { token1, token2 } = event.data.payload;
      
      localStorage.setItem('client.accounts', JSON.stringify({
        acct1: token1,
        acct2: token2
      }));
      
      window.location.reload();
    }
  });

  window.parent.postMessage({ type: 'TRADEX_READY' }, '*');
};
