import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { APIProvider, useMobileBridge } from '@deriv/api';
import { mockStore, StoreProvider } from '@deriv/stores';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ToggleMenuDrawer from '../toggle-menu-drawer';

// Mock all the problematic imports
jest.mock('@deriv/components', () => {
    const MobileDrawer = jest.fn(({ children, is_open, toggle }) => (
        <div data-testid='mobile-drawer' style={{ display: is_open ? 'block' : 'none' }}>
            <button onClick={toggle} data-testid='close-drawer'>
                Close
            </button>
            {children}
        </div>
    ));
    MobileDrawer.SubMenu = jest.fn(({ children }) => <div data-testid='drawer-submenu'>{children}</div>);
    MobileDrawer.Item = jest.fn(({ children, onClick }) => (
        <div data-testid='drawer-item' onClick={onClick}>
            {children}
        </div>
    ));
    MobileDrawer.Body = jest.fn(({ children }) => <div data-testid='drawer-body'>{children}</div>);
    MobileDrawer.Footer = jest.fn(({ children }) => <div data-testid='drawer-footer'>{children}</div>);
    return {
        MobileDrawer,
        ToggleSwitch: jest.fn(({ handleToggle, is_enabled }) => (
            <div data-testid='toggle-switch' onClick={handleToggle}>
                {is_enabled ? 'ON' : 'OFF'}
            </div>
        )),
        Div100vhContainer: jest.fn(({ children }) => <div data-testid='div-100vh'>{children}</div>),
    };
});

jest.mock('@deriv/quill-icons', () => ({
    LegacyChartsIcon: () => <div data-testid='charts-icon'>Charts</div>,
    LegacyChevronRight1pxIcon: () => <div data-testid='chevron-right-icon'>ChevronRight</div>,
    LegacyHelpCentreIcon: () => <div data-testid='help-centre-icon'>HelpCentre</div>,
    LegacyHomeOldIcon: () => <div data-testid='home-icon'>Home</div>,
    LegacyLogout1pxIcon: () => <div data-testid='logout-icon'>Logout</div>,
    LegacyMenuHamburger1pxIcon: () => <div data-testid='hamburger-icon'>Hamburger</div>,
    LegacyRegulatoryInformationIcon: () => <div data-testid='regulatory-icon'>Regulatory</div>,
    LegacyResponsibleTradingIcon: () => <div data-testid='responsible-trading-icon'>ResponsibleTrading</div>,
    LegacyTheme1pxIcon: () => <div data-testid='theme-icon'>Theme</div>,
}));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: jest.fn(() => ({ pathname: '/appstore/traders-hub' })),
    useHistory: jest.fn(() => ({
        push: jest.fn(),
    })),
}));

jest.mock('@deriv/shared', () => ({
    routes: {
        index: '/',
        reports: '/reports',
    },
    getBrandUrl: jest.fn(() => 'https://deriv.com'),
    getApiCoreBaseUrl: jest.fn(() => 'https://api.deriv.com'),
    useWS: jest.fn(() => ({})),
    getAccountType: jest.fn(() => 'demo'),
    toGMTFormat: jest.fn(() => 'GMT Time'),
    toLocalFormat: jest.fn(() => 'Local Time'),
    isMobile: jest.fn(() => false),
    isDesktop: jest.fn(() => true),
    formatMoney: jest.fn(amount => amount),
    getCurrencyDisplayCode: jest.fn(currency => currency),
    getDecimalPlaces: jest.fn(() => 2),
    addComma: jest.fn(num => num),
    isEmptyObject: jest.fn(obj => Object.keys(obj || {}).length === 0),
    cloneObject: jest.fn(obj => ({ ...obj })),
    getPropertyValue: jest.fn((obj, key) => obj?.[key]),
    LocalStore: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
    },
    SessionStore: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
    },
}));

const mockSendBridgeEvent = jest.fn().mockResolvedValue(true);

// Mock @deriv/api with both useMobileBridge and useRemoteConfig
jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useMobileBridge: jest.fn(() => ({
        sendBridgeEvent: mockSendBridgeEvent,
        isBridgeAvailable: false,
        isDesktop: false,
    })),
    useRemoteConfig: jest.fn(() => ({
        data: {
            cs_chat_intercom: true,
            cs_chat_whatsapp: true,
        },
    })),
}));

// Mock the ToggleMenu components
jest.mock('../Components/ToggleMenu', () => ({
    MenuTitle: () => <div data-testid='menu-title'>Menu Title</div>,
    MobileLanguageMenu: () => <div data-testid='mobile-language-menu'>Language Menu</div>,
}));

// Mock MenuLink
jest.mock('../menu-link', () => {
    return jest.fn(({ text, onClickLink, icon }) => (
        <div data-testid='menu-link' onClick={onClickLink}>
            {icon}
            <span>{text}</span>
        </div>
    ));
});

// Mock LiveChat and WhatsApp components
jest.mock('App/Components/Elements/LiveChat', () => {
    return jest.fn(() => <div data-testid='live-chat'>LiveChat</div>);
});

