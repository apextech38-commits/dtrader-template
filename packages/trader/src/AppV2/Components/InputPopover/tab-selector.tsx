import React from 'react';

import { LabelPairedKeyboardCaptionBoldIcon } from '@deriv/quill-icons';
import { SegmentedControlSingleChoice } from '@deriv-com/quill-ui';

export const LightningIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M13 2L3 14h8l-1 8 10-12h-8l1-8z' fill='currentColor' />
    </svg>
);

type TTabSelectorProps = {
    activeTab: 'chips' | 'input';
    onTabChange: (tab: 'chips' | 'input') => void;
};

export const TabSelector: React.FC<TTabSelectorProps> = ({ activeTab, onTabChange }) => {
    const tab_options = [
        { label: <LightningIcon />, value: 'chips' },
        { label: <LabelPairedKeyboardCaptionBoldIcon />, value: 'input' },
    ];

    const handleTabChange = (index: number) => {
        onTabChange(index === 0 ? 'chips' : 'input');
    };

    return (
        <SegmentedControlSingleChoice
            hasContainerWidth
            onChange={handleTabChange}
            options={tab_options}
            selectedItemIndex={activeTab === 'chips' ? 0 : 1}
            size='sm'
        />
    );
};
