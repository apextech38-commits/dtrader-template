import { useMemo } from 'react';

import { useRemoteConfig } from '@deriv/api';

import { useMobileBridge } from 'App/Hooks/useMobileBridge';

/**
 * Shared hook that provides native app allowed trade types from remote config.
 * Used by useContractsFor, useGuideContractTypes, and useAvailableContracts.
 *
 * @returns {string[] | undefined} Array of allowed trade type names, undefined if not in mobile bridge, or empty array if config is missing/corrupted
 */
const useNativeAppAllowedTradeTypes = (): string[] | undefined => {
    const { isBridgeAvailable } = useMobileBridge();
    const { data: remoteConfigData } = useRemoteConfig(true);

    const nativeAppAllowedTradeTypes = useMemo(() => {
        if (!isBridgeAvailable) return undefined;
        // Defensive check for edge cases
        if (!remoteConfigData?.native_app_allowed_trade_types) {
            // eslint-disable-next-line no-console
            console.warn('native_app_allowed_trade_types missing from remote config');
            // Return empty array to prevent showing unauthorized trade types on mobile if config is corrupted
            return [];
        }
        return Object.values(remoteConfigData.native_app_allowed_trade_types);
    }, [remoteConfigData, isBridgeAvailable]);

    return nativeAppAllowedTradeTypes;
};

export default useNativeAppAllowedTradeTypes;
