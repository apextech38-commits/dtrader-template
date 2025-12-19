import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import classNames from 'classnames';

import { Button, Flyout, Text } from '@deriv/components';
import {
    DerivProductBrandLightDerivTraderLogoIcon,
    LegacyHomeNewIcon,
    StandaloneCircleUserFillIcon,
    StandaloneCircleUserRegularIcon,
    StandaloneClockThreeFillIcon,
    StandaloneClockThreeRegularIcon,
    StandaloneFileRegularIcon,
    StandaloneGlobeFillIcon,
    StandaloneGlobeRegularIcon,
    StandaloneMoonRegularIcon,
    StandaloneSunBrightRegularIcon,
} from '@deriv/quill-icons';
import { getBrandUrl, routes } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { Localize, localize, useTranslations } from '@deriv-com/translations';

import { useMobileBridge } from 'App/Hooks/useMobileBridge';

import SidebarIntroTooltip from '../../../../_common/components/SidebarIntroTooltip';
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
    const { ui, client, portfolio, common } = useStore();
    const { currentLang } = useTranslations();
    const { is_dark_mode_on, active_sidebar_flyout, setSidebarFlyout, closeSidebarFlyout } = ui;
    const { is_logged_in } = client;
    const { current_language } = common;
    const { active_positions_count, onMount, onUnmount } = portfolio;
    const location = useLocation();
    const history = useHistory();
    const [is_sidebar_highlighted, setIsSidebarHighlighted] = React.useState(false);
    const sidebar_ref = React.useRef<HTMLElement>(null);
    const { sendBridgeEvent } = useMobileBridge();

    React.useEffect(() => {
        onMount();
        return () => onUnmount();
    }, [onMount, onUnmount]);

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

    const handleHomeClick = () => {
        closeSidebarFlyout();
        sendBridgeEvent('trading:home', () => {
            const brandUrl = getBrandUrl();
            const lang_param = current_language ? `&lang=${current_language}` : '';
            const currency = client.currency || '';
            window.location.href = `${brandUrl}/home?acc=options&curr=${currency}&from=home&source=options${lang_param}`;
        });
    };

    const closeFlyout = () => {
        closeSidebarFlyout();
    };

    const handleSidebarHighlight = React.useCallback((is_highlighted: boolean) => {
        setIsSidebarHighlighted(is_highlighted);
    }, []);

    // Main navigation items
    const isPositionsActive = active_sidebar_flyout === 'positions';
    const isReportsActive = isActiveRoute(routes.reports);

    const navigationItems: TSidebarItem[] = [
        {
            id: 'home',
            icon: <LegacyHomeNewIcon iconSize='xs' fill='var(--color-text-primary)' />,
            label: localize('Home'),
            onClick: handleHomeClick,
            isActive: false,
            dataTestId: 'dt_sidebar_home',
        },
        {
            id: 'positions',
            icon: isPositionsActive ? (
                <StandaloneClockThreeFillIcon fill='var(--color-nav-item-active)' iconSize='sm' />
            ) : (
                <StandaloneClockThreeRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
            ),
            label: localize('Positions'),
            onClick: handlePositionsToggle,
            isActive: isPositionsActive,
            badge: active_positions_count,
            dataTestId: 'dt_sidebar_positions',
        },
        {
            id: 'reports',
            icon: <StandaloneFileRegularIcon fill='var(--color-text-primary)' iconSize='sm' />,
            label: localize('Reports'),
            onClick: handleReportsClick,
            isActive: isReportsActive,
            dataTestId: 'dt_sidebar_reports',
        },
    ];

    // Utility items (bottom section)
    const isLanguageActive = active_sidebar_flyout === 'language';
    const isAccountActive = active_sidebar_flyout === 'account';

    const utilityItems = [
        {
            id: 'language',
            icon: isLanguageActive ? (
                <StandaloneGlobeFillIcon fill='var(--color-nav-item-active)' iconSize='sm' />
            ) : (
                <StandaloneGlobeRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
            ),
            label: localize('Language'),
            onClick: handleLanguageToggle,
            isActive: isLanguageActive,
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
            icon: isAccountActive ? (
                <StandaloneCircleUserFillIcon fill='var(--color-nav-item-active)' iconSize='sm' />
            ) : (
                <StandaloneCircleUserRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
            ),
            label: localize('Account'),
            onClick: handleAccountToggle,
            isActive: isAccountActive,
            dataTestId: 'dt_sidebar_account',
        },
    ];

    const getFlyoutContent = () => {
        switch (active_sidebar_flyout) {
            case 'language':
                return {
                    title: <Localize i18n_default_text='Language' />,
                    content: <LanguageSelector />,
                    footer: null,
                };
            case 'account':
                return {
                    title: <Localize i18n_default_text='Account' />,
                    content: <AccountSelector />,
                    footer: null,
                };
            case 'positions':
                return {
                    title: <Localize i18n_default_text='Open positions' />,
                    content: <PositionsDrawerContent />,
                    footer: <PositionsDrawerFooter />,
                };
            default:
                return null;
        }
    };

    const flyoutContent = React.useMemo(() => getFlyoutContent(), [active_sidebar_flyout, currentLang]);

    return (
        <React.Fragment>
            <SidebarIntroTooltip
                is_logged_in={is_logged_in}
                is_dark_mode={is_dark_mode_on}
                onSidebarHighlight={handleSidebarHighlight}
                sidebar_ref={sidebar_ref}
            />
            <aside
                ref={sidebar_ref}
                className={classNames('sidebar', {
                    sidebar__hidden: !isActiveRoute(routes.index),
                    'sidebar--highlighted': is_sidebar_highlighted,
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
                        {navigationItems.map((item, index) => {
                            const shouldShow = item.id === 'home' || is_logged_in;

                            if (!shouldShow) return null;

                            return (
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
                            );
                        })}
                    </div>
                    {/* Utility Section */}
                    <div className='sidebar__nav-utility'>
                        <div className='sidebar__separator' />
                        {utilityItems.map(item => {
                            const shouldShow = item.id === 'account' ? is_logged_in : true;

                            if (!shouldShow) return null;

                            return (
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
                            );
                        })}
                    </div>
                </nav>
            </aside>

            {/* Single Flyout with conditional content */}
            <Flyout
                is_open={active_sidebar_flyout !== null}
                onClose={closeFlyout}
                title={flyoutContent?.title}
                footer_content={flyoutContent?.footer}
            >
                {flyoutContent?.content}
            </Flyout>
        </React.Fragment>
    );
});

export default Sidebar;
