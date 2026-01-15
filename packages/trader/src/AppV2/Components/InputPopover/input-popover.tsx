import React from 'react';
import clsx from 'clsx';

import usePopoverPosition from './hooks/use-popover-position';
import { InputPopoverProps } from './types';

const InputPopover = ({
    isOpen,
    onClose,
    triggerRef,
    children,
    className,
    popoverWidth = 240,
    spacing = 16,
    placement = 'left',
}: InputPopoverProps) => {
    const position = usePopoverPosition({
        triggerRef,
        isOpen,
        popoverWidth,
        spacing,
        placement,
    });

    if (!isOpen) return null;

    return (
        <div className='input-popover-overlay' onClick={onClose}>
            <div
                className={clsx('input-popover', className)}
                onClick={e => e.stopPropagation()}
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    width: `${popoverWidth}px`,
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default InputPopover;
