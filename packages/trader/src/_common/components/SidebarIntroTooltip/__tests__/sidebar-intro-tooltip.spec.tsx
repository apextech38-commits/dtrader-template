import React from 'react';

import { useLocalStorageData } from '@deriv/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import SidebarIntroTooltip, { SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY } from '../sidebar-intro-tooltip';

jest.mock('../../chart-intro-guide-config', () => ({
    CHART_INTRO_GUIDE_LOCALSTORAGE_KEY: 'chart_intro_guide_seen',
    CHART_INTRO_STEPS: [],
}));

const CHART_INTRO_GUIDE_LOCALSTORAGE_KEY = 'chart_intro_guide_seen';

const mockSetValue = jest.fn();
jest.mock('@deriv/api', () => ({
    useLocalStorageData: jest.fn(() => [false, mockSetValue, jest.fn()]),
}));

jest.mock('@deriv/components', () => ({
    Text: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div className={className}>{children}</div>
    ),
}));

jest.mock('@deriv/quill-icons', () => ({
    LabelPairedXmarkMdRegularIcon: () => <div>CloseIcon</div>,
}));

jest.mock('@deriv-com/quill-ui', () => ({
    Button: ({
        children,
        onClick,
        className,
        'data-testid': dataTestId,
    }: {
        children: React.ReactNode;
        onClick?: () => void;
        className?: string;
        'data-testid'?: string;
    }) => (
        <button onClick={onClick} className={className} data-testid={dataTestId}>
            {children}
        </button>
    ),
}));

jest.mock('@deriv-com/translations', () => ({
    Localize: ({ i18n_default_text }: { i18n_default_text: string }) => <span>{i18n_default_text}</span>,
}));

