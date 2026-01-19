import React from 'react';
import clsx from 'clsx';

import { isMobile } from '@deriv/shared';
import { Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import Guide from '../Guide';
import TradeParamsFooter from '../TradeParamsFooter';

type TTradeParametersContainer = {
    is_minimized?: boolean;
    is_minimized_visible?: boolean;
};

const TradeParametersContainer = ({
    children,
    is_minimized,
    is_minimized_visible,
}: React.PropsWithChildren<TTradeParametersContainer>) => {
    const is_minimized_and_visible = is_minimized && is_minimized_visible;
    const is_mobile = isMobile();
    return (
        <section
            className={clsx('', {
                'trade-params--minimized': is_minimized_and_visible,
                'trade-params': !is_minimized_and_visible,
            })}
        >
            {!is_minimized_and_visible && (
                <div className='trade-params__title'>
                    {is_mobile && (
                        <Text>
                            <Localize i18n_default_text='Set your trade' />
                        </Text>
                    )}
                    <Guide has_label show_guide_for_selected_contract />
                </div>
            )}
            {children}
            {!is_mobile && !is_minimized_and_visible && <TradeParamsFooter />}
        </section>
    );
};

export default React.memo(TradeParametersContainer);
