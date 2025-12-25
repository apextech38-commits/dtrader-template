import React from 'react';
import classNames from 'classnames';

import { useDerivativesAccount } from '@deriv/api';
import { Text } from '@deriv/components';
import { LegacyChevronDown1pxIcon } from '@deriv/quill-icons';
import { addComma, formatMoney, getAccountType, getCurrencyDisplayCode } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { Localize, useTranslations } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import AccountInfoWrapper from './account-info-wrapper';
import AccountSwitcher from './account-switcher';
import AccountSwitcherIntroTooltip from './AccountSwitcherIntroTooltip';

const AccountInfo = observer(() => {
    const { localize } = useTranslations();
    const { isMobile } = useDevice();

    // Get client data from store
    const { client, ui } = useStore();
    const { loginid, is_logged_in, balance, currency } = client;

    // Fetch derivatives accounts using React Query
    // loginid is included in query key for cache invalidation on account switch
    const { data, isLoading, error, refetch } = useDerivativesAccount(loginid, is_logged_in);
    const accounts = data?.data || [];

    // Dropdown open/close state
    const [is_dropdown_open, setIsDropdownOpen] = React.useState(false);
    const [is_account_switcher_highlighted, setIsAccountSwitcherHighlighted] = React.useState(false);
    const dropdown_ref = React.useRef(null);
    const account_switcher_container_ref = React.useRef(null);

    // Handle account switcher highlight
    const handleAccountSwitcherHighlight = React.useCallback(is_highlighted => {
        setIsAccountSwitcherHighlighted(is_highlighted);
    }, []);

    const accountType = getAccountType();
    const accountTypeHeader = accountType === 'real' ? localize('Real account') : localize('Demo account');
    const isDemoAccount = accountType === 'demo';

    const formattedBalance = balance != null ? formatMoney(currency, balance, true) : undefined;

    // Determine if user has only demo accounts (to disable dropdown)
    const hasOnlyDemoAccounts = accounts.length > 0 && accounts.every(acc => acc.account_type === 'demo');
    const hasMultipleAccounts = accounts.length > 1;

    // Close dropdown when clicking outside
    React.useEffect(() => {
        if (!is_dropdown_open || isMobile) return;

        const handleClickOutside = event => {
            if (dropdown_ref.current && !dropdown_ref.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [is_dropdown_open, isMobile]);

    const toggleDropdown = () => {
        setIsDropdownOpen(!is_dropdown_open);
    };

    return (
        <React.Fragment>
            <div
                className={classNames('acc-info__wrapper', {
                    'acc-info__wrapper--highlighted': is_account_switcher_highlighted,
                })}
                ref={dropdown_ref}
            >
                <AccountInfoWrapper is_mobile={isMobile}>
                    <div className='acc-info__container' ref={account_switcher_container_ref}>
                        <div
                            data-testid='dt_acc_info'
                            id='dt_core_account-info_acc-info'
                            className={classNames('acc-info', {
                                'acc-info--is-demo': isDemoAccount,
                                'acc-info--show': is_dropdown_open && !isMobile,
                                'acc-info--no-switcher': hasOnlyDemoAccounts,
                            })}
                            onClick={hasOnlyDemoAccounts ? undefined : toggleDropdown}
                        >
                            <div className='acc-info__content'>
                                <div className='acc-info__account-type-header'>
                                    <Text as='p' size='xs' color={isDemoAccount ? 'tertiary' : 'secondary-alternate'}>
                                        {accountTypeHeader}
                                    </Text>
                                    {!hasOnlyDemoAccounts && (
                                        <LegacyChevronDown1pxIcon
                                            className={classNames('acc-info__select-arrow', {
                                                'acc-info__select-arrow--invert': is_dropdown_open && !isMobile,
                                            })}
                                            fill='var(--color-text-primary)'
                                            iconSize='xs'
                                        />
                                    )}
                                </div>
                                {(typeof formattedBalance !== 'undefined' || !currency) && (
                                    <div className='acc-info__balance-section'>
                                        <Text
                                            data-testid='dt_balance'
                                            className={classNames('acc-info__balance', {
                                                'acc-info__balance--no-currency': !currency && !isDemoAccount,
                                            })}
                                            size='s'
                                            color='primary'
                                            weight='bold'
                                        >
                                            {!currency ? (
                                                <Localize i18n_default_text='No currency assigned' />
                                            ) : (
                                                `${addComma(formattedBalance, 2)} ${getCurrencyDisplayCode(currency)}`
                                            )}
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </AccountInfoWrapper>
                {!hasOnlyDemoAccounts && (
                    <AccountSwitcher
                        accounts={accounts}
                        current_loginid={loginid}
                        is_loading={isLoading}
                        error={error}
                        is_open={is_dropdown_open}
                        onClose={() => setIsDropdownOpen(false)}
                        onRefetch={refetch}
                    />
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
});

export default AccountInfo;
