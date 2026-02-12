import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { useMobileBridge } from '@deriv/api';
import { LabelPairedPresentationScreenSmRegularIcon } from '@deriv/quill-icons';
import { trackAnalyticsEvent } from '@deriv/shared';
import { safeParse } from '@deriv/utils';
import { ActionSheet, Button, Chip, Text } from '@deriv-com/quill-ui';
import { Localize, useTranslations } from '@deriv-com/translations';

import Carousel from 'AppV2/Components/Carousel';
import CarouselHeader from 'AppV2/Components/Carousel/carousel-header';
import TradeTypesSelectionGuide from 'AppV2/Components/OnboardingGuide/TradeTypesSelectionGuide';
import { checkContractTypePrefix } from 'AppV2/Utils/contract-type';
import { getTradeTypesList, sortCategoriesInTradeTypeOrder } from 'AppV2/Utils/trade-types-utils';
import { useTraderStore } from 'Stores/useTraderStores';

import Guide from '../../Components/Guide';

import TradeTypesContent from './trade-types-content';

type TTradeTypesProps = {
    onTradeTypeSelect: (
        e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
        subform_name: string,
        trade_type_count: number
    ) => void;
    trade_types: ReturnType<typeof getTradeTypesList>;
    contract_type: string;
    is_dark_mode_on: boolean;
} & Pick<ReturnType<typeof useTraderStore>, 'contract_type'>;

export type TItem = {
    id: string;
    title: string;
    icon?: React.ReactNode;
};

export type TResultItem = {
    id: string;
    title?: string;
    button_title?: string;
    onButtonClick?: () => void;
    items: TItem[];
};

