import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  lucideCalendar, 
  lucideShoppingBag, 
  lucideUsers, 
  lucideHome, 
  lucideCookingPot, 
  lucideAlertTriangle, 
  lucidePencil, 
  lucideFileText, 
  lucideCheckCircle2, 
  lucideAlertCircle 
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { MealStoreService, getTodayString } from '../../core/services/meal-store.service';
import { MealType } from '../../core/models/meal-schedule.model';
import { MealAssignDialogComponent } from './components/meal-assign-dialog.component';

export interface BatchPrepDish {
  dishId: string;
  dishName: string;
  totalPortions: number;
  householdNames: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgIcon,
    HlmButton,
    HlmBadge,
    HlmCardImports,
    HlmProgressImports,
    HlmSelectImports
  ],
  providers: [
    provideIcons({
      lucideCalendar,
      lucideShoppingBag,
      lucideUsers,
      lucideHome,
      lucideCookingPot,
      lucideAlertTriangle,
      lucidePencil,
      lucideFileText,
      lucideCheckCircle2,
      lucideAlertCircle
    })
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  public store = inject(MealStoreService);
  private dialogService = inject(HlmDialogService);

  public todayStr = signal<string>(getTodayString());

  // Computeds
  public todayMeals = this.store.todayMeals;
  public dishes = this.store.dishes;
  public lowStockItems = this.store.lowStockItems;
  public activeHouseholds = this.store.activeHouseholds;
  public currentHouseholdFilter = this.store.selectedHouseholdId;

  public todayTotalHeadcount = computed(() => {
    return this.todayMeals().reduce((sum, item) => sum + (item.totalHeadcount || 0), 0);
  });

  public householdsServedCount = computed(() => {
    const hhSet = new Set<string>();
    for (const m of this.todayMeals()) {
      for (const p of m.householdPlans) {
        hhSet.add(p.schedule.household_id);
      }
    }
    return hhSet.size;
  });

  public batchPrepSummary = computed<BatchPrepDish[]>(() => {
    const map = new Map<string, { dishName: string; portions: number; households: Set<string> }>();

    for (const m of this.todayMeals()) {
      for (const p of m.householdPlans) {
        if (p.dish) {
          const existing = map.get(p.dish.id);
          const hhName = p.household?.name || 'Household';
          if (existing) {
            existing.portions += p.schedule.headcount;
            existing.households.add(hhName);
          } else {
            map.set(p.dish.id, {
              dishName: p.dish.name,
              portions: p.schedule.headcount,
              households: new Set([hhName])
            });
          }
        }
      }
    }

    const result: BatchPrepDish[] = [];
    map.forEach((val, key) => {
      result.push({
        dishId: key,
        dishName: val.dishName,
        totalPortions: val.portions,
        householdNames: Array.from(val.households)
      });
    });

    return result.sort((a, b) => b.totalPortions - a.totalPortions);
  });

  public formattedToday = computed(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  });

  public getMealBadgeClass(type: MealType): string {
    switch (type) {
      case 'breakfast': return 'badge-amber';
      case 'lunch': return 'badge-emerald';
      case 'dinner': return 'badge-purple';
    }
  }

  public readonly householdItemToString = (id: unknown): string => {
    if (!id || typeof id !== 'string') return 'All Authorized (Overview)';
    const hh = this.activeHouseholds().find(h => h.id === id);
    return hh ? `${hh.name} (${hh.default_headcount}p)` : 'All Authorized (Overview)';
  };

  public setFilterValue(val: string | null | undefined): void {
    this.store.setSelectedHousehold(val ? val : null);
  }

  public openAssignModal(
    mealType: MealType, 
    currentDishId?: string, 
    currentHeadcount?: number,
    currentHouseholdId?: string
  ): void {
    const targetHhId = this.store.resolveTargetHouseholdId(currentHouseholdId);
    const hh = this.store.householdsMap().get(targetHhId);

    this.dialogService.open(MealAssignDialogComponent, {
      context: {
        mealType,
        householdId: targetHhId,
        dishId: currentDishId || (this.dishes()[0]?.id || ''),
        headcount: currentHeadcount !== undefined ? currentHeadcount : (hh?.default_headcount || 3)
      },
      contentClass: 'sm:max-w-md bg-card border border-border text-card-foreground shadow-2xl rounded-2xl p-6'
    });
  }

  public async incrementHeadcount(mealType: MealType, householdId: string): Promise<void> {
    await this.store.adjustHeadcount(this.todayStr(), mealType, 1, householdId);
  }

  public async decrementHeadcount(mealType: MealType, householdId: string): Promise<void> {
    await this.store.adjustHeadcount(this.todayStr(), mealType, -1, householdId);
  }

  public async quickRestock(ingredientId: string, amount: number): Promise<void> {
    await this.store.adjustInventoryDelta(ingredientId, amount);
  }
}
