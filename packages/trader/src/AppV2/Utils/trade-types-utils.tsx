import React from 'react';

import {
    getContractTypePosition,
    getSupportedContracts,
    TRADE_TYPES,
    unsupported_contract_types_list,
} from '@deriv/shared';

import { getAvailableContractTypes, getCategoriesSortedByKey } from 'Modules/Trading/Helpers/contract-type';
import { useTraderStore } from 'Stores/useTraderStores';

import { getTradeTypeTabsList } from './trade-params-utils';

type TContractType = {
    text?: string;
    value: string;
};

type TCategories = {
    id: string;
    title: string;
    icon?: React.ReactNode;
};

const getSortedIndex = (type: string) =>
    getContractTypePosition(type as keyof ReturnType<typeof getSupportedContracts>) === 'bottom' ? 1 : 0;

export const CONTRACT_LIST = {
    ACCUMULATORS: 'Accumulators',
    VANILLAS: 'Vanillas',
    TURBOS: 'Turbos',
    MULTIPLIERS: 'Multipliers',
    RISE_FALL: 'Rise/Fall',
    HIGHER_LOWER: 'Higher/Lower',
    TOUCH_NO_TOUCH: 'Touch/No Touch',
    MATCHES_DIFFERS: 'Matches/Differs',
    EVEN_ODD: 'Even/Odd',
    OVER_UNDER: 'Over/Under',
};

export const AVAILABLE_CONTRACTS = [
    {
        tradeType: 'Accumulators',
        id: CONTRACT_LIST.ACCUMULATORS,
        for: [TRADE_TYPES.ACCUMULATOR],
    },
    {
        tradeType: 'Vanillas',
        id: CONTRACT_LIST.VANILLAS,
        for: [TRADE_TYPES.VANILLA.CALL, TRADE_TYPES.VANILLA.PUT],
    },
    {
        tradeType: 'Turbos',
        id: CONTRACT_LIST.TURBOS,
        for: [TRADE_TYPES.TURBOS.LONG, TRADE_TYPES.TURBOS.SHORT],
    },
    {
        tradeType: 'Multipliers',
        id: CONTRACT_LIST.MULTIPLIERS,
        for: [TRADE_TYPES.MULTIPLIER],
    },
    {
        tradeType: 'Rise/Fall',
        id: CONTRACT_LIST.RISE_FALL,
        for: [TRADE_TYPES.RISE_FALL, TRADE_TYPES.RISE_FALL_EQUAL],
    },
    {
        tradeType: 'Higher/Lower',
        id: CONTRACT_LIST.HIGHER_LOWER,
        for: [TRADE_TYPES.HIGH_LOW],
    },
    {
        tradeType: 'Touch/No Touch',
        id: CONTRACT_LIST.TOUCH_NO_TOUCH,
        for: [TRADE_TYPES.TOUCH],
    },
    {
        tradeType: 'Matches/Differs',
        id: CONTRACT_LIST.MATCHES_DIFFERS,
        for: [TRADE_TYPES.MATCH_DIFF],
    },
    { tradeType: 'Even/Odd', id: CONTRACT_LIST.EVEN_ODD, for: [TRADE_TYPES.EVEN_ODD] },
    {
        tradeType: 'Over/Under',
        id: CONTRACT_LIST.OVER_UNDER,
        for: [TRADE_TYPES.OVER_UNDER],
    },
];

/**
 * Returns the available contracts list, filtered by native app allowed trade types if provided.
 * @param nativeAppAllowedTradeTypes - Optional array of allowed trade type names from remote config
 * @returns Filtered array of available contracts
 */
export const getAvailableContracts = (nativeAppAllowedTradeTypes?: string[]) => {
    if (!nativeAppAllowedTradeTypes) return AVAILABLE_CONTRACTS;
    return AVAILABLE_CONTRACTS.filter(contract => nativeAppAllowedTradeTypes.includes(contract.id));
};

