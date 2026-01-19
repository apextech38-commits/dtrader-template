/**
 * Trade Parameter Presets Configuration
 *
 * This file contains centralized preset values for trade parameters used in value chips.
 * These presets provide quick-select options for users when configuring trades.
 *
 * @module TradeParameterPresets
 */

/**
 * Duration preset values for different time units
 */
export interface DurationPresets {
    /** Preset values for tick-based durations */
    ticks: number[];
    /** Preset values for second-based durations */
    seconds: number[];
    /** Preset values for minute-based durations */
    minutes: number[];
    /** Preset values for hour-based durations (displayed in hours but stored as minutes) */
    hours: number[];
    /** Preset time values for end time selection (HH:MM format) */
    endTime: string[];
    /** Preset values for end date selection (days from now) */
    endDate: number[];
}

/**
 * Stake preset values for different trade types
 */
export interface StakePresets {
    /**
     * Standard stake presets for most trade types
     * Used for: Rise/Fall, Higher/Lower, Touch/No Touch, Matches/Differs,
     * Accumulators, Vanillas, Turbos, Even/Odd, Over/Under
     */
    standard: number[];
    /**
     * High-range stake presets for Multipliers
     * Used for: Multipliers (which has a higher maximum stake)
     */
    multipliers: number[];
}

/**
 * Configuration for which duration units should have presets disabled
 * When a unit is in this list, only the manual input will be shown (no chips, no tab selector)
 */
export interface DurationPresetsConfig {
    /** Array of duration unit codes that should have presets disabled (e.g., ['t', 's']) */
    disabledPresets: string[];
}

/**
 * Complete trade parameter presets configuration
 */
export interface TradeParameterPresets {
    /** Duration-related presets */
    duration: DurationPresets;
    /** Stake-related presets */
    stake: StakePresets;
    /** Configuration for duration presets behavior */
    durationConfig: DurationPresetsConfig;
}

/**
 * Centralized configuration for all trade parameter preset values.
 *
 * Usage:
 * ```typescript
 * import { TRADE_PARAMETER_PRESETS } from 'AppV2/Config/trade-parameter-presets';
 *
 * // Access duration presets
 * const tickValues = TRADE_PARAMETER_PRESETS.duration.ticks;
 *
 * // Access stake presets
 * const desktopStakes = TRADE_PARAMETER_PRESETS.stake.desktop;
 * ```
 */
export const TRADE_PARAMETER_PRESETS: TradeParameterPresets = {
    duration: {
        // Ticks: For hyper-active traders (Range: 1-10 ticks)
        // Key anchors: 1 (instant), 5 (first anchor), 10 (maximum/second anchor)
        ticks: [1, 2, 3, 4, 5, 6, 8, 10],

        // Seconds: For high-frequency traders (Range: 15-60s)
        // Key anchors: 15 (minimum), 30 (half-minute), 45 (three-quarters), 59 (one-minute/maximum)
        seconds: [15, 20, 25, 30, 35, 40, 45, 59],

        // Minutes: For short-term intraday traders (Range: 1-59m)
        // Key anchors: 1 (quintessential short-term), 5 (fundamental unit), 15 (major charting), 30 (half-hour)
        minutes: [1, 2, 3, 5, 10, 15, 30, 45],

        // Hours: For longer-term position traders (Range: 1-24h)
        // Key anchors: 1 (minimum/H1 chart), 4 (H4 chart), 8 (full session), 12 (half-day), 24 (full day/maximum)
        hours: [1, 2, 3, 4, 6, 8, 12, 24],

        endTime: ['07:30', '07:35', '07:40', '07:45', '07:50', '07:55'],
        endDate: [1, 2, 3, 5, 7, 10], // Days from now
    },
    stake: {
        // Standard stake presets (6 options)
        // For: Rise/Fall, Higher/Lower, Touch/No Touch, Matches/Differs, Accumulators, Vanillas, Turbos, Even/Odd, Over/Under
        // Key levels: $1 (universal starting point), $10 (most common beginner), $25 (standard), $50 (confident), $100 (serious retail)
        standard: [1, 5, 10, 25, 50, 100],

        // High-range stake presets for Multipliers (6 options)
        // For: Multipliers (higher maximum stake)
        // Key levels: $1 (minimum/accessibility), $10 (standard entry), $50 (mid-range), $100 (confident), $250 (high-conviction)
        multipliers: [1, 10, 25, 50, 100, 250],
    },
    durationConfig: {
        // Disable presets for End time and End date as they are not finalized yet
        // When disabled, only the manual input will be shown (no chips, no tab selector)
        disabledPresets: ['end_time', 'end_date'],
    },
};
