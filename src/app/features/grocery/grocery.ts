import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCheckCircle2 } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { MealStoreService } from '../../core/services/meal-store.service';
import { ShortageReportItem } from '../../core/models/meal-schedule.model';

@Component({
  selector: 'app-grocery',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    HlmButton,
    HlmBadge,
    HlmCardImports,
    HlmTableImports,
    HlmCheckbox,
    HlmSelectImports
  ],
  providers: [
    provideIcons({
      lucideCheck,
      lucideCheckCircle2
    })
  ],
  templateUrl: './grocery.html',
  styleUrl: './grocery.scss'
})
export class GroceryComponent {
  public store = inject(MealStoreService);

  public daysHorizon = signal<number>(4);
  public selectedHouseholdFilter = signal<string>('');
  public checkedItems = signal<Set<string>>(new Set());

  public activeHouseholds = this.store.activeHouseholds;

  public shortages = computed<ShortageReportItem[]>(() => {
    // Re-evaluates whenever schedule, dishes, or inventory change!
    const _schedules = this.store.schedules();
    const _inventory = this.store.inventory();
    const _dishes = this.store.dishes();
    const hhId = this.selectedHouseholdFilter() || null;
    return this.store.calculateShortages(this.daysHorizon(), hhId);
  });

  public setHorizon(days: number): void {
    this.daysHorizon.set(days);
    this.checkedItems.set(new Set());
  }

  public readonly householdItemToString = (id: unknown): string => {
    if (!id || typeof id !== 'string') return 'All Authorized (Combined Kitchen)';
    const hh = this.activeHouseholds().find(h => h.id === id);
    return hh ? `${hh.name} (${hh.default_headcount}p)` : 'All Authorized (Combined Kitchen)';
  };

  public setHouseholdFilter(val: string | null | undefined): void {
    this.selectedHouseholdFilter.set(val || '');
    this.checkedItems.set(new Set());
  }

  public toggleChecked(id: string): void {
    const next = new Set(this.checkedItems());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.checkedItems.set(next);
  }

  public isChecked(id: string): boolean {
    return this.checkedItems().has(id);
  }

  public async restockItem(item: ShortageReportItem): Promise<void> {
    // Add deficit + 20% cushion to inventory
    const cushion = Math.ceil(item.deficit * 1.2);
    await this.store.adjustInventoryDelta(item.ingredientId, cushion);
    this.store.showNotification(`Restocked ${cushion}${item.unit} of ${item.ingredientName}`, 'success');
  }

  public async restockAll(): Promise<void> {
    const list = this.shortages();
    if (list.length === 0) return;
    await this.store.quickRestockAll(list);
  }
}