const TradeTypes = ({ contract_type, onTradeTypeSelect, trade_types, is_dark_mode_on }: TTradeTypesProps) => {
    const { localize } = useTranslations();
    const { isBridgeAvailable } = useMobileBridge();
    const [is_open, setIsOpen] = React.useState<boolean>(false);
    const [is_editing, setIsEditing] = React.useState<boolean>(false);
    const trade_types_ref = React.useRef<HTMLDivElement>(null);

    const createArrayFromCategories = (data: TTradeTypesProps['trade_types']): TItem[] => {
        const result: TItem[] = [];

        data.forEach(category => {
            result.push({
                id: category.value,
                title: category.text ?? '',
            });
        });

        return result;
    };

    const trade_types_array = useMemo(() => {
        return createArrayFromCategories(trade_types);
    }, [trade_types]);

    const trade_types_ids = useMemo(() => {
        return trade_types_array.map(type => type.id);
    }, [trade_types_array]);

    const saved_pinned_trade_types_string: string = localStorage.getItem('pinned_trade_types') ?? '[]';

    // Keep raw saved types for localStorage update
    const raw_saved_pinned_trade_types: TResultItem[] = useMemo(
        () => safeParse(saved_pinned_trade_types_string) ?? [],
        [saved_pinned_trade_types_string]
    );

    // Filter localStorage data immediately to prevent stale types from rendering in native mobile app
    const saved_pinned_trade_types: TResultItem[] = useMemo(() => {
        if (trade_types_ids.length === 0) return raw_saved_pinned_trade_types;

        // Filter out unavailable trade types before component renders
        return raw_saved_pinned_trade_types.map((category: TResultItem) => ({
            ...category,
            items: category.items.filter((item: TItem) => trade_types_ids.includes(item.id)),
        }));
    }, [raw_saved_pinned_trade_types, trade_types_ids]);

    const [other_trade_types, setOtherTradeTypes] = useState<TResultItem[]>([]);
    const [pinned_trade_types, setPinnedTradeTypes] = useState<TResultItem[]>(saved_pinned_trade_types);

    // Sync localStorage with current available trade types to persist cleanup
    useEffect(() => {
        if (trade_types_array.length > 0 && raw_saved_pinned_trade_types.length > 0) {
            const filtered_pinned = raw_saved_pinned_trade_types.map((category: TResultItem) => ({
                ...category,
                items: category.items.filter((item: TItem) => trade_types_ids.includes(item.id)),
            }));

            // Only update localStorage if something changed to avoid unnecessary writes
            const current_items = raw_saved_pinned_trade_types.flatMap(type => type.items);
            const filtered_items = filtered_pinned.flatMap(type => type.items);

            // Check both length and actual item IDs to detect any changes
            const hasChanged =
                current_items.length !== filtered_items.length ||
                !current_items.every((item: TItem) =>
                    filtered_items.some((filtered: TItem) => filtered.id === item.id)
                );

            if (hasChanged) {
                localStorage.setItem('pinned_trade_types', JSON.stringify(filtered_pinned));
            }
        }
    }, [trade_types_ids, trade_types_array.length, raw_saved_pinned_trade_types]);

    const getItems = (trade_types: TResultItem[]) => trade_types.flatMap(type => type.items);

    const filterItems = (items: TItem[], validTradeTypeIds: string[]): TItem[] => {
        return items.filter(item => validTradeTypeIds.includes(item.id));
    };

    const getPinnedItems = useCallback(() => {
        const pinned_items = filterItems(getItems(saved_pinned_trade_types), trade_types_ids);

        if (pinned_items.length === 0) {
            pinned_items.push(...trade_types_array.slice(0, trade_types_array.length));
        }
        return pinned_items;
    }, [saved_pinned_trade_types, trade_types_ids, trade_types_array]);

    const setTradeTypes = useCallback(() => {
        const pinned_items = getPinnedItems();

        const default_pinned_trade_types = [
            {
                id: 'pinned',
                title: localize('Pinned'),
                items: pinned_items,
            },
        ];

        const default_other_trade_types = [
            {
                id: 'other',
                items: trade_types_array.filter(item => !pinned_items.some(pinned_item => pinned_item.id === item.id)),
            },
        ];

        setPinnedTradeTypes(default_pinned_trade_types);
        setOtherTradeTypes(default_other_trade_types);
    }, [getPinnedItems, trade_types_array]);

    useEffect(() => {
        setTradeTypes();
    }, [setTradeTypes]);

    useEffect(() => {
        scrollToSelectedTradeType();
    }, []);

    const handleCloseTradeTypes = () => {
        setIsOpen(false);
        setIsEditing(false);
    };

    const handleCustomizeTradeTypes = () => {
        trackAnalyticsEvent('ce_trade_types_form_v2', {
            action: 'customizing_trades',
        });
        setIsEditing(true);
    };

    const handleAddPinnedClick = (item: TItem) => {
        setOtherTradeTypes(prev_categories => modifyCategories(prev_categories, item));
        setPinnedTradeTypes(prev_pinned => modifyPinnedCategories(prev_pinned, item, 'add'));
    };

    const handleRemovePinnedClick = (item: TItem) => {
        setPinnedTradeTypes(prev_categories => modifyCategories(prev_categories, item));
        setOtherTradeTypes(prev_others => modifyOtherCategories(prev_others, item));
    };

    const modifyPinnedCategories = (categories: TResultItem[], item: TItem, action: 'add' | 'remove') => {
        return categories.map(category => {
            if (category.id === 'pinned') {
                return {
                    ...category,
                    items: action === 'add' ? [...category.items, item] : category.items.filter(i => i.id !== item.id),
                };
            }
            return category;
        });
    };

    const modifyCategories = (categories: TResultItem[], item: TItem) =>
        categories.map(category => ({
            ...category,
            items: category.items.filter(i => i.id !== item.id),
        }));

    const modifyOtherCategories = (categories: TResultItem[], item: TItem) => {
        return categories.map(category => {
            if (category.id === 'other') {
                return {
                    ...category,
                    items: sortCategoriesInTradeTypeOrder(trade_types, [...category.items, item]),
                };
            }
            return category;
        });
    };

    const scrollToSelectedTradeType = () => {
        setTimeout(() => {
            let position_x = 0;
            if (trade_types_ref.current) {
                const selected_chip = trade_types_ref.current.querySelector(
                    'button[data-state="selected"]'
                ) as HTMLButtonElement;
                if (selected_chip) {
                    position_x =
                        selected_chip.getBoundingClientRect().x -
                            (window.innerWidth - selected_chip.getBoundingClientRect().width) / 2 || 0;
                }
                trade_types_ref.current.scrollBy({
                    left: position_x,
                    top: 0,
                });
            }
        }, 0);
    };

    const savePinnedToLocalStorage = () => {
        localStorage.setItem('pinned_trade_types', JSON.stringify(pinned_trade_types));
        setIsEditing(false);
    };

    const handleOnDrag = (categories: TResultItem[]) => {
        setPinnedTradeTypes(categories);
    };

    const handleOnTradeTypeSelect = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
        onTradeTypeSelect(e, 'trade_type_page', getPinnedItems().length);
        scrollToSelectedTradeType();
        setIsOpen(false);
    };

    const handleOpenActionSheet = () => {
        trackAnalyticsEvent('ce_trade_types_form_v2', {
            action: 'open',
        });
        setTradeTypes();
        setIsOpen(true);
    };

    const isTradeTypeSelected = (value: string) =>
        checkContractTypePrefix([contract_type, value]) || contract_type === value;

    const getTradeTypeChips = () => {
        const pinned_items = getPinnedItems();
        const is_contract_type_in_pinned = pinned_items.some(item => item.id === contract_type);

        const other_item = !is_contract_type_in_pinned
            ? getItems(other_trade_types).find(
                  item => item && (item.id === contract_type || checkContractTypePrefix([item.id, contract_type]))
              )
            : null;

        // Filter to only include items that exist in current trade_types to prevent unavailable types from showing
        return [...pinned_items, other_item].filter(item => item && trade_types_ids.includes(item.id)) as TItem[];
    };

    const trade_type_chips = getTradeTypeChips();
    const should_show_view_all = trade_type_chips.length >= 2 || getItems(other_trade_types).length > 0;
    const show_trade_type_list_divider = !!other_trade_types[0]?.items?.length;
    const show_editing_divider = trade_types_array.length !== pinned_trade_types[0]?.items?.length;
    const trade_type_content_props = {
        handleCustomizeTradeTypes,
        handleRemovePinnedClick,
        handleOnDrag,
        handleOnTradeTypeSelect,
        handleAddPinnedClick,
        is_editing,
        is_dark_mode_on,
        isTradeTypeSelected,
        savePinnedToLocalStorage,
        show_trade_type_list_divider,
        show_editing_divider,
        other_trade_types,
        pinned_trade_types,
    };

    const action_sheet_content = [
        {
            id: 1,
            component: <TradeTypesContent {...trade_type_content_props} />,
        },
        {
            id: 2,
            component: <Guide show_trigger_button={false} is_open_by_default show_description_in_a_modal={false} />,
        },
    ];

    return (
        <div className='trade__trade-types' ref={trade_types_ref}>
            {trade_type_chips.map(({ title, id }: TItem) => (
                <Chip.Selectable
                    key={id}
                    onChipSelect={e => onTradeTypeSelect(e, 'main_trade_page', getPinnedItems().length)}
                    selected={isTradeTypeSelected(id)}
                >
                    <Text size='sm'>{title}</Text>
                </Chip.Selectable>
            ))}
            {should_show_view_all && !isBridgeAvailable && (
                <Button
                    key='trade-types-all'
                    onClick={handleOpenActionSheet}
                    variant='tertiary'
                    className='trade__trade-types-header'
                    color={is_dark_mode_on ? 'white' : 'black'}
                >
                    <Text size='sm' bold underlined color='var(--component-button-label-color-blackWhite-tertiary)'>
                        <Localize i18n_default_text='View all' />
                    </Text>
                </Button>
            )}
            <ActionSheet.Root
                className={clsx('trade-types-dialog', {
                    'trade-types-dialog--is_editing': is_editing,
                })}
                isOpen={is_open}
                expandable={false}
                onClose={handleCloseTradeTypes}
            >
                <ActionSheet.Portal shouldCloseOnDrag>
                    {is_editing ? (
                        <React.Fragment>
                            <ActionSheet.Header
                                title={
                                    <div className='trade-types-dialog__title'>
                                        <Localize i18n_default_text='Trade types' />
                                    </div>
                                }
                            />
                            <TradeTypesContent {...trade_type_content_props} />
                        </React.Fragment>
                    ) : (
                        <Carousel
                            header={CarouselHeader}
                            pages={action_sheet_content}
                            title={<Localize i18n_default_text='Trade types' />}
                            next_icon={LabelPairedPresentationScreenSmRegularIcon}
                            onNextButtonClick={() => {
                                const selected_trade_type = trade_types.find(({ value }) => value === contract_type);
                                trackAnalyticsEvent('ce_trade_types_form_v2', {
                                    action: 'info_open',
                                    trade_type_name: selected_trade_type?.text || contract_type,
                                });
                            }}
                        />
                    )}
                </ActionSheet.Portal>
            </ActionSheet.Root>
            {is_open && <TradeTypesSelectionGuide is_dark_mode_on={is_dark_mode_on} />}
        </div>
    );
};

export default React.memo(TradeTypes);
