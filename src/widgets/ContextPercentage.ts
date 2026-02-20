import chalk from 'chalk';

import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    getChalkColor,
    getHeatGaugeColor
} from '../utils/colors';
import { calculateContextPercentage } from '../utils/context-percentage';
import { getContextConfig } from '../utils/model-context';

export class ContextPercentageWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return 'Shows percentage of context window used or remaining'; }
    getDisplayName(): string { return 'Context %'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const isInverse = item.metadata?.inverse === 'true';
        const modifiers: string[] = [];

        if (isInverse) {
            modifiers.push('remaining');
        }

        return {
            displayText: this.getDisplayName(),
            modifierText: modifiers.length > 0 ? `(${modifiers.join(', ')})` : undefined
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action === 'toggle-inverse') {
            const currentState = item.metadata?.inverse === 'true';
            return {
                ...item,
                metadata: {
                    ...item.metadata,
                    inverse: (!currentState).toString()
                }
            };
        }
        return null;
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const isInverse = item.metadata?.inverse === 'true';

        if (context.isPreview) {
            const previewValue = isInverse ? '90.7%' : '9.3%';
            const previewPercentage = isInverse ? 90.7 : 9.3;
            // For preview, assume standard model (most common case)
            const heatColor = getHeatGaugeColor(previewPercentage, false, settings.heatGaugeThresholds?.standard);
            const chalkColor = getChalkColor(heatColor, 'truecolor');
            const coloredValue = chalkColor ? chalkColor(previewValue) : previewValue;
            return item.rawValue ? coloredValue : `Ctx: ${coloredValue}`;
        }

        if (!context.contextWindow && !context.tokenMetrics) {
            return null;
        }

        const usedPercentage = calculateContextPercentage(context);
        const displayPercentage = isInverse ? (100 - usedPercentage) : usedPercentage;
        const percentageString = `${displayPercentage.toFixed(1)}%`;

        // Determine if this is a [1m] model for heat gauge thresholds
        let is1MModel: boolean;
        if (context.contextWindow) {
            is1MModel = context.contextWindow.contextWindowSize >= 1000000;
        } else {
            const model = context.data?.model;
            const modelId = typeof model === 'string' ? model : model?.id;
            is1MModel = getContextConfig(modelId).maxTokens === 1000000;
        }

        // Apply heat gauge color based on displayed percentage and model type
        // Heat gauge colors override widget-level colors to ensure
        // consistent visual feedback for context usage levels
        const customThresholds = is1MModel
            ? settings.heatGaugeThresholds?.extended
            : settings.heatGaugeThresholds?.standard;
        const heatColor = getHeatGaugeColor(displayPercentage, is1MModel, customThresholds);
        const chalkColor = getChalkColor(heatColor, 'truecolor');
        const coloredPercentage = chalkColor ? chalkColor(percentageString) : percentageString;

        return item.rawValue ? coloredPercentage : `Ctx: ${coloredPercentage}`;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'l', label: '(l)eft/remaining', action: 'toggle-inverse' }
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
