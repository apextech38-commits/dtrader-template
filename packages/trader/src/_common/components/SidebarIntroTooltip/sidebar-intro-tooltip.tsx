import React from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';

import { useLocalStorageData } from '@deriv/api';
import { Text } from '@deriv/components';
import { LabelPairedXmarkMdRegularIcon } from '@deriv/quill-icons';
import { Button } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import { CHART_INTRO_GUIDE_LOCALSTORAGE_KEY } from '../chart-intro-guide-config';

import './sidebar-intro-tooltip.scss';

export const SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY = 'sidebar_intro_tooltip_seen';

type TSidebarIntroTooltipProps = {
    is_logged_in?: boolean;
    is_dark_mode?: boolean;
    onSidebarHighlight?: (is_highlighted: boolean) => void;
    sidebar_ref?: React.RefObject<HTMLElement>;
};

const SidebarIntroTooltip = ({
    is_logged_in = false,
    is_dark_mode = false,
    onSidebarHighlight,
    sidebar_ref,
}: TSidebarIntroTooltipProps) => {
    const [is_tooltip_open, setIsTooltipOpen] = React.useState(false);
    const [chart_guide_seen_state, setChartGuideSeenState] = React.useState(false);

    const [sidebar_tooltip_seen, setSidebarTooltipSeen] = useLocalStorageData<boolean>(
        SIDEBAR_INTRO_TOOLTIP_LOCALSTORAGE_KEY,
        false
    );

    const [chart_intro_guide_seen] = useLocalStorageData<boolean>(CHART_INTRO_GUIDE_LOCALSTORAGE_KEY, false);

    // Listen for changes to chart_intro_guide_seen in localStorage
    React.useEffect(() => {
        const checkChartGuideSeen = () => {
            const value = localStorage.getItem(CHART_INTRO_GUIDE_LOCALSTORAGE_KEY);
            setChartGuideSeenState(value === 'true');
        };

        // Check initial value
        checkChartGuideSeen();

        // Listen for storage events (changes from other tabs/windows)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === CHART_INTRO_GUIDE_LOCALSTORAGE_KEY) {
                checkChartGuideSeen();
            }
        };

        // Listen for custom event (changes from same window)
        const handleCustomStorageChange = () => {
            checkChartGuideSeen();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('localStorageUpdated', handleCustomStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('localStorageUpdated', handleCustomStorageChange);
        };
    }, []);

    const handleClose = React.useCallback(() => {
        setIsTooltipOpen(false);
        setSidebarTooltipSeen(true);
        onSidebarHighlight?.(false);
    }, [setSidebarTooltipSeen, onSidebarHighlight]);

    const handleGotIt = React.useCallback(() => {
        setIsTooltipOpen(false);
        setSidebarTooltipSeen(true);
    }, [setSidebarTooltipSeen]);

    // Show tooltip after delay if conditions are met
    React.useEffect(() => {
        let timer: NodeJS.Timeout | undefined;

        if (!sidebar_tooltip_seen && is_logged_in && (chart_intro_guide_seen || chart_guide_seen_state)) {
            // Check if user has completed onboarding guides (existing users only)
            const guide_dtrader_v2_raw = localStorage.getItem('guide_dtrader_v2');

            // If guide_dtrader_v2 exists, check if all guides are completed
            if (guide_dtrader_v2_raw) {
                try {
                    const guide_dtrader_v2 = JSON.parse(guide_dtrader_v2_raw);
                    const all_guides_completed = Object.values(guide_dtrader_v2).every(value => value === true);

                    // Don't show for new users who haven't completed welcome guide
                    if (!all_guides_completed) {
                        return;
                    }
                } catch {
                    // If parsing fails, don't show the tooltip
                    return;
                }
            }

            // Show tooltip after delay for existing users
            timer = setTimeout(() => {
                setIsTooltipOpen(true);
                onSidebarHighlight?.(true);
            }, 800);
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
            onSidebarHighlight?.(false);
        };
    }, [sidebar_tooltip_seen, is_logged_in, chart_intro_guide_seen, chart_guide_seen_state, onSidebarHighlight]);

    React.useEffect(() => {
        if (!is_tooltip_open || !sidebar_ref?.current) return;

        const handleSidebarClick = () => {
            handleClose();
        };

        const sidebar_element = sidebar_ref.current;
        sidebar_element.addEventListener('click', handleSidebarClick);

        return () => {
            sidebar_element.removeEventListener('click', handleSidebarClick);
        };
    }, [is_tooltip_open, sidebar_ref, handleClose]);

    if (!is_tooltip_open) return null;

    const tooltip_class = clsx('sidebar-intro-tooltip', {
        'sidebar-intro-tooltip--dark': is_dark_mode,
    });

    return ReactDOM.createPortal(
        <div className={tooltip_class} data-testid='dt_sidebar_intro_tooltip'>
            <div className='sidebar-intro-tooltip__overlay' />
            <div className='sidebar-intro-tooltip__content'>
                <button
                    className='sidebar-intro-tooltip__close-button'
                    onClick={handleClose}
                    data-testid='dt_sidebar_tooltip_close_button'
                    aria-label='Close'
                >
                    <LabelPairedXmarkMdRegularIcon />
                </button>

                <div className='sidebar-intro-tooltip__pointer' />

                <div className='sidebar-intro-tooltip__body'>
                    <Text as='h4' weight='bold' className='sidebar-intro-tooltip__title'>
                        <Localize i18n_default_text='New update!' />
                    </Text>

                    <Text size='md' className='sidebar-intro-tooltip__description'>
                        <Localize i18n_default_text='We have moved the main navigation to the left side of your screen for easier access to your tools.' />
                    </Text>

                    <Button
                        size='sm'
                        onClick={handleGotIt}
                        className='sidebar-intro-tooltip__button'
                        data-testid='dt_sidebar_tooltip_got_it_button'
                    >
                        <Text size='lg' weight='bold' className='sidebar-intro-tooltip__button-text'>
                            <Localize i18n_default_text='Got it' />
                        </Text>
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default React.memo(SidebarIntroTooltip);
