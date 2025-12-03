import React from 'react';
import clsx from 'clsx';

import { getCurrencyDisplayCode } from '@deriv/shared';

type TStakeChipsProps = {
    currency: string;
    onChipSelect: (amount: number) => void;
    selected_amount?: number;
};

const CHIP_VALUES = [1, 5, 10, 15, 20, 25, 30, 40, 50, 100];

const StakeChips = ({ currency, onChipSelect, selected_amount }: TStakeChipsProps) => {
    return (
        <div className='stake-chips'>
            <div className='stake-chips__grid'>
                {CHIP_VALUES.map(value => (
                    <button
                        key={value}
                        type='button'
                        className={clsx('stake-chips__chip', {
                            'stake-chips__chip--selected': value === selected_amount,
                        })}
                        onClick={() => onChipSelect(value)}
                        aria-label={`Set stake to ${value} ${getCurrencyDisplayCode(currency)}`}
                    >
                        {value} {getCurrencyDisplayCode(currency)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StakeChips;
