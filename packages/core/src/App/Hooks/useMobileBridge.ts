import { useCallback, useMemo } from 'react';

export const useMobileBridge = () => {
    // Check if app is loaded from mobile app via query parameter or sessionStorage
    // Store in sessionStorage to persist even if query params are removed from URL
    const isMobileApp = useMemo(() => {
        const STORAGE_KEY = 'is_mobile_app';

        // Check sessionStorage first (persists if URL params are removed)
        const storedValue = sessionStorage.getItem(STORAGE_KEY);
        if (storedValue === 'true') {
            return true;
        }

        // Check query parameter (on first load)
        const params = new URLSearchParams(window.location.search);
        const paramValue = params.get('is_mobile_app');
        const isMobile = paramValue === 'true';

        // Store in sessionStorage for future use
        if (isMobile) {
            sessionStorage.setItem(STORAGE_KEY, 'true');
        }

        return isMobile;
    }, []);

    // Bridge is available if query param indicates mobile app
    const isBridgeAvailable = isMobileApp;

    const sendBridgeEvent = useCallback(
        async (event: 'trading:back' | 'trading:home', fallback?: () => void | Promise<void>) => {
            try {
                if (isBridgeAvailable && window.DerivAppChannel?.postMessage) {
                    const message: DerivAppChannelMessage = { event };
                    window.DerivAppChannel.postMessage(JSON.stringify(message));
                    return true; // Successfully sent via bridge
                } else if (fallback) {
                    await fallback();
                    return true; // Successfully executed fallback
                }
                return false; // No action taken
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to send bridge message:', error);
                // Execute fallback on error
                if (fallback) {
                    try {
                        await fallback();
                        return true; // Fallback executed successfully
                    } catch (fallbackError) {
                        // eslint-disable-next-line no-console
                        console.error('Fallback execution failed:', fallbackError);
                        return false;
                    }
                }
                return false;
            }
        },
        [isBridgeAvailable]
    );

    return {
        sendBridgeEvent,
        isBridgeAvailable,
    };
};
