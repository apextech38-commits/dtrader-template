const PARENT_ORIGIN = 'https://tradexpro.co.ke';

interface TradeXProAuthMsg {
  type: 'TRADEXPRO_AUTH';
  token: string;
  accounts: { loginid: string; token: string; currency: string; is_virtual: 0 | 1 }[];
  loginid: string;
}

function buildClientAccounts(accounts: TradeXProAuthMsg['accounts']) {
  const result: Record<string, unknown> = {};
  for (const acc of accounts) {
    result[acc.loginid] = {
      token: acc.token,
      currency: acc.currency,
      is_virtual: acc.is_virtual,
      loginid: acc.loginid,
    };
  }
  return result;
}

export function initAuthBridge(): void {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'DTRADER_AUTH_READY' }, PARENT_ORIGIN);
  }

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== PARENT_ORIGIN) return;
    const msg = event.data as TradeXProAuthMsg;
    if (!msg || msg.type !== 'TRADEXPRO_AUTH') return;
    const { token, accounts, loginid } = msg;
    if (!token || !accounts?.length || !loginid) return;

    localStorage.setItem('client.accounts', JSON.stringify(buildClientAccounts(accounts)));
    localStorage.setItem('active_loginid', loginid);
    for (const acc of accounts) {
      localStorage.setItem(`tokens-${acc.loginid}`, acc.token);
    }

    const current = localStorage.getItem('active_loginid');
    if (current !== loginid) {
      window.location.reload();
    } else {
      window.dispatchEvent(new StorageEvent('storage', { key: 'active_loginid', newValue: loginid }));
    }
  });
}
