import React from 'react';

import { Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import { groupTradeTypesByCategory, isSameTradeTypeCategory, TAvailableContract } from '../../Utils/trade-types-utils';

type TTradeTypesSelectorContentProps = {
    available_contracts: TAvailableContract[];
    selected_trade_type: string;
    active_tab: 'all' | 'most_traded';
    onTradeTypeSelect: (type: string) => void;
};

const TradeTypesSelectorContent = ({
    available_contracts,
    selected_trade_type,
    active_tab,
    onTradeTypeSelect,
}: TTradeTypesSelectorContentProps) => {
    const filtered_contracts =
        active_tab === 'most_traded'
            ? available_contracts.filter(contract => contract.is_popular)
            : available_contracts;

    const grouped_contracts = groupTradeTypesByCategory(filtered_contracts);

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'growth_based':
                return <Localize i18n_default_text='Growth based' />;
            case 'directional':
                return <Localize i18n_default_text='Directional' />;
            case 'digit_based':
                return <Localize i18n_default_text='Digit based' />;
            default:
                return null;
        }
    };

    const category_order = ['growth_based', 'directional', 'digit_based'];

    return (
        <div className='trade-types-selector__content'>
            {category_order.map(category => {
                const contracts = grouped_contracts[category];
                if (!contracts || contracts.length === 0) return null;

                return (
                    <div key={category} className='trade-types-selector__category'>
                        <Text size='sm' className='trade-types-selector__category-label'>
                            {getCategoryLabel(category)}
                        </Text>
                        <div className='trade-types-selector__items'>
                            {contracts.map(contract => {
                                const is_selected = contract.for.some(type =>
                                    isSameTradeTypeCategory(type, selected_trade_type)
                                );
                                return (
                                    <button
                                        key={contract.id}
                                        className={`trade-types-selector__item ${is_selected ? 'trade-types-selector__item--selected' : ''}`}
                                        onClick={() => onTradeTypeSelect(contract.for[0])}
                                    >
                                        <Text size='md'>
                                            {contract.tradeType}
                                            {contract.show_fire_icon && ' 🔥'}
                                        </Text>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TradeTypesSelectorContent;
