import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';

import { StandaloneChevronDownRegularIcon, StandaloneClockThreeRegularIcon } from '@deriv/quill-icons';
import { Button } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import Dialog from 'App/Components/Form/TimePicker/dialog';
import { useTraderStore } from 'Stores/useTraderStores';

interface DurationEndTimeDesktopProps {
    onClose: () => void;
}

const DurationEndTimeDesktop: React.FC<DurationEndTimeDesktopProps> = observer(({ onClose }) => {
    const { expiry_time, expiry_date, market_open_times, onChangeMultiple } = useTraderStore();

    const [selectedTime, setSelectedTime] = useState(expiry_time || '09:30');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Get start and end times from market_open_times or use defaults
    const start_times =
        market_open_times?.length > 0
            ? market_open_times.map((time: string) => moment(time, 'HH:mm'))
            : [moment().add(5, 'minutes')];

    const end_times =
        market_open_times?.length > 0
            ? market_open_times.map((time: string) => moment(time, 'HH:mm').add(1, 'day'))
            : [moment().add(1, 'day').hour(23).minute(59)];

    const handleTimeClick = useCallback(() => {
        setIsDialogOpen(!isDialogOpen);
    }, [isDialogOpen]);

    // [AI]
    const handleTimeChange = useCallback((arg: string | React.ChangeEvent<HTMLInputElement>) => {
        const time = typeof arg === 'string' ? arg : arg.target.value;
        setSelectedTime(time);
    }, []);

    const handleSave = useCallback(() => {
        onChangeMultiple({
            expiry_type: 'endtime',
            expiry_time: selectedTime,
            expiry_date: expiry_date || moment().format('YYYY-MM-DD'),
        });
        onClose();
    }, [selectedTime, expiry_date, onChangeMultiple, onClose]);

    // Calculate expiry date message
    const getExpiryMessage = useCallback(() => {
        const expiryMoment = moment(expiry_date || moment().format('YYYY-MM-DD'));
        const formattedDate = expiryMoment.format('Do MMM');
        return `Contract will expire on ${formattedDate} at the selected time GMT.`;
    }, [expiry_date]);

    return (
        <div className='duration-end-time-desktop'>
            <div className='duration-end-time-desktop__field' onClick={handleTimeClick}>
                <div className='duration-end-time-desktop__field-content'>
                    <StandaloneClockThreeRegularIcon
                        className='duration-end-time-desktop__icon'
                        iconSize='sm'
                        fill='var(--semantic-color-slate-solid-surface-frame-mid)'
                    />
                    <div className='duration-end-time-desktop__time-display'>
                        <div className='duration-end-time-desktop__label'>
                            <Localize i18n_default_text='End time' />
                        </div>
                        <div className='duration-end-time-desktop__time'>{selectedTime}</div>
                    </div>
                </div>
                <StandaloneChevronDownRegularIcon
                    className='duration-end-time-desktop__chevron'
                    iconSize='sm'
                    fill='var(--semantic-color-slate-solid-surface-frame-mid)'
                />
            </div>

            {isDialogOpen && (
                <Dialog
                    preClass='duration-time-picker'
                    selected_time={selectedTime}
                    start_times={start_times}
                    end_times={end_times}
                    onChange={handleTimeChange}
                    className='duration-time-picker__dialog'
                />
            )}

            <div className='duration-end-time-desktop__message'>{getExpiryMessage()}</div>

            <div className='duration-end-time-desktop__footer'>
                <Button
                    size='lg'
                    color='black'
                    variant='primary'
                    fullWidth
                    onClick={handleSave}
                    label={<Localize i18n_default_text='Save' />}
                />
            </div>
        </div>
    );
});

export default DurationEndTimeDesktop;
// [/AI]
