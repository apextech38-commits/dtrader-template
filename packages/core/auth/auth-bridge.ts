export const initAuthBridge = () => {
  window.addEventListener('message', (event) => {
    // SECURITY: Ensure this matches your production domain exactly
    if (event.origin !== 'https://tradexpro.co.ke') return; 

    if (event.data.type === 'TRADEX_AUTH') {
      const { token1, token2 } = event.data.payload;
      
      localStorage.setItem('client.accounts', JSON.stringify({
        acct1: token1,
        acct2: token2
      }));
      
      // Force reload to allow the Deriv store to pick up the new localStorage
      window.location.reload();
    }
  });

  // Signal the host that the DTrader iframe is ready for the tokens
  window.parent.postMessage({ type: 'TRADEX_READY' }, '*');
};
