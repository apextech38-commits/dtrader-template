import React from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';

import { useLocalStorageData } from '@deriv/api';
import { Text } from '@deriv/components';
import { LabelPairedXmarkMdRegularIcon } from '@deriv/quill-icons';
import { Button, Heading } from '@deriv-com/quill-ui';
import { Localize, useTranslations } from '@deriv-com/translations';

import { CHART_INTRO_GUIDE_LOCALSTORAGE_KEY, CHART_INTRO_STEPS } from '../chart-intro-guide-config';

import ChartIntroVideo from './chart-intro-video';
import ProgressBars from './progress-bars';

import './chart-intro-guide.scss';

const STEP_DURATION = 5000; // 5 seconds per step
const PROGRESS_UPDATE_INTERVAL = 50; // Update progress every 50ms

type TChartIntroGuideProps = {
    is_mobile?: boolean;
    is_logged_in?: boolean;
};

const ChartIntroGuide = ({ is_mobile = false, is_logged_in = false }: TChartIntroGuideProps) => {
    const { localize } = useTranslations();
    const [is_modal_open, setIsModalOpen] = React.useState(false);
    const [current_step, setCurrentStep] = React.useState(1);
    const [video_progress, setVideoProgress] = React.useState(0);

    const progress_interval_ref = React.useRef<NodeJS.Timeout>();
    const step_timer_ref = React.useRef<NodeJS.Timeout>();
    const start_time_ref = React.useRef<number>(0);

    const [chart_intro_guide_seen, setChartIntroGuideSeen] = useLocalStorageData<boolean>(
        CHART_INTRO_GUIDE_LOCALSTORAGE_KEY,
        false
    );

    const current_step_data = CHART_INTRO_STEPS[current_step - 1];
    const is_final_step = current_step === CHART_INTRO_STEPS.length;

    const startProgressTimer = React.useCallback(() => {
        start_time_ref.current = Date.now();
        setVideoProgress(0);

        progress_interval_ref.current = setInterval(() => {
            const elapsed = Date.now() - start_time_ref.current;
            const progress = Math.min((elapsed / STEP_DURATION) * 100, 100);
            setVideoProgress(progress);
        }, PROGRESS_UPDATE_INTERVAL);

        step_timer_ref.current = setTimeout(() => {
            if (progress_interval_ref.current) {
                clearInterval(progress_interval_ref.current);
            }
            setVideoProgress(100);

            if (!is_final_step) {
                setTimeout(() => {
                    setVideoProgress(0);
                    setCurrentStep(prev => prev + 1);
                }, 300);
            }
        }, STEP_DURATION);
    }, [is_final_step]);

    const stopProgressTimer = React.useCallback(() => {
        if (progress_interval_ref.current) {
            clearInterval(progress_interval_ref.current);
        }
        if (step_timer_ref.current) {
            clearTimeout(step_timer_ref.current);
        }
    }, []);

    const handleClose = React.useCallback(() => {
        stopProgressTimer();
        setIsModalOpen(false);
        setChartIntroGuideSeen(true);
        // Ensure the flag is set in localStorage directly as well
        localStorage.setItem(CHART_INTRO_GUIDE_LOCALSTORAGE_KEY, 'true');
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('localStorageUpdated'));
    }, [setChartIntroGuideSeen, stopProgressTimer]);

    const handleGotIt = React.useCallback(() => {
        stopProgressTimer();
        setIsModalOpen(false);
        setChartIntroGuideSeen(true);
        // Ensure the flag is set in localStorage directly as well
        localStorage.setItem(CHART_INTRO_GUIDE_LOCALSTORAGE_KEY, 'true');
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('localStorageUpdated'));
    }, [setChartIntroGuideSeen, stopProgressTimer]);

    const handleNext = React.useCallback(() => {
        if (current_step < CHART_INTRO_STEPS.length) {
            stopProgressTimer();
            setVideoProgress(0);
            setCurrentStep(current_step + 1);
        }
    }, [current_step, stopProgressTimer]);

    const handleBack = React.useCallback(() => {
        if (current_step > 1) {
            stopProgressTimer();
            setVideoProgress(0);
            setCurrentStep(current_step - 1);
        }
    }, [current_step, stopProgressTimer]);

    // Start progress timer when step changes
    React.useEffect(() => {
        if (is_modal_open) {
            startProgressTimer();
        }

        return () => {
            stopProgressTimer();
        };
    }, [current_step, is_modal_open, startProgressTimer, stopProgressTimer]);

    // Show modal after delay if not seen before
    React.useEffect(() => {
        if (!chart_intro_guide_seen && is_logged_in) {
            // Mobile-only: Check if user has completed onboarding guides
            if (is_mobile) {
                const guide_dtrader_v2_raw = localStorage.getItem('guide_dtrader_v2');

                if (guide_dtrader_v2_raw) {
                    try {
                        const guide_dtrader_v2 = JSON.parse(guide_dtrader_v2_raw);
                        const all_guides_completed = Object.values(guide_dtrader_v2).every(value => value === true);

                        // If any guide is not completed (user is new), mark chart intro as seen
                        if (!all_guides_completed) {
                            setChartIntroGuideSeen(true);
                            return;
                        }
                    } catch {
                        // If parsing fails, continue to show the modal
                    }
                }
            }

            const timer = setTimeout(() => {
                setIsModalOpen(true);
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [chart_intro_guide_seen, is_mobile, is_logged_in, setChartIntroGuideSeen]);

    if (!is_modal_open) return null;

    const modal_class = clsx('chart-intro-guide', {
        'chart-intro-guide--mobile': is_mobile,
        'chart-intro-guide--desktop': !is_mobile,
    });

    const content = is_mobile ? (
        <>
            <div className='chart-intro-guide__header'>
                <button
                    className='chart-intro-guide__close-button'
                    onClick={handleClose}
                    data-testid='dt_chart_intro_close_button'
                    aria-label='Close'
                >
                    <LabelPairedXmarkMdRegularIcon fill='#FFFFFF' />
                </button>

                <ProgressBars
                    current_step={current_step}
                    total_steps={CHART_INTRO_STEPS.length}
                    video_progress={video_progress}
                    is_mobile={is_mobile}
                />
            </div>

            <div className='chart-intro-guide__body'>
                <div className='chart-intro-guide__text-content'>
                    <Heading.H4 className='chart-intro-guide__title'>{current_step_data.title}</Heading.H4>
                    <Text size='md' className='chart-intro-guide__description'>
                        {current_step_data.description}
                    </Text>
                </div>

                <ChartIntroVideo key={current_step} video_id={current_step_data.video_id} is_mobile={is_mobile} />

                <div className='chart-intro-guide__navigation'>
                    <div>
                        {current_step > 1 && (
                            <Button
                                size='lg'
                                variant='secondary'
                                onClick={handleBack}
                                data-testid='dt_chart_intro_back_button'
                                color='white-black'
                                className='chart-intro-guide__button chart-intro-guide__button--back'
                            >
                                <Text size='lg' weight='bold' className='chart-intro-guide__button-text'>
                                    <Localize i18n_default_text='Back' />
                                </Text>
                            </Button>
                        )}
                    </div>
                    <div>
                        {is_final_step ? (
                            <Button
                                size='lg'
                                onClick={handleGotIt}
                                data-testid='dt_chart_intro_got_it_button'
                                className='chart-intro-guide__button chart-intro-guide__button'
                            >
                                <Text size='lg' weight='bold' className='chart-intro-guide__button-text'>
                                    <Localize i18n_default_text='Got it' />
                                </Text>
                            </Button>
                        ) : (
                            <Button
                                size='lg'
                                onClick={handleNext}
                                className='chart-intro-guide__button'
                                data-testid='dt_chart_intro_next_button'
                            >
                                <Text size='lg' weight='bold' className='chart-intro-guide__button-text'>
                                    <Localize i18n_default_text='Next' />
                                </Text>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    ) : (
        <>
            <button
                className='chart-intro-guide__close-button'
                onClick={handleClose}
                data-testid='dt_chart_intro_close_button'
                aria-label='Close'
            >
                <LabelPairedXmarkMdRegularIcon fill='#FFFFFF' />
            </button>

            <ProgressBars
                current_step={current_step}
                total_steps={CHART_INTRO_STEPS.length}
                video_progress={video_progress}
                is_mobile={is_mobile}
            />

            <div className='chart-intro-guide__content'>
                <Text as='h4' weight='bold' className='chart-intro-guide__title'>
                    {current_step_data.title}
                </Text>

                <Text size='md' className='chart-intro-guide__description'>
                    {current_step_data.description}
                </Text>

                <ChartIntroVideo video_id={current_step_data.video_id} is_mobile={is_mobile} />
            </div>

            <div className='chart-intro-guide__navigation'>
                <div>
                    {current_step > 1 && (
                        <Button
                            size='lg'
                            variant='secondary'
                            onClick={handleBack}
                            data-testid='dt_chart_intro_back_button'
                            color='white-black'
                            className='chart-intro-guide__button chart-intro-guide__button--back'
                        >
                            <Text size='lg' weight='bold' className='chart-intro-guide__button-text'>
                                <Localize i18n_default_text='Back' />
                            </Text>
                        </Button>
                    )}
                </div>
                <div>
                    {is_final_step ? (
                        <Button
                            size='lg'
                            onClick={handleGotIt}
                            className='chart-intro-guide__button'
                            data-testid='dt_chart_intro_got_it_button'
                        >
                            <Text size='lg' weight='bold' className='chart-intro-guide__button-text'>
                                <Localize i18n_default_text='Got it' />
                            </Text>
                        </Button>
                    ) : (
                        <Button
                            size='lg'
                            onClick={handleNext}
                            className='chart-intro-guide__button'
                            data-testid='dt_chart_intro_next_button'
                        >
                            <Text size='lg' weight='bold' className='chart-intro-guide__button-text'>
                                <Localize i18n_default_text='Next' />
                            </Text>
                        </Button>
                    )}
                </div>
            </div>
        </>
    );

    return ReactDOM.createPortal(
        <div className={modal_class} data-testid='dt_chart_intro_guide'>
            {is_mobile && <div className='chart-intro-guide__overlay' onClick={handleClose} />}
            {!is_mobile && <div className='chart-intro-guide__overlay' />}
            <div className={is_mobile ? 'chart-intro-guide__content' : 'chart-intro-guide__modal'}>{content}</div>
        </div>,
        document.body
    );
};

export default React.memo(ChartIntroGuide);