export const getTradeTypesList = (
    contract_types_list: ReturnType<typeof useTraderStore>['contract_types_list'],
    nativeAppAllowedTradeTypes?: string[]
) => {
    const available_trade_types = getAvailableContractTypes(
        contract_types_list as unknown as Parameters<typeof getAvailableContractTypes>[0],
        unsupported_contract_types_list
    );

    let filtered_types = Object.values(getCategoriesSortedByKey(available_trade_types))
        .map(({ contract_types }) =>
            contract_types[0].value.startsWith('vanilla')
                ? contract_types.map(type => ({ ...type, text: 'Vanillas' }))
                : contract_types
        )
        .flat()
        .filter(
            ({ value }) =>
                ![TRADE_TYPES.VANILLA.PUT, TRADE_TYPES.TURBOS.SHORT, TRADE_TYPES.RISE_FALL_EQUAL].includes(value)
        );

    // Filter for native mobile app - only show allowed trade types from remote config
    if (nativeAppAllowedTradeTypes) {
        filtered_types = filtered_types.filter(({ text }) => text && nativeAppAllowedTradeTypes.includes(text));
    }

    return filtered_types;
};

/* Gets the array of sorted contract types that are used to display purchased buttons and other info based on a selected trade type tab if applicable. */
export const getDisplayedContractTypes = (
    trade_types: ReturnType<typeof useTraderStore>['trade_types'],
    contract_type: string,
    trade_type_tab: string
) => {
    const trade_type_tabs = getTradeTypeTabsList(contract_type);
    const available_types = Object.keys(trade_types);

    // If there are no trade type tabs, return all available types
    if (!trade_type_tabs.length) {
        return available_types.sort((a, b) => getSortedIndex(a) - getSortedIndex(b));
    }

    // Special handling for trade types with tabs but empty trade_types object
    // This can happen when the store hasn't been properly populated yet
    if (available_types.length === 0 && trade_type_tabs.length > 0) {
        // Return the contract types from the tabs configuration
        const fallback_types = trade_type_tabs.map(tab => tab.contract_type);
        return fallback_types.sort((a, b) => getSortedIndex(a) - getSortedIndex(b));
    }

    // If trade_type_tab is set, filter by it
    if (trade_type_tab) {
        const filtered_types = available_types.filter(type => type === trade_type_tab);
        // If filtering results in empty array but we have a valid trade_type_tab, return it
        if (filtered_types.length === 0 && trade_type_tabs.some(tab => tab.contract_type === trade_type_tab)) {
            return [trade_type_tab];
        }
        return filtered_types.sort((a, b) => getSortedIndex(a) - getSortedIndex(b));
    }

    // If trade_type_tab is not set but there are tabs, return all available types
    // This ensures buttons are displayed even when trade_type_tab hasn't been initialized yet
    return available_types.sort((a, b) => getSortedIndex(a) - getSortedIndex(b));
};

export const sortCategoriesInTradeTypeOrder = (trade_types: TContractType[], categories: TCategories[]) => {
    return trade_types
        .map((item: { value: string }) => {
            return categories.find(category => category.id === item.value);
        })
        .filter(item => item) as TCategories[];
};

/**
 * Checks if two contract types belong to the same trade type category.
 * For example, vanillalongcall and vanillalongput belong to the same "Vanillas" category,
 * turboslong and turbosshort belong to the same "Turbos" category.
 *
 * @param contract_type_1 - First contract type to compare
 * @param contract_type_2 - Second contract type to compare
 * @returns true if both contract types belong to the same category, false otherwise
 */
export const isSameTradeTypeCategory = (contract_type_1: string, contract_type_2: string): boolean => {
    // Find the category that contains the first contract type
    const category = AVAILABLE_CONTRACTS.find(contract => contract.for.includes(contract_type_1));

    // Check if the second contract type is also in the same category
    return category ? category.for.includes(contract_type_2) : contract_type_1 === contract_type_2;
};
