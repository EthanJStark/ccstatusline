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
});