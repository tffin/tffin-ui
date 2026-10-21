import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { MealStoreService, getTodayString, DayMealSlot, SlotHouseholdPlan } from '../../core/services/meal-store.service';
import { Dish } from '../../core/models/dish.model';
import { MealSchedule, MealType } from '../../core/models/meal-schedule.model';
import { Household } from '../../core/models/household.model';
import { MealAssignDialogComponent } from '../dashboard/components/meal-assign-dialog.component';

export interface DayColumn {
  dateStr: string;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
  meals: DayMealSlot[];
  totalDayHeadcount: number;
}

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [
    CommonModule,
    HlmButton,
    HlmBadge,
    HlmCardImports,
    HlmSelectImports
  ],
  templateUrl: './planner.html',
  styleUrl: './planner.scss'
})
export class PlannerComponent {
  public store = inject(MealStoreService);
  private dialogService = inject(HlmDialogService);

  public weekOffset = signal<number>(0);

  public dishes = this.store.dishes;
  public activeHouseholds = this.store.activeHouseholds;
  public selectedHouseholdId = this.store.selectedHouseholdId;

  public weekDays = computed<DayColumn[]>(() => {
    const offset = this.weekOffset() * 7;
    const days: DayColumn[] = [];
    const today = getTodayString();

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + offset + i);
      const dateStr = d.toISOString().split('T')[0];

      const dayMeals = this.store.getMealsForDate(dateStr);
      const totalHeadcount = dayMeals.reduce((acc, m) => acc + (m.totalHeadcount || 0), 0);

      days.push({
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday: dateStr === today,
        meals: dayMeals,
        totalDayHeadcount: totalHeadcount
      });
    }

    return days;
  });

  public prevWeek(): void {
    this.weekOffset.update(w => w - 1);
  }

  public nextWeek(): void {
    this.weekOffset.update(w => w + 1);
  }

  public resetToToday(): void {
    this.weekOffset.set(0);
  }

  public setPlannerHousehold(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.store.setSelectedHousehold(val ? val : null);
  }

  public setPlannerHouseholdValue(householdId: string | null | undefined): void {
    this.store.setSelectedHousehold(householdId ? householdId : null);
  }

  public openSlotModal(
    dateStr: string,
    mealType: MealType,
    currentDishId?: string,
    currentHeadcount?: number,
    currentHouseholdId?: string
  ): void {
    const targetHhId = this.store.resolveTargetHouseholdId(currentHouseholdId);
    const hh = this.store.householdsMap().get(targetHhId);

    this.dialogService.open(MealAssignDialogComponent, {
      context: {
        dateStr,
        mealType,
        householdId: targetHhId,
        dishId: currentDishId || (this.dishes()[0]?.id || ''),
        headcount: currentHeadcount !== undefined ? currentHeadcount : (hh?.default_headcount || 3)
      },
      contentClass: 'sm:max-w-md bg-card border border-border text-card-foreground shadow-2xl rounded-2xl p-6'
    });
  }

  public async adjustSlotHeadcount(
    dateStr: string,
    mealType: MealType,
    delta: number,
    householdId: string,
    event: MouseEvent
  ): Promise<void> {
    event.stopPropagation();
    await this.store.adjustHeadcount(dateStr, mealType, delta, householdId);
  }
}
