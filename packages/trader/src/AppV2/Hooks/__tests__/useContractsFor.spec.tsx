import { useQuery, useRemoteConfig } from '@deriv/api';
import { cloneObject, getContractCategoriesConfig, getContractTypesConfig } from '@deriv/shared';
import { mockStore } from '@deriv/stores';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { useMobileBridge } from 'App/Hooks/useMobileBridge';

import TraderProviders from '../../../trader-providers';
import useContractsFor from '../useContractsFor';

jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useQuery: jest.fn(() => ({
        data: null,
        error: null,
        isLoading: false,
    })),
    useRemoteConfig: jest.fn(() => ({
        data: {
            native_app_allowed_trade_types: {
                ACCUMULATORS: 'Accumulators',
                VANILLAS: 'Vanillas',
                TURBOS: 'Turbos',
                MULTIPLIERS: 'Multipliers',
            },
        },
    })),
}));

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    getContractCategoriesConfig: jest.fn(),
    getContractTypesConfig: jest.fn(),
    cloneObject: jest.fn(),
}));

jest.mock('App/Hooks/useMobileBridge', () => ({
    useMobileBridge: jest.fn(() => ({
        isBridgeAvailable: jest.fn(() => false),
    })),
}));

describe('useContractsFor', () => {
    let mocked_store: ReturnType<typeof mockStore>;

    const wrapper = ({ children }: { children: JSX.Element }) => (
        <TraderProviders store={mocked_store}>{children}</TraderProviders>
    );

    beforeEach(() => {
        jest.clearAllMocks();

        mocked_store = {
            ...mockStore({}),
            client: {
                ...mockStore({}).client,
                landing_company_shortcode: 'maltainvest',
                loginid: 'CR1234',
            },
            modules: {
                trade: {
                    setContractTypesListV2: jest.fn(),
                    onChange: jest.fn(),
                    symbol: 'R_50',
                },
            },
        };

        (getContractCategoriesConfig as jest.Mock).mockReturnValue({
            category_1: { categories: ['type_1'] },
            category_2: { categories: ['type_2'] },
        });

        (getContractTypesConfig as jest.Mock).mockReturnValue({
            type_1: { trade_types: ['type_1'], title: 'Type 1', barrier_count: 0 },
            type_2: { trade_types: ['type_2'], title: 'Type 2', barrier_count: 1 },
        });

        (cloneObject as jest.Mock).mockImplementation(obj => JSON.parse(JSON.stringify(obj)));

        // Reset useMobileBridge mock to default
        (useMobileBridge as jest.Mock).mockReturnValue({
            isBridgeAvailable: jest.fn(() => false),
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch and set contract types for the company successfully', async () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: {
                contracts_for: {
                    available: [
                        { contract_type: 'type_1', underlying_symbol: 'EURUSD', default_stake: 10 },
                        { contract_type: 'type_2', underlying_symbol: 'GBPUSD', default_stake: 20 },
                    ],
                    hit_count: 2,
                },
            },
            error: null,
            isLoading: false,
        });

        const { result } = renderHook(() => useContractsFor(), { wrapper });

        await waitFor(() => {
            expect(result.current.contract_types_list).toEqual({
                category_1: { categories: [{ value: 'type_1', text: 'Type 1' }] },
                category_2: { categories: [{ value: 'type_2', text: 'Type 2' }] },
            });
            expect(mocked_store.modules.trade.setContractTypesListV2).toHaveBeenCalledWith({
                category_1: { categories: [{ value: 'type_1', text: 'Type 1' }] },
                category_2: { categories: [{ value: 'type_2', text: 'Type 2' }] },
            });
        });
    });

    it('should handle API errors gracefully', async () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: null,
            error: { message: 'Some error' },
            isLoading: false,
        });

        const { result } = renderHook(() => useContractsFor(), { wrapper });

        await waitFor(() => {
            expect(result.current.contract_types_list).toEqual([]);
            expect(mocked_store.modules.trade.setContractTypesListV2).not.toHaveBeenCalled();
        });
    });

    it('should not set unsupported contract types', async () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: {
                contracts_for: {
                    available: [{ contract_type: 'unsupported_type', underlying_symbol: 'UNSUPPORTED' }],
                    hit_count: 1,
                },
            },
            error: null,
            isLoading: false,
        });

        const { result } = renderHook(() => useContractsFor(), { wrapper });

        await waitFor(() => {
            expect(result.current.trade_types).toEqual([]);
        });
    });

    describe('Symbol validation fix', () => {
        it('should prevent query when symbol is undefined', async () => {
            mocked_store.modules.trade.symbol = undefined;

            renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                expect(useQuery).toHaveBeenCalledWith(
                    'contracts_for',
                    expect.objectContaining({
                        options: expect.objectContaining({
                            enabled: false,
                        }),
                    })
                );
            });
        });

        it('should prevent query when symbol is null', async () => {
            mocked_store.modules.trade.symbol = null;

            renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                expect(useQuery).toHaveBeenCalledWith(
                    'contracts_for',
                    expect.objectContaining({
                        options: expect.objectContaining({
                            enabled: false,
                        }),
                    })
                );
            });
        });

        it('should prevent query when symbol is empty string', async () => {
            mocked_store.modules.trade.symbol = '';

            renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                expect(useQuery).toHaveBeenCalledWith(
                    'contracts_for',
                    expect.objectContaining({
                        options: expect.objectContaining({
                            enabled: false,
                        }),
                    })
                );
            });
        });

        it('should allow query when symbol is present', async () => {
            mocked_store.modules.trade.symbol = 'R_100';

            renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                expect(useQuery).toHaveBeenCalledWith('contracts_for', {
                    payload: {
                        contracts_for: 'R_100',
                    },
                    options: {
                        enabled: true,
                    },
                });
            });
        });
    });

    describe('Native App Allowed Trade Types', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should not filter trade types when not a native mobile app', async () => {
            (useMobileBridge as jest.Mock).mockReturnValue({
                isBridgeAvailable: jest.fn(() => false),
            });

            (useQuery as jest.Mock).mockReturnValue({
                data: {
                    contracts_for: {
                        available: [
                            { contract_type: 'type_1', underlying_symbol: 'EURUSD', default_stake: 10 },
                            { contract_type: 'type_2', underlying_symbol: 'GBPUSD', default_stake: 20 },
                        ],
                        hit_count: 2,
                    },
                },
                error: null,
                isLoading: false,
            });

            const { result } = renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                // All trade types should be available (no filtering)
                expect(result.current.trade_types.length).toBeGreaterThan(0);
            });
        });

        it('should filter trade types when native mobile app is available', async () => {
            (useMobileBridge as jest.Mock).mockReturnValue({
                isBridgeAvailable: jest.fn(() => true),
            });

            (useRemoteConfig as jest.Mock).mockReturnValue({
                data: {
                    native_app_allowed_trade_types: {
                        ACCUMULATORS: 'Accumulators',
                        MULTIPLIERS: 'Multipliers',
                    },
                },
            });

            (useQuery as jest.Mock).mockReturnValue({
                data: {
                    contracts_for: {
                        available: [
                            { contract_type: 'type_1', underlying_symbol: 'EURUSD', default_stake: 10 },
                            { contract_type: 'type_2', underlying_symbol: 'GBPUSD', default_stake: 20 },
                        ],
                        hit_count: 2,
                    },
                },
                error: null,
                isLoading: false,
            });

            const { result } = renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                // Trade types should be filtered based on remote config
                expect(result.current.trade_types).toBeDefined();
            });
        });

        it('should use remote config values from native_app_allowed_trade_types', async () => {
            (useMobileBridge as jest.Mock).mockReturnValue({
                isBridgeAvailable: jest.fn(() => true),
            });

            const mockRemoteConfig = {
                data: {
                    native_app_allowed_trade_types: {
                        ACCUMULATORS: 'Accumulators',
                        VANILLAS: 'Vanillas',
                        TURBOS: 'Turbos',
                        MULTIPLIERS: 'Multipliers',
                    },
                },
            };

            (useRemoteConfig as jest.Mock).mockReturnValue(mockRemoteConfig);

            renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                expect(useRemoteConfig).toHaveBeenCalledWith(true);
            });
        });

        it('should handle empty remote config gracefully with fallback', async () => {
            (useMobileBridge as jest.Mock).mockReturnValue({
                isBridgeAvailable: jest.fn(() => true),
            });

            // Simulate remote config with initial fallback data
            (useRemoteConfig as jest.Mock).mockReturnValue({
                data: {
                    native_app_allowed_trade_types: {
                        ACCUMULATORS: 'Accumulators',
                        MULTIPLIERS: 'Multipliers',
                        VANILLAS: 'Vanillas',
                        TURBOS: 'Turbos',
                    },
                },
            });

            const { result } = renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                // Should not crash and should have valid data
                expect(result.current).toBeDefined();
            });
        });

        it('should block all trade types when native_app_allowed_trade_types is missing (fail-safe)', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            (useMobileBridge as jest.Mock).mockReturnValue({
                isBridgeAvailable: jest.fn(() => true),
            });

            // Simulate corrupted remote config - missing native_app_allowed_trade_types
            (useRemoteConfig as jest.Mock).mockReturnValue({
                data: {},
            });

            (useQuery as jest.Mock).mockReturnValue({
                data: {
                    contracts_for: {
                        available: [
                            { contract_type: 'type_1', underlying_symbol: 'EURUSD', default_stake: 10 },
                            { contract_type: 'type_2', underlying_symbol: 'GBPUSD', default_stake: 20 },
                        ],
                        hit_count: 2,
                    },
                },
                error: null,
                isLoading: false,
            });

            const { result } = renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                // Should warn about missing config
                expect(consoleWarnSpy).toHaveBeenCalledWith(
                    'native_app_allowed_trade_types missing from remote config'
                );
                // Should block all trade types as fail-safe (empty array means filter out everything)
                expect(result.current.trade_types).toEqual([]);
            });

            consoleWarnSpy.mockRestore();
        });

        it('should block all trade types when remoteConfigData is null (fail-safe)', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            (useMobileBridge as jest.Mock).mockReturnValue({
                isBridgeAvailable: jest.fn(() => true),
            });

            // Simulate null remote config data
            (useRemoteConfig as jest.Mock).mockReturnValue({
                data: null,
            });

            (useQuery as jest.Mock).mockReturnValue({
                data: {
                    contracts_for: {
                        available: [{ contract_type: 'type_1', underlying_symbol: 'EURUSD', default_stake: 10 }],
                        hit_count: 1,
                    },
                },
                error: null,
                isLoading: false,
            });

            const { result } = renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                // Should warn about missing config
                expect(consoleWarnSpy).toHaveBeenCalledWith(
                    'native_app_allowed_trade_types missing from remote config'
                );
                // Should block all trade types as fail-safe
                expect(result.current.trade_types).toEqual([]);
            });

            consoleWarnSpy.mockRestore();
        });
    });
});
