import React from 'react';

import { Button, Text } from '@deriv/components';
import {
    LegacyHomeNewIcon,
    LegacyLogout1pxIcon,
    StandaloneArrowUpRightFromSquareRegularIcon,
} from '@deriv/quill-icons';
import { getBrandHomeUrl } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { localize } from '@deriv-com/translations';

import { useMobileBridge } from 'App/Hooks/useMobileBridge';

const AccountSelector = observer(() => {
    const { client, common, ui } = useStore();
    const { logout } = client;
    const { current_language } = common;
    const { closeSidebarFlyout } = ui;
    const { sendBridgeEvent } = useMobileBridge();

    const handleGoToHome = () => {
        closeSidebarFlyout();
        sendBridgeEvent('trading:home', () => {
            const brandUrl = getBrandHomeUrl(current_language);
            window.location.href = brandUrl;
        });
    };

    const handleLogout = () => {
        closeSidebarFlyout();
        logout();
    };

    return (
        <div className='flyout-selector'>
            <Button
                className='flyout-selector__option'
                onClick={handleGoToHome}
                icon={<LegacyHomeNewIcon iconSize='xs' fill='var(--color-text-primary)' />}
            >
                <Text>{localize('Go to Home')}</Text>
                <StandaloneArrowUpRightFromSquareRegularIcon iconSize='sm' fill='var(--color-text-primary)' />
            </Button>
            <Button
                className='flyout-selector__option'
                onClick={handleLogout}
                icon={<LegacyLogout1pxIcon iconSize='xs' fill='var(--color-text-primary)' />}
            >
                <Text>{localize('Log out')}</Text>
            </Button>
        </div>
    );
});

export default AccountSelector;
