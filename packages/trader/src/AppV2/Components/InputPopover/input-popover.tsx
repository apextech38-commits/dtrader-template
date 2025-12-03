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
    popoverWidth = 280,
    spacing = 16,
}: InputPopoverProps) => {
    const position = usePopoverPosition({
        triggerRef,
        isOpen,
        popoverWidth,
        spacing,
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
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default InputPopover;
