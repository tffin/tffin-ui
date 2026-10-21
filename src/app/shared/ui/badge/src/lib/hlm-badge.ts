import { Directive, input } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { type VariantProps, cva } from 'class-variance-authority';

const badgeVariants = cva(
	'min-h-5.5 gap-1.5 rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium leading-none transition-all has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 group/badge focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap focus-visible:ring-[3px] [&>ng-icon]:pointer-events-none [&>ng-icon]:shrink-0',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
				secondary: 'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
				destructive: 'bg-destructive/15 text-destructive dark:bg-destructive/25 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
				outline: 'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
				ghost: 'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
				link: 'text-primary underline-offset-4 hover:underline',
				amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
				emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
				rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
				sky: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
				purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
				muted: 'bg-muted/60 text-muted-foreground border-border',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

@Directive({
	selector: '[hlmBadge],hlm-badge',
	exportAs: 'hlmBadge',
	host: {
		'data-slot': 'badge',
		'[attr.data-variant]': 'variant()',
	},
})
export class HlmBadge {
	public readonly variant = input<BadgeVariants['variant']>('default');

	constructor() {
		classes(() => badgeVariants({ variant: this.variant() }));
	}
}
