import { initAuthBridge } from './auth/auth-bridge';

/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-named-as-default */
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from 'App/app.jsx';
import initStore from 'App/initStore';
// eslint-disable-next-line
import registerServiceWorker from 'Utils/PWA';

import AppNotificationMessages from './App/Containers/app-notification-messages.jsx';

if (
    !!window?.localStorage.getItem?.('debug_service_worker') || // To enable local service worker related development
    !window.location.hostname.startsWith('localhost')
) {
    registerServiceWorker();
}

const initApp = async () => {
    const root_store = await initStore(AppNotificationMessages);

    const wrapper = document.getElementById('derivatives_trader');
    if (wrapper) {
        const root = createRoot(wrapper);
        root.render(<App root_store={root_store} />);
    }
};

// Wait for auth bridge to receive token before initialising the app,
// but fall back after 3 seconds so the app still loads unauthenticated.
const authTimeout = setTimeout(() => initApp(), 3000);

window.addEventListener(
    'TRADEXPRO_AUTH_RECEIVED',
    () => {
        clearTimeout(authTimeout);
        initApp();
    },
    { once: true }
);

initAuthBridge();
