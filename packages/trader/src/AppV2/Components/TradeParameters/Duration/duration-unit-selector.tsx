import React from 'react';

import type { VerticalTabItem } from '../../InputPopover/vertical-tab-selector';
import VerticalTabSelector from '../../InputPopover/vertical-tab-selector';

interface DurationUnitSelectorProps {
    selectedUnit: string;
    onSelectUnit: (unit: string) => void;
    className?: string;
}

const DURATION_UNITS: VerticalTabItem[] = [
    { value: 't', label: 'Ticks' },
    { value: 's', label: 'Seconds' },
    { value: 'm', label: 'Minutes' },
    { value: 'h', label: 'Hours' },
    { value: 'd', label: 'Days' },
];

const DurationUnitSelector: React.FC<DurationUnitSelectorProps> = ({ selectedUnit, onSelectUnit, className }) => {
    return (
        <VerticalTabSelector
            items={DURATION_UNITS}
            selectedValue={selectedUnit}
            onSelect={onSelectUnit}
            className={className}
        />
    );
};

export default DurationUnitSelector;
