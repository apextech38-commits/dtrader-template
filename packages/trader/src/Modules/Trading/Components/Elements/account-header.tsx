import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';

import { useDerivativesAccount } from '@deriv/api';
import { Button, Text, Skeleton } from '@deriv/components';
import AccountSwitcher from '@deriv/core/src/App/Components/Layout/Header/account-switcher';
import AccountSwitcherIntroTooltip from '@deriv/core/src/App/Components/Layout/Header/AccountSwitcherIntroTooltip';
import { LegacyChevronDown1pxIcon } from '@deriv/quill-icons';
import { addComma, getBrandUrl, getCurrencyDisplayCode, redirectToLogin, trackAnalyticsEvent } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { Localize, useTranslations } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import '@deriv/core/src/sass/app/_common/components/account-switcher.scss';

type AccountHeaderProps = {
    balance?: string | number;
    currency?: string;
    is_logged_in?: boolean;
    is_virtual?: boolean;
};

const AccountHeader = observer(
    ({
        balance: balanceProp,
        currency: currencyProp,
        is_logged_in: isLoggedInProp,
        is_virtual: isVirtualProp,
    }: AccountHeaderProps = {}) => {
        const { localize } = useTranslations();
        const { client, common, ui } = useStore();
        const { isMobile } = useDevice();

        // Use props if provided, otherwise fall back to store
        const balance = balanceProp ?? client.balance;
        const currency = currencyProp ?? client.currency;
        const is_logged_in = isLoggedInProp ?? client.is_logged_in;
        const is_virtual = isVirtualProp ?? client.is_virtual;

        const { data, isLoading, error, refetch } = useDerivativesAccount(client.loginid, is_logged_in);
        const accounts = data?.data || [];

        // Dropdown state
        const [is_dropdown_open, setIsDropdownOpen] = React.useState(false);
        const [is_account_switcher_highlighted, setIsAccountSwitcherHighlighted] = React.useState(false);
        const dropdown_ref = React.useRef<HTMLDivElement>(null);
        const account_switcher_container_ref = React.useRef<HTMLDivElement>(null);

        // Handle account switcher highlight
        const handleAccountSwitcherHighlight = React.useCallback((is_highlighted: boolean) => {
            setIsAccountSwitcherHighlighted(is_highlighted);
        }, []);

        // Close dropdown when clicking outside
        React.useEffect(() => {
            if (!is_dropdown_open) return;

            const handleClickOutside = (event: MouseEvent) => {
                if (dropdown_ref.current && !dropdown_ref.current.contains(event.target as Node)) {
                    setIsDropdownOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [is_dropdown_open]);

        const toggleDropdown = () => {
            setIsDropdownOpen(!is_dropdown_open);
        };

        // Check if balance is a valid number (handles comma-formatted strings like "10,000.00" and numeric 0)
        const isValidBalance =
            balance !== undefined &&
            balance !== null &&
            balance !== '' &&
            // (typeof balance === 'number' || !isNaN(Number(String(balance).replace(/,/g, ''))));
            !isNaN(Number(String(balance).replace(/,/g, '')));

        const accountTypeHeader = is_virtual ? localize('Demo account') : localize('Real account');

        // Determine account types available
        const hasOnlyDemoAccounts = accounts.length > 0 && accounts.every(acc => acc.account_type === 'demo');
        const hasMultipleAccounts = accounts.length > 1;

        // Button logic:
        // - If only demo accounts exist -> show "Try real"
        // - Otherwise (real only or both real and demo) -> show "Transfer"
        const buttonLabel = hasOnlyDemoAccounts ? localize('Try real') : localize('Transfer');
        const buttonType = hasOnlyDemoAccounts ? 'try_real' : 'transfer';

        const handleTransferClick = () => {
            // Track analytics event
            const eventName = 'ce_trade_types_form_v2';

            trackAnalyticsEvent(eventName, {
                action: 'click',
                button_type: buttonType,
            });

            if (hasOnlyDemoAccounts) {
                // Show modal instead of redirecting directly
                ui.toggleTryRealModal(true);
            } else {
                // Transfer button (for both account types or real-only accounts)
                const brandUrl = getBrandUrl();
                const lang_param = common.current_language ? `&lang=${common.current_language}` : '';
                window.location.href = `${brandUrl}/transfer?acc=options&curr=${currency}&from=home&source=options${lang_param}`;
            }
        };

        const renderAccountInfo = () => (
            <React.Fragment>
                <div
                    className={classNames('account-header__container', {
                        'account-header__container--highlighted': is_account_switcher_highlighted,
                    })}
                >
                    <div
                        ref={account_switcher_container_ref}
                        className={classNames('account-header__info', {
                            'account-header__info--no-switcher': hasOnlyDemoAccounts,
                        })}
                        onClick={hasOnlyDemoAccounts ? undefined : toggleDropdown}
                    >
                        <div
                            className={classNames('account-header__content', {
                                'account-header__content--active': is_dropdown_open,
                            })}
                        >
                            <div className='account-header__content-header'>
                                <Text size='xs' color={is_virtual ? 'tertiary' : 'secondary-alternate'}>
                                    {accountTypeHeader}
                                </Text>
                                {!hasOnlyDemoAccounts && (
                                    <LegacyChevronDown1pxIcon
                                        className={classNames('account-header__select-arrow', {
                                            'account-header__select-arrow--invert': is_dropdown_open && !isMobile,
                                        })}
                                        fill='var(--color-text-primary)'
                                        iconSize='xs'
                                    />
                                )}
                            </div>
                            <Text size='s' weight='bold' className='account-header__balance'>
                                {!currency ? (
                                    <Localize i18n_default_text='No currency assigned' />
                                ) : isValidBalance ? (
                                    `${addComma(balance, 2)} ${getCurrencyDisplayCode(currency)}`
                                ) : (
                                    `0.00 ${getCurrencyDisplayCode(currency)}`
                                )}
                            </Text>
                        </div>
                    </div>
                    {!hasOnlyDemoAccounts && (
                        <AccountSwitcher
                            accounts={accounts}
                            current_loginid={client.loginid}
                            is_loading={isLoading}
                            error={error}
                            is_open={is_dropdown_open}
                            onClose={() => setIsDropdownOpen(false)}
                            onRefetch={refetch}
                        />
                    )}
                </div>
                <Button
                    className='account-header__transfer'
                    onClick={handleTransferClick}
                    aria-label={buttonLabel}
                    type='button'
                >
                    <Text size='xs' weight='bold' color='white'>
                        {buttonLabel}
                    </Text>
                </Button>
            </React.Fragment>
        );

        if (!is_logged_in) {
            return (
                <div className='account-header'>
                    <Button
                        className='account-header__login'
                        onClick={redirectToLogin}
                        aria-label={localize('Log in')}
                        type='button'
                    >
                        <Text size='xs' weight='bold' color='white'>
                            <Localize i18n_default_text='Log in' />
                        </Text>
                    </Button>
                </div>
            );
        }

        return (
            <React.Fragment>
                <div className='account-header' ref={dropdown_ref}>
                    {isLoading ? (
                        <React.Fragment>
                            <Skeleton height={48} width={240} />
                        </React.Fragment>
                    ) : (
                        renderAccountInfo()
                    )}
                </div>
                <AccountSwitcherIntroTooltip
                    is_logged_in={is_logged_in}
                    is_dark_mode={ui.is_dark_mode_on}
                    has_multiple_accounts={hasMultipleAccounts}
                    account_switcher_ref={account_switcher_container_ref}
                    onAccountSwitcherHighlight={handleAccountSwitcherHighlight}
                />
            </React.Fragment>
        );
    }
);

AccountHeader.displayName = 'AccountHeader';

export default AccountHeader;
