import { useMemo } from 'react';

import { useRemoteConfig } from '@deriv/api';

import { useMobileBridge } from 'App/Hooks/useMobileBridge';
import { getTradeTypesList } from 'AppV2/Utils/trade-types-utils';
import { useTraderStore } from 'Stores/useTraderStores';

/**
 * Lightweight hook for Guide component that uses existing trade store data
 * without triggering API calls. This prevents the barrier reset issue caused
 * by useContractsFor when Guide is displayed during scrolling.
 */
const useGuideContractTypes = () => {
    const { contract_types_list_v2, contract_types_list, is_dtrader_v2 } = useTraderStore();
    const { isBridgeAvailable } = useMobileBridge();
    const { data: remoteConfigData } = useRemoteConfig(true);
    const is_bridge_available = isBridgeAvailable();

    const nativeAppAllowedTradeTypes = useMemo(() => {
        if (!is_bridge_available) return undefined;
        // Defensive check for edge cases
        if (!remoteConfigData?.native_app_allowed_trade_types) {
            // eslint-disable-next-line no-console
            console.warn('native_app_allowed_trade_types missing from remote config');
            // Return empty array to prevent showing unauthorized trade types on mobile if config is corrupted
            return [];
        }
        return Object.values(remoteConfigData.native_app_allowed_trade_types);
    }, [remoteConfigData, is_bridge_available]);

    const trade_types = useMemo(() => {
        // Use the appropriate contract types list based on dtrader version
        const contract_list = is_dtrader_v2 ? contract_types_list_v2 : contract_types_list;

        // If no contract types are available, return empty array
        if (!contract_list || Object.keys(contract_list).length === 0) {
            return [];
        }

        // Use the same logic as useContractsFor but without API calls
        return getTradeTypesList(contract_list, nativeAppAllowedTradeTypes);
    }, [contract_types_list_v2, contract_types_list, is_dtrader_v2, nativeAppAllowedTradeTypes]);

    return { trade_types };
};

export default useGuideContractTypes;
