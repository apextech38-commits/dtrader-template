import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import classNames from 'classnames';

import { Button, Flyout, Text } from '@deriv/components';
import {
    DerivProductBrandLightDerivTraderLogoIcon,
    StandaloneCircleUserRegularIcon,
    StandaloneClockThreeRegularIcon,
    StandaloneFileRegularIcon,
    StandaloneGlobeRegularIcon,
    StandaloneMoonRegularIcon,
    StandaloneSunBrightRegularIcon,
} from '@deriv/quill-icons';
import { routes } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { localize } from '@deriv-com/translations';

import { PositionsDrawerContent, PositionsDrawerFooter } from '../../Elements/PositionsDrawer';

import AccountSelector from './account-selector';
import LanguageSelector from './language-selector';

type TSidebarItem = {
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive: boolean;
    badge?: number;
    dataTestId?: string;
};

const Sidebar = observer(() => {
    const { ui, client, portfolio } = useStore();
    const { is_dark_mode_on, active_sidebar_flyout, setSidebarFlyout, closeSidebarFlyout } = ui;
    const { is_logged_in } = client;
    const { active_positions_count } = portfolio;
    const location = useLocation();
    const history = useHistory();

    const isActiveRoute = (path: string) => {
        if (path === routes.index) {
            return location.pathname === routes.index;
        }
        return location.pathname.startsWith(path);
    };

    const handleThemeToggle = () => {
        ui.setDarkMode(!is_dark_mode_on);
    };

    const handleLanguageToggle = () => {
        setSidebarFlyout(active_sidebar_flyout === 'language' ? null : 'language');
    };

    const handleAccountToggle = () => {
        setSidebarFlyout(active_sidebar_flyout === 'account' ? null : 'account');
    };

    const handlePositionsToggle = () => {
        setSidebarFlyout(active_sidebar_flyout === 'positions' ? null : 'positions');
    };

    const handleReportsClick = () => {
        setSidebarFlyout(null);
        history.push(routes.reports);
    };

    const closeFlyout = () => {
        closeSidebarFlyout();
    };

    // Main navigation items
    const navigationItems: TSidebarItem[] = [
        {
            id: 'positions',
            icon: <StandaloneClockThreeRegularIcon fill='var(--color-text-primary)' iconSize='sm' />,
            label: localize('Positions'),
            onClick: handlePositionsToggle,
            isActive: active_sidebar_flyout === 'positions',
            badge: active_positions_count,
            dataTestId: 'dt_sidebar_positions',
        },
        {
            id: 'reports',
            icon: <StandaloneFileRegularIcon fill='var(--color-text-primary)' iconSize='sm' />,
            label: localize('Reports'),
            onClick: handleReportsClick,
            isActive: isActiveRoute(routes.reports),
            dataTestId: 'dt_sidebar_reports',
        },
    ];

    // Utility items (bottom section)
    const utilityItems = [
        {
            id: 'language',
            icon: <StandaloneGlobeRegularIcon fill='var(--color-text-primary)' iconSize='sm' />,
            label: localize('Language'),
            onClick: handleLanguageToggle,
            isActive: active_sidebar_flyout === 'language',
            dataTestId: 'dt_sidebar_language',
        },
        {
            id: 'theme',
            icon: is_dark_mode_on ? (
                <StandaloneMoonRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
            ) : (
                <StandaloneSunBrightRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
            ),
            label: localize('Theme'),
            onClick: handleThemeToggle,
            isActive: false,
            dataTestId: 'dt_sidebar_theme',
        },
        {
            id: 'account',
            icon: <StandaloneCircleUserRegularIcon fill='var(--color-text-primary)' iconSize='sm' />,
            label: localize('Account'),
            onClick: handleAccountToggle,
            isActive: active_sidebar_flyout === 'account',
            dataTestId: 'dt_sidebar_account',
        },
    ];

    const getFlyoutContent = () => {
        switch (active_sidebar_flyout) {
            case 'language':
                return {
                    title: localize('Language'),
                    content: <LanguageSelector />,
                    footer: null,
                };
            case 'account':
                return {
                    title: localize('Account'),
                    content: <AccountSelector />,
                    footer: null,
                };
            case 'positions':
                return {
                    title: localize('Open positions'),
                    content: <PositionsDrawerContent />,
                    footer: <PositionsDrawerFooter />,
                };
            default:
                return null;
        }
    };

    const flyoutContent = React.useMemo(() => getFlyoutContent(), [active_sidebar_flyout]);

    return (
        <React.Fragment>
            <aside
                className={classNames('sidebar', {
                    sidebar__hidden: !isActiveRoute(routes.index),
                })}
                data-testid='dt_sidebar'
            >
                {/* Logo Section */}
                <div className='sidebar__header'>
                    <DerivProductBrandLightDerivTraderLogoIcon width={32} height={32} />
                </div>
                <div className='sidebar__separator' />
                {/* Main Navigation */}
                <nav className='sidebar__nav'>
                    <div className='sidebar__nav-main'>
                        {is_logged_in &&
                            navigationItems.map(item => (
                                <Button
                                    key={item.id}
                                    className={classNames('sidebar__item', {
                                        'sidebar__item--active': item.isActive,
                                    })}
                                    onClick={item.onClick}
                                    data-testid={item.dataTestId}
                                    aria-label={item.label}
                                    type='button'
                                >
                                    <Text className='sidebar__item-icon'>{item.icon}</Text>
                                    <Text className='sidebar__item-label'>{item.label}</Text>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <Text className='sidebar__item-badge'>{item.badge}</Text>
                                    )}
                                </Button>
                            ))}
                    </div>
                    {/* Utility Section */}
                    <div className='sidebar__nav-utility'>
                        <div className='sidebar__separator' />
                        {utilityItems.map(item => (
                            <Button
                                key={item.id}
                                className={classNames('sidebar__item', {
                                    'sidebar__item--active': item.isActive,
                                })}
                                onClick={item.onClick}
                                data-testid={item.dataTestId}
                                aria-label={item.label}
                                type='button'
                            >
                                <Text className='sidebar__item-icon'>{item.icon}</Text>
                                <Text className='sidebar__item-label'>{item.label}</Text>
                            </Button>
                        ))}
                    </div>
                </nav>
            </aside>

            {/* Single Flyout with conditional content */}
            <Flyout
                is_open={active_sidebar_flyout !== null}
                onClose={closeFlyout}
                title={flyoutContent?.title || ''}
                footer_content={flyoutContent?.footer}
            >
                {flyoutContent?.content}
            </Flyout>
        </React.Fragment>
    );
});

export default Sidebar;
