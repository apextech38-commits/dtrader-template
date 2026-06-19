export const initAuthBridge = () => {
  window.addEventListener('message', (event) => {
    // SECURITY: Ensure you replace with your actual main app domain
    if (event.origin !== 'https://tradexpro.co.ke') return; 

    if (event.data.type === 'TRADEX_AUTH') {
      const { token1, token2 } = event.data.payload;
      
      localStorage.setItem('client.accounts', JSON.stringify({
        acct1: token1,
        acct2: token2
      }));
      
      window.location.reload();
    }
  });

  // Signal that the DTrader iframe is loaded and ready
  window.parent.postMessage({ type: 'TRADEX_READY' }, '*');
};
