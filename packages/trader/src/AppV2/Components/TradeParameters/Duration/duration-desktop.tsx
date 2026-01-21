import React, { useCallback, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';

import { Text } from '@deriv-com/quill-ui';
import { Localize, localize } from '@deriv-com/translations';

import { TRADE_PARAMETER_PRESETS } from 'AppV2/Config/trade-parameter-presets';
import { useTraderStore } from 'Stores/useTraderStores';

import { TabSelector } from '../../InputPopover';
import { ChipsWithInputToggle } from '../Shared';
import TradeParameterPopover, { useTradeParameterPopover } from '../Shared/TradeParameterPopover';

import DurationEndDateDesktop from './duration-end-date-desktop';
import DurationEndTimeDesktop from './duration-end-time-desktop';
import DurationHoursInputDesktop from './duration-hours-input-desktop';
import DurationInputDesktop from './duration-input-desktop';
import DurationTicksInputDesktop from './duration-ticks-input-desktop';
import DurationUnitSelector from './duration-unit-selector';

interface DurationDesktopProps {
    is_minimized?: boolean;
}

type DurationConfig = {
    chipValues: number[] | string[];
    selectedValue: number | string;
    onSelect: (value: number | string) => void;
    formatValue: (value: number | string) => string;
    inputComponent: React.ReactNode;
};

const DurationPopoverContent: React.FC<{
    selectedUnit: string;
    activeTab: 'chips' | 'input';
    selectedDuration: number;
    availableUnits: string[];
    onDurationSelect: (value: number) => void;
    onHourSelect: (hours: number) => void;
    onEndTimeSelect: (time: string) => void;
    onEndDateSelect: (days: number) => void;
    onUnitSelect: (unit: string) => void;
    onTabChange: (tab: 'chips' | 'input') => void;
    formatTickValue: (value: number) => string;
    formatSecondsValue: (value: number) => string;
    formatMinutesValue: (value: number) => string;
    formatHoursValue: (value: number) => string;
    formatEndTimeValue: (value: string) => string;
    formatEndDateValue: (value: number) => string;
}> = ({
    selectedUnit,
    activeTab,
    selectedDuration,
    availableUnits,
    onDurationSelect,
    onHourSelect,
    onEndTimeSelect,
    onEndDateSelect,
    onUnitSelect,
    onTabChange,
    formatTickValue,
    formatSecondsValue,
    formatMinutesValue,
    formatHoursValue,
    formatEndTimeValue,
    formatEndDateValue,
}) => {
    const { closePopover } = useTradeParameterPopover();

    const handleDurationSelectAndClose = useCallback(
        (value: number) => {
            onDurationSelect(value);
            closePopover();
        },
        [onDurationSelect, closePopover]
    );

    const handleHourSelectAndClose = useCallback(
        (hours: number) => {
            onHourSelect(hours);
            closePopover();
        },
        [onHourSelect, closePopover]
    );

    const handleEndTimeSelectAndClose = useCallback(
        (time: string) => {
            onEndTimeSelect(time);
            closePopover();
        },
        [onEndTimeSelect, closePopover]
    );

    const handleEndDateSelectAndClose = useCallback(
        (days: number) => {
            onEndDateSelect(days);
            closePopover();
        },
        [onEndDateSelect, closePopover]
    );

    const config = useMemo(() => {
        const configs: Record<string, DurationConfig | null> = {
            t: {
                chipValues: TRADE_PARAMETER_PRESETS.duration.ticks,
                selectedValue: selectedDuration,
                onSelect: handleDurationSelectAndClose as (value: number | string) => void,
                formatValue: formatTickValue as (value: number | string) => string,
                inputComponent: <DurationTicksInputDesktop onClose={closePopover} />,
            },
            s: {
                chipValues: TRADE_PARAMETER_PRESETS.duration.seconds,
                selectedValue: selectedDuration,
                onSelect: handleDurationSelectAndClose as (value: number | string) => void,
                formatValue: formatSecondsValue as (value: number | string) => string,
                inputComponent: <DurationInputDesktop unit='s' onClose={closePopover} />,
            },
            m: {
                chipValues: TRADE_PARAMETER_PRESETS.duration.minutes,
                selectedValue: selectedDuration,
                onSelect: handleDurationSelectAndClose as (value: number | string) => void,
                formatValue: formatMinutesValue as (value: number | string) => string,
                inputComponent: <DurationInputDesktop unit='m' onClose={closePopover} />,
            },
            h: {
                chipValues: TRADE_PARAMETER_PRESETS.duration.hours,
                selectedValue: Math.floor(selectedDuration / 60),
                onSelect: handleHourSelectAndClose as (value: number | string) => void,
                formatValue: formatHoursValue as (value: number | string) => string,
                inputComponent: <DurationHoursInputDesktop onClose={closePopover} />,
            },
            end_time: {
                chipValues: TRADE_PARAMETER_PRESETS.duration.endTime,
                selectedValue: TRADE_PARAMETER_PRESETS.duration.endTime[0],
                onSelect: handleEndTimeSelectAndClose as (value: number | string) => void,
                formatValue: formatEndTimeValue as (value: number | string) => string,
                inputComponent: <DurationEndTimeDesktop onClose={closePopover} />,
            },
            end_date: {
                chipValues: TRADE_PARAMETER_PRESETS.duration.endDate,
                selectedValue: selectedDuration,
                onSelect: handleEndDateSelectAndClose as (value: number | string) => void,
                formatValue: formatEndDateValue as (value: number | string) => string,
                inputComponent: <DurationEndDateDesktop onClose={closePopover} />,
            },
        };
        return configs[selectedUnit] || null;
    }, [
        selectedUnit,
        selectedDuration,
        handleDurationSelectAndClose,
        handleHourSelectAndClose,
        handleEndTimeSelectAndClose,
        handleEndDateSelectAndClose,
        formatTickValue,
        formatSecondsValue,
        formatMinutesValue,
        formatHoursValue,
        formatEndTimeValue,
        formatEndDateValue,
        closePopover,
    ]);

    const hasOnlyOneUnit = availableUnits.length === 1;

    // Check if presets are disabled for the current unit
    const presetsDisabled = TRADE_PARAMETER_PRESETS.durationConfig.disabledPresets.includes(selectedUnit);

    return (
        <div className={`duration-popover__layout ${hasOnlyOneUnit ? 'duration-popover__layout--single-unit' : ''}`}>
            {!hasOnlyOneUnit && (
                <div className='duration-popover__sidebar'>
                    <DurationUnitSelector
                        selectedUnit={selectedUnit}
                        onSelectUnit={onUnitSelect}
                        availableUnits={availableUnits}
                    />
                </div>
            )}
            <div className='duration-popover__main'>
                {config && !presetsDisabled && (
                    <div className='duration-popover__header'>
                        <TabSelector activeTab={activeTab} onTabChange={onTabChange} />
                    </div>
                )}
                <div className='duration-popover__content'>
                    {config ? (
                        presetsDisabled ? (
                            config.inputComponent
                        ) : (
                            <ChipsWithInputToggle
                                activeTab={activeTab}
                                chipValues={config.chipValues as number[]}
                                selectedValue={config.selectedValue as number}
                                onSelect={config.onSelect as (value: number) => void}
                                formatValue={config.formatValue as (value: number) => string}
                                inputComponent={config.inputComponent}
                            />
                        )
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
    );
};

const DurationDesktop: React.FC<DurationDesktopProps> = observer(({ is_minimized }) => {
    const {
        duration,
        duration_unit,
        duration_units_list,
        onChangeMultiple,
        is_market_closed,
        expiry_type,
        expiry_time,
        expiry_date,
    } = useTraderStore();

    const availableUnits = React.useMemo(() => {
        const units = duration_units_list.map(unit => unit.value);
        // Add end_time and end_date for contracts that support them
        // (they're expiry types, not duration units, so they're not in duration_units_list)
        // Only add them if the contract has more than just ticks (digit contracts only have ticks)
        const hasOnlyTicks = units.length === 1 && units[0] === 't';
        if (!hasOnlyTicks) {
            if (!units.includes('end_time')) {
                units.push('end_time');
            }
            if (!units.includes('end_date')) {
                units.push('end_date');
            }
        }
        return units;
    }, [duration_units_list]);

    const popoverWidth = React.useMemo(() => {
        // Use narrower width for single-unit contracts (like digit contracts)
        return availableUnits.length === 1 ? 280 : 360;
    }, [availableUnits]);

    const [selectedUnit, setSelectedUnit] = useState('t'); // Default to Ticks
    const [selectedDuration, setSelectedDuration] = useState(duration);
    const [activeTab, setActiveTab] = useState<'chips' | 'input'>('chips');

    const handleOpenPopover = useCallback(() => {
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
        },
        [selectedUnit, onChangeMultiple]
    );

    const handleHourSelect = useCallback(
        (hours: number) => {
            const totalMinutes = hours * 60;
            setSelectedDuration(totalMinutes);
            // Save as minutes
            onChangeMultiple({
                duration_unit: 'm',
                duration: totalMinutes,
                expiry_type: 'duration',
            });
        },
        [onChangeMultiple]
    );

    const formatTickValue = useCallback((value: number) => {
        return localize('{{count}} {{tick_label}}', {
            count: value,
            tick_label: value === 1 ? localize('tick') : localize('ticks'),
        });
    }, []);

    const formatSecondsValue = useCallback((value: number) => {
        return localize('{{count}} {{second_label}}', {
            count: value,
            second_label: localize('sec'),
        });
    }, []);

    const formatMinutesValue = useCallback((value: number) => {
        return localize('{{count}} {{minute_label}}', {
            count: value,
            minute_label: localize('min'),
        });
    }, []);

    const formatHoursValue = useCallback((value: number) => {
        return localize('{{count}} hr', {
            count: value,
        });
    }, []);

    const formatEndTimeValue = useCallback((value: string) => {
        return value; // Time is already formatted as HH:MM
    }, []);

    const formatEndDateValue = useCallback((value: number) => {
        const date = new Date();
        date.setDate(date.getDate() + value);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        return `${day} ${month}`;
    }, []);

    const handleEndTimeSelect = useCallback(
        (time: string) => {
            onChangeMultiple({
                expiry_type: 'endtime',
                expiry_time: time,
            });
        },
        [onChangeMultiple]
    );

    const handleEndDateSelect = useCallback(
        (days: number) => {
            const date = new Date();
            date.setDate(date.getDate() + days);
            const formattedDate = date.toISOString().split('T')[0];
            onChangeMultiple({
                expiry_type: 'endtime',
                expiry_date: formattedDate,
            });
        },
        [onChangeMultiple]
    );

    const getDisplayValue = useCallback(() => {
        if (expiry_type === 'endtime') {
            if (expiry_time && expiry_date) {
                const date = moment(expiry_date);
                const formattedDate = date.format('D MMM');
                const formattedTime = expiry_time.substring(0, 5);
                return `${formattedDate}, ${formattedTime}`;
            }
            if (expiry_date) {
                const date = moment(expiry_date);
                const formattedDate = date.format('D MMM');
                return formattedDate;
            }
        }

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
                return localize('{{count}} {{hour_label}}', {
                    count: hours,
                    hour_label: hours === 1 ? localize('hour') : localize('hours'),
                });
            }
            // If it has both hours and minutes
            if (hours > 0 && minutes > 0) {
                return localize('{{hours_count}} {{hour_label}} {{minutes_count}} {{minute_label}}', {
                    hours_count: hours,
                    hour_label: hours === 1 ? localize('hour') : localize('hours'),
                    minutes_count: minutes,
                    minute_label: minutes === 1 ? localize('minute') : localize('minutes'),
                });
            }
            // Otherwise display as minutes
            return formatMinutesValue(duration);
        }
        return `${duration} ${duration_unit}`;
    }, [
        duration,
        duration_unit,
        expiry_type,
        expiry_time,
        expiry_date,
        formatTickValue,
        formatSecondsValue,
        formatMinutesValue,
    ]);

    return (
        <TradeParameterPopover
            popoverWidth={popoverWidth}
            label={<Localize i18n_default_text='Duration' key={`duration${is_minimized ? '-minimized' : ''}`} />}
            is_minimized={is_minimized}
            disabled={is_market_closed}
            popover_classname='duration-popover'
            value={getDisplayValue()}
            onOpen={handleOpenPopover}
            onClose={handleClosePopover}
        >
            <DurationPopoverContent
                selectedUnit={selectedUnit}
                activeTab={activeTab}
                selectedDuration={selectedDuration}
                availableUnits={availableUnits}
                onDurationSelect={handleDurationSelect}
                onHourSelect={handleHourSelect}
                onEndTimeSelect={handleEndTimeSelect}
                onEndDateSelect={handleEndDateSelect}
                onUnitSelect={handleUnitSelect}
                onTabChange={handleTabChange}
                formatTickValue={formatTickValue}
                formatSecondsValue={formatSecondsValue}
                formatMinutesValue={formatMinutesValue}
                formatHoursValue={formatHoursValue}
                formatEndTimeValue={formatEndTimeValue}
                formatEndDateValue={formatEndDateValue}
            />
        </TradeParameterPopover>
    );
});

export default DurationDesktop;
