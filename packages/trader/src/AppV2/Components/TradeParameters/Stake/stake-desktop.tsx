import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import { getCurrencyDisplayCode } from '@deriv/shared';
import { TextField } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import { InputPopover, ValueChips, TabSelector } from 'AppV2/Components/InputPopover';
import useTradeError from 'AppV2/Hooks/useTradeError';
import { getDisplayedContractTypes } from 'AppV2/Utils/trade-types-utils';
import { useTraderStore } from 'Stores/useTraderStores';

import { TTradeParametersProps } from '../trade-parameters';

import StakeInputDesktop from './stake-input-desktop';

const STAKE_CHIP_VALUES = [1, 5, 10, 15, 20, 25, 30, 40, 50, 100];

const Stake = observer(({ is_minimized }: TTradeParametersProps) => {
    const {
        amount,
        currency,
        contract_type,
        has_open_accu_contract,
        is_market_closed,
        is_multiplier,
        trade_types,
        trade_type_tab,
        proposal_info,
        onChange,
    } = useTraderStore();
    const { is_error_matching_field: has_error } = useTradeError({ error_fields: ['stake', 'amount'] });

    const [is_open, setIsOpen] = React.useState(false);
    const [active_tab, setActiveTab] = React.useState<'chips' | 'input'>('chips');
    const stake_field_ref = React.useRef<HTMLDivElement>(null);

    const contract_types = getDisplayedContractTypes(trade_types, contract_type, trade_type_tab);
    const is_all_types_with_errors = contract_types.every(item => proposal_info?.[item]?.has_error);

    // Showing snackbar for all cases, except when it is Rise/Fall or Digits and only one subtype has error
    const should_show_snackbar = contract_types.length === 1 || is_multiplier || is_all_types_with_errors;

    const onOpen = React.useCallback(() => {
        setIsOpen(true);
    }, []);

    const handleTabChange = (tab: 'chips' | 'input') => {
        setActiveTab(tab);
    };

    const onClose = React.useCallback(() => {
        setIsOpen(false);
        setActiveTab('chips');
    }, []);

    const handleChipSelect = React.useCallback(
        (chip_amount: number) => {
            onChange({ target: { name: 'amount', value: chip_amount } });
            onClose();
        },
        [onChange, onClose]
    );

    return (
        <React.Fragment>
            <div ref={stake_field_ref}>
                <TextField
                    disabled={has_open_accu_contract || is_market_closed}
                    variant='fill'
                    readOnly
                    label={<Localize i18n_default_text='Stake' key={`stake${is_minimized ? '-minimized' : ''}`} />}
                    noStatusIcon
                    onClick={onOpen}
                    value={`${amount} ${getCurrencyDisplayCode(currency)}`}
                    className={clsx('trade-params__option', is_minimized && 'trade-params__option--minimized')}
                    status={has_error && should_show_snackbar ? 'error' : 'neutral'}
                />
            </div>
            <InputPopover isOpen={is_open} onClose={onClose} triggerRef={stake_field_ref} className='stake-popover'>
                <div className='stake-popover__header'>
                    <TabSelector activeTab={active_tab} onTabChange={handleTabChange} />
                </div>
                <div className='stake-popover__content'>
                    {active_tab === 'chips' ? (
                        <ValueChips
                            values={STAKE_CHIP_VALUES}
                            selectedValue={amount}
                            onSelect={handleChipSelect}
                            formatValue={val => `${val} ${getCurrencyDisplayCode(currency)}`}
                        />
                    ) : (
                        <StakeInputDesktop onClose={onClose} is_open={is_open} />
                    )}
                </div>
            </InputPopover>
        </React.Fragment>
    );
});

export default Stake;
