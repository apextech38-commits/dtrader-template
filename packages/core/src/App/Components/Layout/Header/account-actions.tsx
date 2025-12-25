import React from 'react';

import { useDerivativesAccount } from '@deriv/api';
import { Button, Skeleton, Text } from '@deriv/components';
import { getBrandUrl, trackAnalyticsEvent } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { useTranslations } from '@deriv-com/translations';

import { LoginButton } from './login-button';

import 'Sass/app/_common/components/account-switcher.scss';
import classNames from 'classnames';

const AccountInfo = React.lazy(
    () =>
        import(
            /* webpackChunkName: "account-info", webpackPreload: true */ 'App/Components/Layout/Header/account-info.jsx'
        )
);

const AccountActionsComponent = () => {
    const { client, common, ui } = useStore();
    const { currency, is_logged_in, loginid } = client;

    const { localize } = useTranslations();

    // Fetch derivatives accounts to determine button type
    const { data, isLoading } = useDerivativesAccount(loginid, is_logged_in);
    const accounts = data?.data || [];

    // Determine account types available
    const hasOnlyDemoAccounts = accounts.length > 0 && accounts.every(acc => acc.account_type === 'demo');

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
        <React.Suspense fallback={<div />}>
            <AccountInfo />
            <Button
                className='acc-info__transfer-button'
                onClick={handleTransferClick}
                aria-label={buttonLabel}
                type='button'
                has_effect
            >
                <Text size='xs' weight='bold' color='white'>
                    {buttonLabel}
                </Text>
            </Button>
        </React.Suspense>
    );

    if (!is_logged_in) {
        return (
            <div
                id='dt_core_header_acc-info-container'
                className={classNames('acc-info__container', {
                    'acc-info__container--logged-out': !is_logged_in,
                })}
            >
                <LoginButton className='acc-info__button' />
            </div>
        );
    }

    return (
        <div
            id='dt_core_header_acc-info-container'
            className={classNames('acc-info__container', {
                'acc-info__container--loading': isLoading,
            })}
        >
            {isLoading ? (
                <React.Fragment>
                    <Skeleton height={32} width={120} />
                    <Skeleton height={32} width={80} />
                </React.Fragment>
            ) : (
                renderAccountInfo()
            )}
        </div>
    );
};

AccountActionsComponent.displayName = 'AccountActions';

const AccountActions = React.memo(AccountActionsComponent);

export { AccountActions };
