import React from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';

import { useLocalStorageData } from '@deriv/api';
import { Text } from '@deriv/components';
import { LabelPairedXmarkMdRegularIcon } from '@deriv/quill-icons';
import { Button } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import './account-switcher-intro-tooltip.scss';

export const ACCOUNT_SWITCHER_INTRO_TOOLTIP_LOCALSTORAGE_KEY = 'account_switcher_intro_tooltip_seen';
const CHART_INTRO_GUIDE_LOCALSTORAGE_KEY = 'chart_intro_guide_seen';

type TAccountSwitcherIntroTooltipProps = {
    is_logged_in?: boolean;
    is_dark_mode?: boolean;
    has_multiple_accounts?: boolean;
    account_switcher_ref?: React.RefObject<HTMLElement>;
    onAccountSwitcherHighlight?: (is_highlighted: boolean) => void;
};

const AccountSwitcherIntroTooltip = ({
    is_logged_in = false,
    is_dark_mode = false,
    has_multiple_accounts = false,
    account_switcher_ref,
    onAccountSwitcherHighlight,
}: TAccountSwitcherIntroTooltipProps) => {
    const [is_tooltip_open, setIsTooltipOpen] = React.useState(false);
    const [chart_guide_seen_state, setChartGuideSeenState] = React.useState(false);

    const [tooltip_seen, setTooltipSeen] = useLocalStorageData<boolean>(
        ACCOUNT_SWITCHER_INTRO_TOOLTIP_LOCALSTORAGE_KEY,
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
        setTooltipSeen(true);
        onAccountSwitcherHighlight?.(false);
    }, [setTooltipSeen, onAccountSwitcherHighlight]);

    const handleGotIt = React.useCallback(() => {
        setIsTooltipOpen(false);
        setTooltipSeen(true);
    }, [setTooltipSeen]);

    // Show tooltip after delay if conditions are met
    React.useEffect(() => {
        let timer: NodeJS.Timeout | undefined;

        if (
            !tooltip_seen &&
            is_logged_in &&
            has_multiple_accounts &&
            (chart_intro_guide_seen || chart_guide_seen_state)
        ) {
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
                onAccountSwitcherHighlight?.(true);
            }, 800);
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
            onAccountSwitcherHighlight?.(false);
        };
    }, [
        tooltip_seen,
        is_logged_in,
        has_multiple_accounts,
        chart_intro_guide_seen,
        chart_guide_seen_state,
        onAccountSwitcherHighlight,
    ]);

    // Handle click on account switcher to dismiss tooltip
    React.useEffect(() => {
        if (!is_tooltip_open || !account_switcher_ref?.current) return;

        const handleAccountSwitcherClick = () => {
            handleClose();
        };

        const switcher_element = account_switcher_ref.current;
        switcher_element.addEventListener('click', handleAccountSwitcherClick);

        return () => {
            switcher_element.removeEventListener('click', handleAccountSwitcherClick);
        };
    }, [is_tooltip_open, account_switcher_ref, handleClose]);

    if (!is_tooltip_open) return null;

    const tooltip_class = clsx('account-switcher-intro-tooltip', {
        'account-switcher-intro-tooltip--dark': is_dark_mode,
    });

    return ReactDOM.createPortal(
        <div className={tooltip_class} data-testid='dt_account_switcher_intro_tooltip'>
            <div className='account-switcher-intro-tooltip__overlay' />
            <div className='account-switcher-intro-tooltip__content'>
                <button
                    className='account-switcher-intro-tooltip__close-button'
                    onClick={handleClose}
                    data-testid='dt_account_switcher_tooltip_close_button'
                    aria-label='Close'
                >
                    <LabelPairedXmarkMdRegularIcon />
                </button>

                <div className='account-switcher-intro-tooltip__pointer' />

                <div className='account-switcher-intro-tooltip__body'>
                    <div className='account-switcher-intro-tooltip__body--inner'>
                        <Text as='h4' weight='bold' className='account-switcher-intro-tooltip__title'>
                            <Localize i18n_default_text='New update!' />
                        </Text>

                        <Text size='md' className='account-switcher-intro-tooltip__description'>
                            <Localize i18n_default_text='Switch between Real and Demo accounts instantly.' />
                        </Text>
                    </div>
                    <Button
                        size='sm'
                        onClick={handleGotIt}
                        className='account-switcher-intro-tooltip__button'
                        data-testid='dt_account_switcher_tooltip_got_it_button'
                    >
                        <Text size='lg' weight='bold' className='account-switcher-intro-tooltip__button-text'>
                            <Localize i18n_default_text='Got it' />
                        </Text>
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default React.memo(AccountSwitcherIntroTooltip);
