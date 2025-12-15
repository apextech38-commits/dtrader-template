import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { APIProvider } from '@deriv/api';
import { StoreProvider, mockStore } from '@deriv/stores';
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
    LegacyArrowLeft1pxIcon: () => <div data-testid='arrow-left-icon'>ArrowLeft</div>,
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
const mockIsBridgeAvailable = jest.fn(() => false);
const mockUseMobileBridge = jest.fn(() => ({
    sendBridgeEvent: mockSendBridgeEvent,
    isBridgeAvailable: mockIsBridgeAvailable,
    isDesktop: false,
}));

jest.mock('App/Hooks/useMobileBridge', () => ({
    useMobileBridge: () => mockUseMobileBridge(),
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

// Mock useRemoteConfig
jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useRemoteConfig: jest.fn(() => ({
        data: {
            cs_chat_intercom: true,
            cs_chat_whatsapp: true,
        },
    })),
}));

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
        mockIsBridgeAvailable.mockReturnValue(false);
        mockUseMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: mockIsBridgeAvailable,
            isDesktop: false,
        });
        // Clear DerivAppChannel from window
        delete window.DerivAppChannel;
    });

    it('should clear timeout after component was unmount', () => {
        jest.useFakeTimers();
        jest.spyOn(global, 'clearTimeout');
        const { unmount } = render(mockToggleMenuDrawer());

        unmount();

        expect(clearTimeout).toBeCalled();
    });

    it('should show back icon when bridge is available', () => {
        // Mock bridge available
        mockIsBridgeAvailable.mockReturnValue(true);
        mockUseMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: mockIsBridgeAvailable,
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        // Should contain back icon when bridge is available
        const backIcon = screen.getByTestId('arrow-left-icon');
        expect(backIcon).toBeInTheDocument();
    });

    it('should show hamburger icon when bridge is not available', () => {
        // Mock bridge not available
        mockIsBridgeAvailable.mockReturnValue(false);
        mockUseMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: mockIsBridgeAvailable,
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        // Should contain hamburger icon when bridge is not available
        const hamburgerIcon = screen.getByTestId('hamburger-icon');
        expect(hamburgerIcon).toBeInTheDocument();
    });

    it('should trigger back event when back icon is clicked and bridge is available', async () => {
        // Mock bridge available
        const user = userEvent.setup({ delay: null });
        mockSendBridgeEvent.mockResolvedValue(true);
        mockIsBridgeAvailable.mockReturnValue(true);
        mockUseMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: mockIsBridgeAvailable,
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        const toggleButton = screen.getByTestId('dt_mobile_drawer_toggle');
        await user.click(toggleButton);

        expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:back');
    });

    it('should open drawer when hamburger icon is clicked and bridge is not available', async () => {
        // Mock bridge not available
        const user = userEvent.setup({ delay: null });
        mockIsBridgeAvailable.mockReturnValue(false);
        mockUseMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: mockIsBridgeAvailable,
            isDesktop: false,
        });

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
        mockIsBridgeAvailable.mockReturnValue(false);
        mockUseMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: mockIsBridgeAvailable,
            isDesktop: false,
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
            render(mockToggleMenuDrawer());
            const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
            await userEvent.click(hamburgerButton);

            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));
            expect(homeItem).toBeInTheDocument();

            // Verify icon is present
            expect(screen.getByTestId('home-icon')).toBeInTheDocument();
        });

        it('should send trading:home bridge event when clicked', async () => {
            mockSendBridgeEvent.mockImplementation(() => {
                // Don't call fallback - bridge handles it
            });

            render(mockToggleMenuDrawer());
            const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
            await userEvent.click(hamburgerButton);

            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));
            await userEvent.click(homeItem);

            expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:home', expect.any(Function));
        });

        it('should navigate to correct URL with currency and language when fallback is called', async () => {
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
            await userEvent.click(hamburgerButton);

            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));
            await userEvent.click(homeItem);

            expect(mockLocation.href).toBe(
                'https://deriv.com/options?acc=options&curr=EUR&from=home&source=options&lang=ES'
            );
        });

        it('should encode URL parameters correctly', async () => {
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
            await userEvent.click(hamburgerButton);

            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));
            await userEvent.click(homeItem);

            // Verify that the language parameter is properly encoded
            expect(mockLocation.href).toBe(
                'https://deriv.com/options?acc=options&curr=USD&from=home&source=options&lang=zh-CN'
            );
        });

        it('should handle empty currency gracefully', async () => {
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
            await userEvent.click(hamburgerButton);

            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));
            await userEvent.click(homeItem);

            // Should handle empty currency
            expect(mockLocation.href).toContain('curr=');
        });

        it('should hide Home button when bridge is available', async () => {
            // Mock bridge available
            mockIsBridgeAvailable.mockReturnValue(true);
            mockUseMobileBridge.mockReturnValue({
                sendBridgeEvent: mockSendBridgeEvent,
                isBridgeAvailable: mockIsBridgeAvailable,
                isDesktop: false,
            });

            render(mockToggleMenuDrawer());
            const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
            await userEvent.click(hamburgerButton);

            const homeItems = screen.queryAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));

            // Home button should not be present when bridge is available
            expect(homeItem).toBeUndefined();
        });

        it('should show Home button when bridge is not available', async () => {
            // Mock bridge not available
            mockIsBridgeAvailable.mockReturnValue(false);
            mockUseMobileBridge.mockReturnValue({
                sendBridgeEvent: mockSendBridgeEvent,
                isBridgeAvailable: mockIsBridgeAvailable,
                isDesktop: false,
            });

            render(mockToggleMenuDrawer());
            const hamburgerButton = screen.getByTestId('dt_mobile_drawer_toggle');
            await userEvent.click(hamburgerButton);

            const homeItems = screen.getAllByTestId('drawer-item');
            const homeItem = homeItems.find(item => item.textContent?.includes('Home'));

            // Home button should be present when bridge is not available
            expect(homeItem).toBeInTheDocument();
        });
    });
});