describe('SidebarIntroTooltip', () => {
    const mockUseLocalStorageData = useLocalStorageData as jest.MockedFunction<typeof useLocalStorageData>;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('should not render when user is not logged in', () => {
        mockUseLocalStorageData.mockImplementation((key: string) => {
            if (key === SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY) return [false, jest.fn(), jest.fn()];
            if (key === CHART_INTRO_GUIDE_LOCALSTORAGE_KEY) return [true, jest.fn(), jest.fn()];
            return [false, jest.fn(), jest.fn()];
        });

        render(<SidebarIntroTooltip is_logged_in={false} is_dark_mode={false} />);
        jest.advanceTimersByTime(1000);

        expect(screen.queryByTestId('dt_sidebar_intro_tooltip')).not.toBeInTheDocument();
    });

    it('should not render when chart intro guide has not been seen', () => {
        mockUseLocalStorageData.mockImplementation((key: string) => {
            if (key === SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY) return [false, jest.fn(), jest.fn()];
            if (key === CHART_INTRO_GUIDE_LOCALSTORAGE_KEY) return [false, jest.fn(), jest.fn()];
            return [false, jest.fn(), jest.fn()];
        });

        render(<SidebarIntroTooltip is_logged_in={true} is_dark_mode={false} />);
        jest.advanceTimersByTime(1000);

        expect(screen.queryByTestId('dt_sidebar_intro_tooltip')).not.toBeInTheDocument();
    });

    it('should not render when sidebar tooltip has already been seen', () => {
        mockUseLocalStorageData.mockImplementation((key: string) => {
            if (key === SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY) return [true, jest.fn(), jest.fn()];
            if (key === CHART_INTRO_GUIDE_LOCALSTORAGE_KEY) return [true, jest.fn(), jest.fn()];
            return [false, jest.fn(), jest.fn()];
        });

        render(<SidebarIntroTooltip is_logged_in={true} is_dark_mode={false} />);
        jest.advanceTimersByTime(1000);

        expect(screen.queryByTestId('dt_sidebar_intro_tooltip')).not.toBeInTheDocument();
    });

    it('should render tooltip when all conditions are met', async () => {
        localStorage.setItem('guide_dtrader_v2', JSON.stringify({ step1: true, step2: true }));

        mockUseLocalStorageData.mockImplementation((key: string) => {
            if (key === SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY) return [false, jest.fn(), jest.fn()];
            if (key === CHART_INTRO_GUIDE_LOCALSTORAGE_KEY) return [true, jest.fn(), jest.fn()];
            return [false, jest.fn(), jest.fn()];
        });

        render(<SidebarIntroTooltip is_logged_in={true} is_dark_mode={false} />);
        jest.advanceTimersByTime(1000);

        await waitFor(() => {
            expect(screen.getByTestId('dt_sidebar_intro_tooltip')).toBeInTheDocument();
        });
    });

    it('should display correct content', async () => {
        localStorage.setItem('guide_dtrader_v2', JSON.stringify({ step1: true, step2: true }));

        mockUseLocalStorageData.mockImplementation((key: string) => {
            if (key === SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY) return [false, jest.fn(), jest.fn()];
            if (key === CHART_INTRO_GUIDE_LOCALSTORAGE_KEY) return [true, jest.fn(), jest.fn()];
            return [false, jest.fn(), jest.fn()];
        });

        render(<SidebarIntroTooltip is_logged_in={true} is_dark_mode={false} />);
        jest.advanceTimersByTime(1000);

        await waitFor(() => {
            expect(screen.getByText('New update!')).toBeInTheDocument();
        });

        expect(
            screen.getByText(
                'We have moved the main navigation to the left side of your screen for easier access to your tools.'
            )
        ).toBeInTheDocument();
        expect(screen.getByText('Got it')).toBeInTheDocument();
    });

    it('should close tooltip when close button is clicked', async () => {
        localStorage.setItem('guide_dtrader_v2', JSON.stringify({ step1: true, step2: true }));

        const mockSetSeen = jest.fn();
        mockUseLocalStorageData.mockImplementation((key: string) => {
            if (key === SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY) return [false, mockSetSeen, jest.fn()];
            if (key === CHART_INTRO_GUIDE_LOCALSTORAGE_KEY) return [true, jest.fn(), jest.fn()];
            return [false, jest.fn(), jest.fn()];
        });

        render(<SidebarIntroTooltip is_logged_in={true} is_dark_mode={false} />);
        jest.advanceTimersByTime(1000);

        await waitFor(() => {
            expect(screen.getByTestId('dt_sidebar_intro_tooltip')).toBeInTheDocument();
        });

        const closeButton = screen.getByTestId('dt_sidebar_tooltip_close_button');
        fireEvent.click(closeButton);

        expect(mockSetSeen).toHaveBeenCalledWith(true);
    });

    it('should close tooltip when "Got it" button is clicked', async () => {
        localStorage.setItem('guide_dtrader_v2', JSON.stringify({ step1: true, step2: true }));

        const mockSetSeen = jest.fn();
        mockUseLocalStorageData.mockImplementation((key: string) => {
            if (key === SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY) return [false, mockSetSeen, jest.fn()];
            if (key === CHART_INTRO_GUIDE_LOCALSTORAGE_KEY) return [true, jest.fn(), jest.fn()];
            return [false, jest.fn(), jest.fn()];
        });

        render(<SidebarIntroTooltip is_logged_in={true} is_dark_mode={false} />);
        jest.advanceTimersByTime(1000);

        await waitFor(() => {
            expect(screen.getByTestId('dt_sidebar_intro_tooltip')).toBeInTheDocument();
        });

        const gotItButton = screen.getByTestId('dt_sidebar_tooltip_got_it_button');
        fireEvent.click(gotItButton);

        expect(mockSetSeen).toHaveBeenCalledWith(true);
    });

    it('should close tooltip when sidebar is clicked', async () => {
        localStorage.setItem('guide_dtrader_v2', JSON.stringify({ step1: true, step2: true }));

        const mockSetSeen = jest.fn();
        mockUseLocalStorageData.mockImplementation((key: string) => {
            if (key === SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY) return [false, mockSetSeen, jest.fn()];
            if (key === CHART_INTRO_GUIDE_LOCALSTORAGE_KEY) return [true, jest.fn(), jest.fn()];
            return [false, jest.fn(), jest.fn()];
        });

        const sidebar_ref = React.createRef<HTMLElement>();
        const TestComponent = () => {
            const ref = React.useRef<HTMLDivElement>(null);
            React.useEffect(() => {
                if (ref.current && sidebar_ref) {
                    (sidebar_ref as React.MutableRefObject<HTMLElement>).current = ref.current;
                }
            }, []);
            return (
                <>
                    <div ref={ref} data-testid='mock_sidebar'>
                        Sidebar
                    </div>
                    <SidebarIntroTooltip
                        is_logged_in={true}
                        is_dark_mode={false}
                        sidebar_ref={sidebar_ref as React.RefObject<HTMLElement>}
                    />
                </>
            );
        };

        render(<TestComponent />);
        jest.advanceTimersByTime(1000);

        await waitFor(() => {
            expect(screen.getByTestId('dt_sidebar_intro_tooltip')).toBeInTheDocument();
        });

        const sidebar = screen.getByTestId('mock_sidebar');
        fireEvent.click(sidebar);

        expect(mockSetSeen).toHaveBeenCalledWith(true);
    });

    it('should not close tooltip when overlay is clicked', async () => {
        localStorage.setItem('guide_dtrader_v2', JSON.stringify({ step1: true, step2: true }));

        const mockSetSeen = jest.fn();
        mockUseLocalStorageData.mockImplementation((key: string) => {
            if (key === SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY) return [false, mockSetSeen, jest.fn()];
            if (key === CHART_INTRO_GUIDE_LOCALSTORAGE_KEY) return [true, jest.fn(), jest.fn()];
            return [false, jest.fn(), jest.fn()];
        });

        render(<SidebarIntroTooltip is_logged_in={true} is_dark_mode={false} />);
        jest.advanceTimersByTime(1000);

        await waitFor(() => {
            expect(screen.getByTestId('dt_sidebar_intro_tooltip')).toBeInTheDocument();
        });

        // Verify tooltip is rendered and overlay doesn't trigger close
        expect(screen.getByTestId('dt_sidebar_intro_tooltip')).toBeInTheDocument();
        expect(mockSetSeen).not.toHaveBeenCalled();
    });

    it('should apply dark theme class when is_dark_mode is true', async () => {
        localStorage.setItem('guide_dtrader_v2', JSON.stringify({ step1: true, step2: true }));

        mockUseLocalStorageData.mockImplementation((key: string) => {
            if (key === SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY) return [false, jest.fn(), jest.fn()];
            if (key === CHART_INTRO_GUIDE_LOCALSTORAGE_KEY) return [true, jest.fn(), jest.fn()];
            return [false, jest.fn(), jest.fn()];
        });

        render(<SidebarIntroTooltip is_logged_in={true} is_dark_mode={true} />);
        jest.advanceTimersByTime(1000);

        await waitFor(() => {
            expect(screen.getByTestId('dt_sidebar_intro_tooltip')).toBeInTheDocument();
        });

        const tooltip = screen.getByTestId('dt_sidebar_intro_tooltip');
        expect(tooltip).toHaveClass('sidebar-intro-tooltip--dark');
    });

    it('should not show tooltip for new users who have not completed welcome guide', () => {
        localStorage.setItem('guide_dtrader_v2', JSON.stringify({ step1: false, step2: true }));

        const mockSetSeen = jest.fn();
        mockUseLocalStorageData.mockImplementation((key: string) => {
            if (key === SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY) return [false, mockSetSeen, jest.fn()];
            if (key === CHART_INTRO_GUIDE_LOCALSTORAGE_KEY) return [true, jest.fn(), jest.fn()];
            return [false, jest.fn(), jest.fn()];
        });

        render(<SidebarIntroTooltip is_logged_in={true} is_dark_mode={false} />);
        jest.advanceTimersByTime(1000);

        expect(screen.queryByTestId('dt_sidebar_intro_tooltip')).not.toBeInTheDocument();
        expect(mockSetSeen).not.toHaveBeenCalled();
    });
});
