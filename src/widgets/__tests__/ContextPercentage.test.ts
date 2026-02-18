import chalk from 'chalk';
import {
    beforeAll,
    describe,
    expect,
    it
} from 'vitest';

import type {
    RenderContext,
    WidgetItem
} from '../../types';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import { ContextPercentageWidget } from '../ContextPercentage';

// Force enable colors in test environment to verify color application
beforeAll(() => {
    chalk.level = 3; // Enable truecolor support
});

// Helper to strip ANSI color codes for testing
function stripAnsi(str: string): string {
    // Match all ANSI escape sequences including truecolor (38;2;R;G;B)
    return str.replace(/\u001b\[[^m]*m/g, '');
}

function render(modelId: string | undefined, contextLength: number, rawValue = false, inverse = false) {
    const widget = new ContextPercentageWidget();
    const context: RenderContext = {
        data: modelId ? { model: { id: modelId } } : undefined,
        tokenMetrics: {
            inputTokens: 0,
            outputTokens: 0,
            cachedTokens: 0,
            totalTokens: 0,
            contextLength
        }
    };
    const item: WidgetItem = {
        id: 'context-percentage',
        type: 'context-percentage',
        rawValue,
        metadata: inverse ? { inverse: 'true' } : undefined
    };

    return widget.render(item, context, DEFAULT_SETTINGS);
}

describe('ContextPercentageWidget', () => {
    describe('Heat gauge colors', () => {
        it('should apply colors to low percentage values', () => {
            // 5% usage - should have cyan color (ANSI codes present)
            const result = render('claude-3-5-sonnet-20241022', 10000);
            expect(result).toContain('5.0%');
            // Verify ANSI escape codes are present (colors applied)
            expect(result).toMatch(/\x1b\[/); // ANSI escape sequence present
        });

        it('should apply colors to high percentage values', () => {
            // 90% usage - should have red color (ANSI codes present)
            const result = render('claude-3-5-sonnet-20241022', 180000);
            expect(result).toContain('90.0%');
            // Verify ANSI escape codes are present (colors applied)
            expect(result).toMatch(/\x1b\[/); // ANSI escape sequence present
        });

        it('should apply different colors for low vs high percentages', () => {
            const lowResult = render('claude-3-5-sonnet-20241022', 10000); // 5%
            const highResult = render('claude-3-5-sonnet-20241022', 180000); // 90%
            // The ANSI color codes should be different
            expect(highResult).not.toBeNull();
            expect(lowResult).not.toBe(highResult?.replace('90.0%', '5.0%'));
        });

        it('should apply colors in raw value mode', () => {
            const result = render('claude-3-5-sonnet-20241022', 10000, true);
            expect(result).toContain('5.0%');
            expect(result).not.toContain('Ctx:');
            // Verify ANSI escape codes are present
            expect(result).toMatch(/\x1b\[/);
        });
    });

    describe('Heat gauge colors in inverse mode', () => {
        it('should apply cool color when showing low remaining percentage', () => {
            // 90% used = 10% remaining (should show cool cyan color)
            const result = render('claude-3-5-sonnet-20241022', 180000, false, true);
            expect(result).toContain('10.0%'); // Shows remaining
            // Verify colors are applied
            expect(result).toMatch(/\x1b\[/);
        });

        it('should apply hot color when showing high remaining percentage', () => {
            // 10% used = 90% remaining (should show hot red color)
            const result = render('claude-3-5-sonnet-20241022', 20000, false, true);
            expect(result).toContain('90.0%'); // Shows remaining
            // Verify colors are applied
            expect(result).toMatch(/\x1b\[/);
        });

        it('should color based on displayed percentage not usage', () => {
            // Same usage level should produce different colors in normal vs inverse mode
            const normalResult = render('claude-3-5-sonnet-20241022', 180000, false, false); // 90% used
            const inverseResult = render('claude-3-5-sonnet-20241022', 180000, false, true); // 10% remaining
            // The color codes should differ because displayed percentages differ (90% vs 10%)
            expect(normalResult).not.toBe(inverseResult);
        });
    });

    describe('Model-aware heat gauge colors', () => {
        it('should use [1m] model thresholds for Sonnet 4.5 with [1m] suffix', () => {
            // 10% usage on [1m] model should trigger "pretty hot" color (yellow)
            const result = render('claude-sonnet-4-5-20250929[1m]', 100000); // 10% of 1M
            expect(result).toContain('10.0%');
            // Verify yellow color code is present (FDE047 = rgb(253, 224, 71))
            expect(result).toMatch(/\x1b\[38;2;253;224;71m/); // RGB for FDE047
        });

        it('should use standard model thresholds for older models', () => {
            // 10% usage on standard model should still be cool (cyan)
            const result = render('claude-3-5-sonnet-20241022', 20000); // 10% of 200k
            expect(result).toContain('10.0%');
            // Verify cyan color code is present (00D9FF = rgb(0, 217, 255))
            expect(result).toMatch(/\x1b\[38;2;0;217;255m/); // RGB for 00D9FF
        });

        it('should differentiate pretty hot thresholds between model types', () => {
            // 40% on standard model = yellow (pretty hot)
            const standardResult = render('claude-3-5-sonnet-20241022', 80000); // 40% of 200k
            expect(standardResult).not.toBeNull();
            expect(stripAnsi(standardResult!)).toContain('40.0%');

            // 40% on [1m] model = red (critical)
            const model1MResult = render('claude-sonnet-4-5-20250929[1m]', 400000); // 40% of 1M
            expect(model1MResult).not.toBeNull();
            expect(stripAnsi(model1MResult!)).toContain('40.0%');

            // Colors should be very different
            expect(standardResult).not.toBe(model1MResult);
        });

        it('should handle inverse mode with model-aware colors', () => {
            // [1m] model: 85% used = 15% remaining (should be warm/hot threshold)
            const result = render('claude-sonnet-4-5-20250929[1m]', 850000, false, true);
            expect(result).toContain('15.0%');
            // Should show orange color (15% threshold for [1m] models)
            expect(result).toMatch(/\x1b\[38;2;251;146;60m/); // RGB for FB923C
        });
    });

    describe('Sonnet 4.5 with 1M context window', () => {
        it('should calculate percentage using 1M denominator for Sonnet 4.5 with [1m] suffix', () => {
            const result = render('claude-sonnet-4-5-20250929[1m]', 42000);
            // Strip ANSI codes to check the percentage value
            expect(result).not.toBeNull();
            expect(stripAnsi(result!)).toBe('Ctx: 4.2%');
        });

        it('should calculate percentage using 1M denominator for Sonnet 4.5 (raw value) with [1m] suffix', () => {
            const result = render('claude-sonnet-4-5-20250929[1m]', 42000, true);
            // Strip ANSI codes to check the percentage value
            expect(result).not.toBeNull();
            expect(stripAnsi(result!)).toBe('4.2%');
        });
    });

    describe('with context_window data (Claude Code v2.0.65+)', () => {
        it('should use context_window data when available', () => {
            const widget = new ContextPercentageWidget();
            const item: WidgetItem = { id: '1', type: 'context-percentage' };
            const context: RenderContext = {
                data: { model: { id: 'claude-sonnet-4-6' } },
                tokenMetrics: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0, contextLength: 50000 },
                contextWindow: { totalInputTokens: 100000, contextWindowSize: 200000 }
            };
            const result = widget.render(item, context, DEFAULT_SETTINGS);
            expect(stripAnsi(result!)).toBe('Ctx: 50.0%'); // 100000/200000
        });

        it('should use context_window_size as denominator even with [1m] model', () => {
            const widget = new ContextPercentageWidget();
            const item: WidgetItem = { id: '1', type: 'context-percentage' };
            const context: RenderContext = {
                data: { model: { id: 'claude-sonnet-4-6[1m]' } },
                tokenMetrics: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0, contextLength: 100000 },
                contextWindow: { totalInputTokens: 100000, contextWindowSize: 1000000 }
            };
            const result = widget.render(item, context, DEFAULT_SETTINGS);
            expect(stripAnsi(result!)).toBe('Ctx: 10.0%'); // 100000/1000000
        });

        it('should fall back to tokenMetrics when context_window is absent', () => {
            const widget = new ContextPercentageWidget();
            const item: WidgetItem = { id: '1', type: 'context-percentage' };
            const context: RenderContext = {
                data: { model: { id: 'claude-sonnet-4-6' } },
                tokenMetrics: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0, contextLength: 50000 }
            };
            const result = widget.render(item, context, DEFAULT_SETTINGS);
            expect(stripAnsi(result!)).toBe('Ctx: 25.0%'); // 50000/200000
        });
    });

    describe('Older models with 200k context window', () => {
        it('should calculate percentage using 200k denominator for older Sonnet 3.5', () => {
            const result = render('claude-3-5-sonnet-20241022', 42000);
            // Strip ANSI codes to check the percentage value
            expect(result).not.toBeNull();
            expect(stripAnsi(result!)).toBe('Ctx: 21.0%');
        });

        it('should calculate percentage using 200k denominator when model ID is undefined', () => {
            const result = render(undefined, 42000);
            // Strip ANSI codes to check the percentage value
            expect(result).not.toBeNull();
            expect(stripAnsi(result!)).toBe('Ctx: 21.0%');
        });

        it('should calculate percentage using 200k denominator for unknown model', () => {
            const result = render('claude-unknown-model', 42000);
            // Strip ANSI codes to check the percentage value
            expect(result).not.toBeNull();
            expect(stripAnsi(result!)).toBe('Ctx: 21.0%');
        });
    });
});