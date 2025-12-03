import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { Button, TextField } from '@deriv-com/quill-ui';
import { Localize, useTranslations } from '@deriv-com/translations';

import { useTraderStore } from 'Stores/useTraderStores';

type TDurationInputDesktopProps = {
    unit: 's' | 'm';
    onClose: () => void;
};

const MIN_SECONDS = 15;
const MAX_SECONDS = 60;
const MIN_MINUTES = 1;
const MAX_MINUTES = 60;

const DurationInputDesktop: React.FC<TDurationInputDesktopProps> = observer(({ unit, onClose }) => {
    const { localize } = useTranslations();
    const { duration, duration_unit, onChangeMultiple } = useTraderStore();

    const [inputValue, setInputValue] = useState<string>(duration_unit === unit ? String(duration) : '');
    const [error, setError] = useState<string>('');

    const validateInput = useCallback(
        (value: string): boolean => {
            if (!value) {
                setError(localize('Duration is a required field.'));
                return false;
            }

            const numValue = Number(value);
            if (isNaN(numValue)) {
                setError(localize('Should be a valid number.'));
                return false;
            }

            const min = unit === 's' ? MIN_SECONDS : MIN_MINUTES;
            const max = unit === 's' ? MAX_SECONDS : MAX_MINUTES;
            const unitLabel = unit === 's' ? 'seconds' : 'minutes';

            if (numValue < min || numValue > max) {
                setError(
                    localize('Please enter a duration between {{min}} to {{max}} {{unit}}.', {
                        min,
                        max,
                        unit: unitLabel,
                    })
                );
                return false;
            }

            setError('');
            return true;
        },
        [localize, unit]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setInputValue(value);

            if (value.endsWith('.') || value.endsWith(',')) {
                setError(localize('Should be a valid number.'));
                return;
            }

            if (value) {
                validateInput(value);
            } else {
                setError('');
            }
        },
        [localize, validateInput]
    );

    const handleSave = useCallback(() => {
        if (!validateInput(inputValue)) {
            return;
        }

        onChangeMultiple({
            duration_unit: unit,
            duration: Number(inputValue),
            expiry_type: 'duration',
        });
        onClose();
    }, [inputValue, validateInput, onChangeMultiple, onClose]);

    const getRangeMessage = () => {
        const min = unit === 's' ? MIN_SECONDS : MIN_MINUTES;
        const max = unit === 's' ? MAX_SECONDS : MAX_MINUTES;
        const unitLabel = unit === 's' ? 'seconds' : 'minutes';

        return (
            <Localize
                i18n_default_text='Range: {{min}} - {{max}} {{unit}}'
                values={{
                    min,
                    max,
                    unit: unitLabel,
                }}
            />
        );
    };

    return (
        <div className='duration-input-desktop__wrapper'>
            <TextField
                label={localize(unit === 's' ? 'Seconds' : 'Minutes')}
                name='duration'
                value={inputValue}
                onChange={handleInputChange}
                placeholder={localize(unit === 's' ? 'Seconds' : 'Minutes')}
                variant='outline'
                inputMode='numeric'
                maxLength={unit === 's' ? 2 : 3}
                message={error || getRangeMessage()}
                status={error ? 'error' : 'neutral'}
                noStatusIcon
                data-testid='dt_duration_input_desktop'
            />
            <div className='duration-input-desktop__footer'>
                <Button
                    fullWidth
                    size='lg'
                    variant='secondary'
                    onClick={handleSave}
                    disabled={!!error || !inputValue}
                    className='duration-input-desktop__save-button'
                >
                    <Localize i18n_default_text='Save' />
                </Button>
            </div>
        </div>
    );
});

export default DurationInputDesktop;
