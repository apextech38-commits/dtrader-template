import { useCallback } from 'react';
import clsx from 'clsx';

import { useTradeParameterPopover } from './TradeParameterPopover';

export type TSelectionOption<T = string | number> = {
    value: T;
    label: string;
};

type TSelectionListPopoverProps<T = string | number> = {
    options: TSelectionOption<T>[];
    selectedValue: T;
    onSelect: (value: T) => void;
    className: string;
};

const SelectionListPopover = <T extends string | number>({
    options,
    selectedValue,
    onSelect,
    className,
}: TSelectionListPopoverProps<T>) => {
    const { closePopover } = useTradeParameterPopover();

    const handleSelectAndClose = useCallback(
        (value: T) => {
            onSelect(value);
            closePopover();
        },
        [onSelect, closePopover]
    );

    return (
        <div className={`${className}__content`}>
            {options.map(({ value, label }) => {
                const isSelected = value === selectedValue;

                return (
                    <button
                        key={String(value)}
                        type='button'
                        className={clsx(`${className}__option`, {
                            [`${className}__option--selected`]: isSelected,
                        })}
                        onClick={() => handleSelectAndClose(value)}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
};

export default SelectionListPopover;
