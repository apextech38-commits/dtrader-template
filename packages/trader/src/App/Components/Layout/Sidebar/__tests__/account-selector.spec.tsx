import { mockStore, StoreProvider } from '@deriv/stores';
import { fireEvent, render, screen } from '@testing-library/react';

import { useMobileBridge } from 'App/Hooks/useMobileBridge';

import AccountSelector from '../account-selector';

jest.mock('@deriv-com/translations', () => ({
    localize: (key: string) => key,
}));

jest.mock('App/Hooks/useMobileBridge', () => ({
    useMobileBridge: jest.fn(),
}));

const mockUseMobileBridge = useMobileBridge as jest.MockedFunction<typeof useMobileBridge>;

describe('AccountSelector', () => {
    const defaultStoreConfig = {
        client: {
            logout: jest.fn(),
            is_logged_in: true,
        },
        ui: {
            closeSidebarFlyout: jest.fn(),
        },
    };

    const renderComponent = (storeConfig = defaultStoreConfig) => {
        const store = mockStore(storeConfig);
        return render(
            <StoreProvider store={store}>
                <AccountSelector />
            </StoreProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the mobile bridge mock to default values
        mockUseMobileBridge.mockReturnValue({
            sendBridgeEvent: jest.fn(async (_event_name, callback) => {
                if (callback) await callback();
                return Promise.resolve(true);
            }),
            isBridgeAvailable: false,
        });
    });

    it('should render Log out button when user is logged in', () => {
        renderComponent();
        expect(screen.getByText('Log out')).toBeInTheDocument();
    });

    it('should render "Back to app" button when bridge is available', () => {
        mockUseMobileBridge.mockReturnValue({
            sendBridgeEvent: jest.fn(async (_event_name, callback) => {
                if (callback) await callback();
                return Promise.resolve(true);
            }),
            isBridgeAvailable: true,
        });

        renderComponent();
        expect(screen.getByText('Back to app')).toBeInTheDocument();
        expect(screen.queryByText('Log out')).not.toBeInTheDocument();
    });

    it('should not render Log out button when user is not logged in', () => {
        const loggedOutStore = {
            ...defaultStoreConfig,
            client: {
                ...defaultStoreConfig.client,
                is_logged_in: false,
            },
        };
        renderComponent(loggedOutStore);
        expect(screen.queryByText('Log out')).not.toBeInTheDocument();
    });

    it('should call logout and close flyout when Log out button is clicked', () => {
        const store = mockStore(defaultStoreConfig);
        render(
            <StoreProvider store={store}>
                <AccountSelector />
            </StoreProvider>
        );

        const logoutButton = screen.getByText('Log out');
        fireEvent.click(logoutButton);

        expect(store.client.logout).toHaveBeenCalled();
        expect(store.ui.closeSidebarFlyout).toHaveBeenCalled();
    });
});
