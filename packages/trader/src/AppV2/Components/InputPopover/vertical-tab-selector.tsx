import React from 'react';
import clsx from 'clsx';

import { Localize } from '@deriv-com/translations';

export interface VerticalTabItem {
    value: string;
    label: string;
}

interface VerticalTabSelectorProps {
    items: VerticalTabItem[];
    selectedValue: string;
    onSelect: (value: string) => void;
    className?: string;
}

const VerticalTabSelector: React.FC<VerticalTabSelectorProps> = ({ items, selectedValue, onSelect, className }) => {
    return (
        <div className={clsx('vertical-tab-selector', className)}>
            {items.map(item => (
                <button
                    key={item.value}
                    className={clsx('vertical-tab-selector__item', {
                        'vertical-tab-selector__item--selected': selectedValue === item.value,
                    })}
                    onClick={() => onSelect(item.value)}
                    type='button'
                >
                    <Localize i18n_default_text={item.label} />
                </button>
            ))}
        </div>
    );
};

export default VerticalTabSelector;