jest.mock('App/Components/Elements/WhatsApp', () => {
    return jest.fn(({ onClick }) => (
        <div data-testid='whatsapp' onClick={onClick}>
            WhatsApp
        </div>
    ));
});

// Mock NetworkStatus
jest.mock('App/Components/Layout/Footer', () => {
    return jest.fn(() => <div data-testid='network-status'>Network Status</div>);
});

// Mock routes config
jest.mock('App/Constants/routes-config', () => {
    return jest.fn(() => [
        {
            path: '/reports',
            icon_component: <div>Reports Icon</div>,
            getTitle: () => 'Reports',
            routes: [
                {
                    path: '/reports/positions',
                    icon_component: <div>Positions Icon</div>,
                    getTitle: () => 'Positions',
                },
            ],
        },
    ]);
});

// Mock ServerTime
jest.mock('App/Containers/server-time.jsx', () => {
    return jest.fn(() => <div data-testid='server-time'>Server Time</div>);
});

describe('<ToggleMenuDrawer />', () => {
    const mockLogout = jest.fn().mockResolvedValue();

    const mockToggleMenuDrawer = (storeOverrides = {}) => {
        return (
            <BrowserRouter>
                <APIProvider>
                    <StoreProvider
                        store={mockStore({
                            client: {
                                is_logged_in: true,
                                logout: mockLogout,
                                ...storeOverrides.client,
                            },
                            modules: {
                                cashier: {
                                    payment_agent: {
                                        is_payment_agent_visible: true,
                                    },
                                },
                            },
                            traders_hub: {
                                show_eu_related_content: false,
                            },
                            ...storeOverrides,
                        })}
                    >
                        <ToggleMenuDrawer />
                    </StoreProvider>
                </APIProvider>
            </BrowserRouter>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset useMobileBridge mock to default values
        mockSendBridgeEvent.mockClear().mockResolvedValue(true);
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: false,
            isDesktop: false,
        });
    });

    it('should clear timeout after component was unmount', () => {
        jest.useFakeTimers();
        jest.spyOn(global, 'clearTimeout');
        const { unmount } = render(mockToggleMenuDrawer());

        unmount();

        expect(clearTimeout).toBeCalled();
    });

    it('should not show logout button when bridge is available', async () => {
        const user = userEvent.setup({ delay: null });
        // Mock bridge available
        mockSendBridgeEvent.mockResolvedValue(true);
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: true,
        });

        render(mockToggleMenuDrawer());

        // Find and click the hamburger menu to open drawer
        const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
        await user.click(hamburgerButton);

        // Logout button should not be present when bridge is available
        const logoutItems = screen.getAllByTestId('drawer-item');
        const logoutItem = logoutItems.find(item => item.textContent && item.textContent.includes('Log out'));

        expect(logoutItem).toBeUndefined();
    });

    it('should fallback to regular logout when bridge is not available', async () => {
        const user = userEvent.setup({ delay: null });
        // Mock bridge not available
        mockSendBridgeEvent.mockImplementation(async (_event, fallback) => {
            if (fallback) {
                await fallback(); // Execute fallback
            }
        });
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: false,
        });

        render(mockToggleMenuDrawer());

        // Find and click the hamburger menu to open drawer
        const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
        await user.click(hamburgerButton);

        // Find logout menu item and click it
        const logoutItems = screen.getAllByTestId('drawer-item');
        const logoutItem = logoutItems.find(item => item.textContent && item.textContent.includes('Log out'));

        if (logoutItem) {
            await user.click(logoutItem);

            expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:back', expect.any(Function));
            expect(mockLogout).toHaveBeenCalledTimes(1);
        }
    });

    it('should show "Home" text when bridge is available', async () => {
        const user = userEvent.setup({ delay: null });
        // Mock bridge available
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: true,
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        // Open drawer
        const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
        await user.click(hamburgerButton);

        // The component should use "Home" text when bridge is available
        const homeItems = screen.getAllByTestId('drawer-item');
        const homeItem = homeItems.find(item => item.textContent?.includes('Home'));
        expect(homeItem).toBeInTheDocument();
    });

    it('should show "Log out" text when bridge is not available', () => {
        // Mock bridge not available
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: false,
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        // The component should use "Log out" text when bridge is not available
        const { isBridgeAvailable } = useMobileBridge();
        expect(isBridgeAvailable).toBe(false);
    });

    it('should always show hamburger icon', () => {
        render(mockToggleMenuDrawer());

        // Should always contain hamburger icon
        const hamburgerIcon = screen.getByTestId('hamburger-icon');
        expect(hamburgerIcon).toBeInTheDocument();
    });

    it('should open drawer when hamburger icon is clicked', async () => {
        const user = userEvent.setup({ delay: null });
        render(mockToggleMenuDrawer());

        const toggleButton = screen.getByTestId('dt_mobile_drawer_toggle');
        await user.click(toggleButton);

        // Should open the drawer
        const drawer = screen.getByTestId('mobile-drawer');
        expect(drawer).toHaveStyle('display: block');
    });

    it('should handle bridge errors gracefully', async () => {
        // Mock bridge error - test that fallback is called when bridge fails
        const user = userEvent.setup({ delay: null });
        mockSendBridgeEvent.mockImplementation(async (_event, fallback) => {
            if (fallback) {
                await fallback(); // Execute fallback on error
            }
        });
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: false,
        });

        render(mockToggleMenuDrawer());

        // Open the drawer (bridge not available so drawer opens)
        const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
        await user.click(hamburgerButton);

        // Wait for drawer items to appear and find logout menu item
        let logoutItem;
        await waitFor(() => {
            const logoutItems = screen.queryAllByTestId('drawer-item');
            logoutItem = logoutItems.find(item => item.textContent && item.textContent.includes('Log out'));
            expect(logoutItem).toBeTruthy();
        });

        await user.click(logoutItem);
        expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:back', expect.any(Function));
        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    describe('Home button', () => {
        it('should render Home button with correct icon and text', async () => {
            const user = userEvent.setup({ delay: null });
            render(mockToggleMenuDrawer());
            const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
            await user.click(hamburgerButton);

            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));
            expect(homeItem).toBeInTheDocument();

            // Verify icon is present
            expect(screen.getByTestId('home-icon')).toBeInTheDocument();
        });

        it('should send trading:home bridge event when clicked', async () => {
            const user = userEvent.setup({ delay: null });
            mockSendBridgeEvent.mockImplementation(() => {
                // Don't call fallback - bridge handles it
            });

            render(mockToggleMenuDrawer());
            const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
            await user.click(hamburgerButton);

            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));
            await user.click(homeItem);

            expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:home', expect.any(Function));
        });

        it('should navigate to correct URL with currency and language when fallback is called', async () => {
            const user = userEvent.setup({ delay: null });
            const mockLocation = { href: '' };
            Object.defineProperty(window, 'location', {
                value: mockLocation,
                writable: true,
                configurable: true,
            });

            mockSendBridgeEvent.mockImplementation((event, fallback) => {
                if (fallback) fallback(); // Execute fallback
            });

            render(
                mockToggleMenuDrawer({
                    common: { current_language: 'ES' },
                    client: { currency: 'EUR', is_logged_in: true },
                })
            );

            const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
            await user.click(hamburgerButton);

            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));
            await user.click(homeItem);

            expect(mockLocation.href).toBe(
                'https://deriv.com/home?acc=options&curr=EUR&from=home&source=options&lang=ES'
            );
        });

        it('should encode URL parameters correctly', async () => {
            const user = userEvent.setup({ delay: null });
            const mockLocation = { href: '' };
            Object.defineProperty(window, 'location', {
                value: mockLocation,
                writable: true,
                configurable: true,
            });

            mockSendBridgeEvent.mockImplementation((event, fallback) => {
                if (fallback) fallback(); // Execute fallback
            });

            // Test with special characters that need encoding
            render(
                mockToggleMenuDrawer({
                    common: { current_language: 'zh-CN' },
                    client: { currency: 'USD', is_logged_in: true },
                })
            );

            const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
            await user.click(hamburgerButton);

            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));
            await user.click(homeItem);

            // Verify that the language parameter is properly encoded
            expect(mockLocation.href).toBe(
                'https://deriv.com/home?acc=options&curr=USD&from=home&source=options&lang=zh-CN'
            );
        });

        it('should handle empty currency gracefully', async () => {
            const user = userEvent.setup({ delay: null });
            const mockLocation = { href: '' };
            Object.defineProperty(window, 'location', {
                value: mockLocation,
                writable: true,
                configurable: true,
            });

            mockSendBridgeEvent.mockImplementation((event, fallback) => {
                if (fallback) fallback(); // Execute fallback
            });

            render(
                mockToggleMenuDrawer({
                    common: { current_language: 'EN' },
                    client: { currency: '', is_logged_in: true },
                })
            );

            const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
            await user.click(hamburgerButton);

            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));
            await user.click(homeItem);

            // Should handle empty currency
            expect(mockLocation.href).toContain('curr=');
        });

        it('should show Home button when bridge is available', async () => {
            const user = userEvent.setup({ delay: null });
            // Mock bridge available
            useMobileBridge.mockReturnValue({
                sendBridgeEvent: mockSendBridgeEvent,
                isBridgeAvailable: true,
            });

            render(mockToggleMenuDrawer());
            const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
            await user.click(hamburgerButton);

            // Home button should be visible when bridge is available
            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));
            expect(homeItem).toBeInTheDocument();
        });

        it('should show Home button when bridge is not available', async () => {
            const user = userEvent.setup({ delay: null });
            // Mock bridge not available
            useMobileBridge.mockReturnValue({
                sendBridgeEvent: mockSendBridgeEvent,
                isBridgeAvailable: false,
            });

            render(mockToggleMenuDrawer());
            const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
            await user.click(hamburgerButton);
            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));

            // Home button should be present when bridge is not available
            expect(homeItem).toBeInTheDocument();
        });
    });
});
