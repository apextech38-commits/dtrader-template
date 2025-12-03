import React from 'react';

import { PopoverPosition, UsePopoverPositionProps } from '../types';

const usePopoverPosition = ({
    triggerRef,
    isOpen,
    popoverWidth = 280,
    spacing = 16,
}: UsePopoverPositionProps): PopoverPosition => {
    const [position, setPosition] = React.useState<PopoverPosition>({ top: 0, left: 0 });

    React.useEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const calculatePosition = () => {
            if (!triggerRef.current) return;

            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top,
                left: rect.left - popoverWidth - spacing,
            });
        };

        calculatePosition();

        window.addEventListener('resize', calculatePosition);
        return () => window.removeEventListener('resize', calculatePosition);
    }, [isOpen, triggerRef, popoverWidth, spacing]);

    return position;
};

export default usePopoverPosition;
