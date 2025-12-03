import React, { useCallback, useRef, useState } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import { Text, TextField } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import { useTraderStore } from 'Stores/useTraderStores';

import { InputPopover, TabSelector, ValueChips } from '../../InputPopover';

import DurationEndTimeDesktop from './duration-end-time-desktop';
import DurationHoursInputDesktop from './duration-hours-input-desktop';
import DurationInputDesktop from './duration-input-desktop';
import DurationUnitSelector from './duration-unit-selector';

const DURATION_TICK_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const DURATION_SECONDS_VALUES = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
const DURATION_MINUTES_VALUES = [1, 2, 3, 4, 5, 10, 15, 30, 45, 60];
const DURATION_HOURS_VALUES = [1, 2, 3, 4, 6, 8, 10, 12, 18, 24];

interface DurationDesktopProps {
    is_minimized?: boolean;
}

const DurationDesktop: React.FC<DurationDesktopProps> = observer(({ is_minimized }) => {
    const { duration, duration_unit, onChangeMultiple, is_market_closed } = useTraderStore();

    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState('t'); // Default to Ticks
    const [selectedDuration, setSelectedDuration] = useState(duration);
    const [activeTab, setActiveTab] = useState<'chips' | 'input'>('chips');
    const inputRef = useRef<HTMLDivElement>(null);

    const handleOpenPopover = useCallback(() => {
        setIsPopoverOpen(true);
        setSelectedUnit(
            duration_unit === 's'
                ? 's'
                : duration_unit === 'm'
                  ? 'm'
                  : duration_unit === 'h'
                    ? 'h'
                    : duration_unit === 'end_time'
                      ? 'end_time'
                      : 't'
        );
        setSelectedDuration(duration);
        setActiveTab('chips'); // Always start with chips tab
    }, [duration, duration_unit]);

    const handleClosePopover = useCallback(() => {
        setIsPopoverOpen(false);
        setActiveTab('chips'); // Reset to chips tab on close
    }, []);

    const handleUnitSelect = useCallback((unit: string) => {
        setSelectedUnit(unit);
        setActiveTab('chips'); // Reset to chips tab when changing units
    }, []);

    const handleTabChange = useCallback((tab: 'chips' | 'input') => {
        setActiveTab(tab);
    }, []);

    const handleDurationSelect = useCallback(
        (value: number) => {
            setSelectedDuration(value);
            // Apply the change immediately based on selected unit
            onChangeMultiple({
                duration_unit: selectedUnit,
                duration: value,
                expiry_type: 'duration',
            });
            handleClosePopover();
        },
        [selectedUnit, onChangeMultiple, handleClosePopover]
    );

    const formatTickValue = useCallback((value: number) => {
        return `${value} ${value === 1 ? 'tick' : 'ticks'}`;
    }, []);

    const formatSecondsValue = useCallback((value: number) => {
        return `${value} ${value === 1 ? 'second' : 'seconds'}`;
    }, []);

    const formatMinutesValue = useCallback((value: number) => {
        return `${value} ${value === 1 ? 'minute' : 'minutes'}`;
    }, []);

    const formatHoursValue = useCallback((value: number) => {
        return `${value} hr`;
    }, []);

    const getDisplayValue = useCallback(() => {
        if (duration_unit === 't') {
            return formatTickValue(duration);
        }
        if (duration_unit === 's') {
            return formatSecondsValue(duration);
        }
        if (duration_unit === 'm') {
            // Check if this is hours (stored as minutes)
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;

            // If it's a whole hour value (no remainder), display as hours
            if (minutes === 0 && hours > 0) {
                return `${hours} hr`;
            }
            // If it has both hours and minutes
            if (hours > 0 && minutes > 0) {
                return `${hours} hr ${minutes} min`;
            }
            // Otherwise display as minutes
            return formatMinutesValue(duration);
        }
        return `${duration} ${duration_unit}`;
    }, [duration, duration_unit, formatTickValue, formatSecondsValue, formatMinutesValue]);

    return (
        <>
            <div ref={inputRef}>
                <TextField
                    variant='fill'
                    readOnly
                    label={
                        <Localize i18n_default_text='Duration' key={`duration${is_minimized ? '-minimized' : ''}`} />
                    }
                    value={getDisplayValue()}
                    noStatusIcon
                    disabled={is_market_closed}
                    className={clsx('trade-params__option', is_minimized && 'trade-params__option--minimized')}
                    onClick={handleOpenPopover}
                />
            </div>

            <InputPopover
                isOpen={isPopoverOpen}
                onClose={handleClosePopover}
                triggerRef={inputRef}
                className='duration-popover'
            >
                <div className='duration-popover__layout'>
                    <div className='duration-popover__sidebar'>
                        <DurationUnitSelector selectedUnit={selectedUnit} onSelectUnit={handleUnitSelect} />
                    </div>
                    <div className='duration-popover__main'>
                        {(selectedUnit === 's' || selectedUnit === 'm' || selectedUnit === 'h') && (
                            <div className='duration-popover__header'>
                                <TabSelector activeTab={activeTab} onTabChange={handleTabChange} />
                            </div>
                        )}
                        <div className='duration-popover__content'>
                            {selectedUnit === 't' ? (
                                <ValueChips
                                    values={DURATION_TICK_VALUES}
                                    selectedValue={selectedDuration}
                                    onSelect={handleDurationSelect}
                                    formatValue={formatTickValue}
                                />
                            ) : selectedUnit === 's' ? (
                                activeTab === 'chips' ? (
                                    <ValueChips
                                        values={DURATION_SECONDS_VALUES}
                                        selectedValue={selectedDuration}
                                        onSelect={handleDurationSelect}
                                        formatValue={formatSecondsValue}
                                    />
                                ) : (
                                    <DurationInputDesktop unit='s' onClose={handleClosePopover} />
                                )
                            ) : selectedUnit === 'm' ? (
                                activeTab === 'chips' ? (
                                    <ValueChips
                                        values={DURATION_MINUTES_VALUES}
                                        selectedValue={selectedDuration}
                                        onSelect={handleDurationSelect}
                                        formatValue={formatMinutesValue}
                                    />
                                ) : (
                                    <DurationInputDesktop unit='m' onClose={handleClosePopover} />
                                )
                            ) : selectedUnit === 'h' ? (
                                activeTab === 'chips' ? (
                                    <ValueChips
                                        values={DURATION_HOURS_VALUES}
                                        selectedValue={Math.floor(selectedDuration / 60)} // Convert minutes to hours for chip selection
                                        onSelect={hours => {
                                            const totalMinutes = hours * 60;
                                            setSelectedDuration(totalMinutes);
                                            // Save as minutes
                                            onChangeMultiple({
                                                duration_unit: 'm',
                                                duration: totalMinutes,
                                                expiry_type: 'duration',
                                            });
                                            handleClosePopover();
                                        }}
                                        formatValue={formatHoursValue}
                                    />
                                ) : (
                                    <DurationHoursInputDesktop onClose={handleClosePopover} />
                                )
                            ) : selectedUnit === 'end_time' ? (
                                <DurationEndTimeDesktop onClose={handleClosePopover} />
                            ) : (
                                <div className='duration-popover__coming-soon'>
                                    <Text size='md' color='quill-typography-default'>
                                        <Localize i18n_default_text='Coming soon' />
                                    </Text>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </InputPopover>
        </>
    );
});

export default DurationDesktop;
