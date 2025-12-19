import { render, screen } from '@testing-library/react';

import BrandShortLogo from '../brand-short-logo';

const mockSendBridgeEvent = jest.fn();
let mockIsBridgeAvailable = false;
const mockUseMobileBridge = jest.fn(() => ({
    sendBridgeEvent: mockSendBridgeEvent,
    isBridgeAvailable: mockIsBridgeAvailable,
}));

jest.mock('App/Hooks/useMobileBridge', () => ({
    useMobileBridge: () => mockUseMobileBridge(),
}));

describe('BrandShortLogo', () => {
    const renderComponent = () => render(<BrandShortLogo />);

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset useMobileBridge mock to default values
        mockSendBridgeEvent.mockClear();
        mockIsBridgeAvailable = false;
        mockUseMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: mockIsBridgeAvailable,
        });
    });

    it('should render the Deriv logo', () => {
        renderComponent();

        const logoContainer = screen.getByRole('img');
        expect(logoContainer).toBeInTheDocument();

        const logoDiv = screen.getByTestId('brand-logo');
        expect(logoDiv).toBeInTheDocument();
    });

    it('should not render logo when bridge is available (Flutter mobile app)', () => {
        // Mock mobile bridge available
        mockIsBridgeAvailable = true;
        mockUseMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: mockIsBridgeAvailable,
        });

        const { container } = renderComponent();

        // Logo should not be rendered when bridge is available
        expect(container).toBeEmptyDOMElement();
        expect(screen.queryByTestId('brand-logo')).not.toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should render logo when bridge is not available (regular web)', () => {
        // Mock bridge not available
        mockIsBridgeAvailable = false;
        mockUseMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: mockIsBridgeAvailable,
        });

        renderComponent();

        // Logo should be rendered when bridge is not available
        expect(screen.getByTestId('brand-logo')).toBeInTheDocument();
        expect(screen.getByRole('img')).toBeInTheDocument();
    });
});
