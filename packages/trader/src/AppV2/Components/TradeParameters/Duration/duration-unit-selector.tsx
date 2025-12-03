import React from 'react';
import clsx from 'clsx';

import { Localize } from '@deriv-com/translations';

interface DurationUnit {
    value: string;
    label: string;
}

interface DurationUnitSelectorProps {
    selectedUnit: string;
    onSelectUnit: (unit: string) => void;
    className?: string;
}

const DURATION_UNITS: DurationUnit[] = [
    { value: 't', label: 'Ticks' },
    { value: 's', label: 'Seconds' },
    { value: 'm', label: 'Minutes' },
    { value: 'h', label: 'Hours' },
    { value: 'end_time', label: 'End time' },
    { value: 'end_date', label: 'End date' },
];

const DurationUnitSelector: React.FC<DurationUnitSelectorProps> = ({ selectedUnit, onSelectUnit, className }) => {
    return (
        <div className={clsx('duration-unit-selector', className)}>
            {DURATION_UNITS.map(unit => (
                <button
                    key={unit.value}
                    className={clsx('duration-unit-selector__item', {
                        'duration-unit-selector__item--selected': selectedUnit === unit.value,
                    })}
                    onClick={() => onSelectUnit(unit.value)}
                    type='button'
                >
                    <Localize i18n_default_text={unit.label} />
                </button>
            ))}
        </div>
    );
};

export default DurationUnitSelector;
