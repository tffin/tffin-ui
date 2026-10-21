import { Directive, input } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { HlmCardConfig, injectHlmCardConfig } from './hlm-card.token';

@Directive({
	selector: '[hlmCard],hlm-card',
	exportAs: 'hlmCard',
	host: {
		'data-slot': 'card',
		'[attr.data-size]': 'size()',
	},
})
export class HlmCard {
	private readonly _defaultConfig = injectHlmCardConfig();
	public readonly size = input<HlmCardConfig['size']>(this._defaultConfig.size);

	constructor() {
		classes(() => 'bg-card text-card-foreground rounded-xl border border-border shadow-sm transition-colors');
	}
}
