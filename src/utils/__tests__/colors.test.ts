import {
    describe,
    expect,
    it
} from 'vitest';

import { getHeatGaugeColor } from '../colors';

describe('getHeatGaugeColor', () => {
    describe('Standard models (200k context)', () => {
        it('should return cool cyan for low usage (< 30%)', () => {
            const color = getHeatGaugeColor(10, false);
            expect(color).toBe('hex:00D9FF'); // Cyan - cool
        });

        it('should return green for comfortable range (30-40%)', () => {
            const color = getHeatGaugeColor(35, false);
            expect(color).toBe('hex:4ADE80'); // Green - comfortable
        });

        it('should return yellow at pretty hot threshold (40%)', () => {
            const color = getHeatGaugeColor(40, false);
            expect(color).toBe('hex:FDE047'); // Yellow - pretty hot
        });

        it('should return yellow in pretty hot range (40-55%)', () => {
            const color = getHeatGaugeColor(50, false);
            expect(color).toBe('hex:FDE047'); // Yellow - pretty hot
        });

        it('should return orange at very hot threshold (55%)', () => {
            const color = getHeatGaugeColor(55, false);
            expect(color).toBe('hex:FB923C'); // Orange - very hot
        });

        it('should return orange in very hot range (55-70%)', () => {
            const color = getHeatGaugeColor(65, false);
            expect(color).toBe('hex:FB923C'); // Orange - very hot
        });

        it('should return red for high usage (70%+)', () => {
            const color = getHeatGaugeColor(70, false);
            expect(color).toBe('hex:F87171'); // Red - critical
        });
    });

    describe('[1m] models (1M context)', () => {
        it('should return cool cyan for low usage (< 8%)', () => {
            const color = getHeatGaugeColor(5, true);
            expect(color).toBe('hex:00D9FF'); // Cyan - cool
        });

        it('should return green for comfortable range (8-10%)', () => {
            const color = getHeatGaugeColor(9, true);
            expect(color).toBe('hex:4ADE80'); // Green - comfortable
        });

        it('should return yellow at pretty hot threshold (10%)', () => {
            const color = getHeatGaugeColor(10, true);
            expect(color).toBe('hex:FDE047'); // Yellow - pretty hot
        });

        it('should return yellow in pretty hot range (10-15%)', () => {
            const color = getHeatGaugeColor(12, true);
            expect(color).toBe('hex:FDE047'); // Yellow - pretty hot
        });

        it('should return orange at very hot threshold (15%)', () => {
            const color = getHeatGaugeColor(15, true);
            expect(color).toBe('hex:FB923C'); // Orange - very hot
        });

        it('should return orange in very hot range (15-20%)', () => {
            const color = getHeatGaugeColor(18, true);
            expect(color).toBe('hex:FB923C'); // Orange - very hot
        });

        it('should return red for high usage (20%+)', () => {
            const color = getHeatGaugeColor(20, true);
            expect(color).toBe('hex:F87171'); // Red - critical
        });
    });

    describe('Backward compatibility', () => {
        it('should use standard model thresholds when is1MModel is undefined', () => {
            const color = getHeatGaugeColor(40);
            expect(color).toBe('hex:FDE047'); // Should use standard model thresholds
        });
    });

    describe('Custom thresholds', () => {
        it('should use custom thresholds when provided', () => {
            // With custom cool=20, 25% should be green (above cool)
            // Default would return cyan (25 < default cool=30)
            const color = getHeatGaugeColor(25, false, { cool: 20, warm: 35, hot: 50, veryHot: 65 });
            expect(color).toBe('hex:4ADE80'); // Green
        });

        it('should fall back to defaults when no custom thresholds provided', () => {
            // 25% on standard model = cyan with defaults (< 30%)
            const color = getHeatGaugeColor(25, false);
            expect(color).toBe('hex:00D9FF'); // Cyan
        });

        it('should apply custom hot threshold correctly', () => {
            const color = getHeatGaugeColor(45, false, { cool: 20, warm: 35, hot: 50, veryHot: 65 });
            expect(color).toBe('hex:FDE047'); // Yellow — 45 is between warm=35 and hot=50
        });

        it('should apply custom veryHot threshold correctly', () => {
            const color = getHeatGaugeColor(60, false, { cool: 20, warm: 35, hot: 50, veryHot: 65 });
            expect(color).toBe('hex:FB923C'); // Orange — 60 is between hot=50 and veryHot=65
        });

        it('should apply custom critical threshold correctly', () => {
            const color = getHeatGaugeColor(70, false, { cool: 20, warm: 35, hot: 50, veryHot: 65 });
            expect(color).toBe('hex:F87171'); // Red — 70 >= veryHot=65
        });
    });
});