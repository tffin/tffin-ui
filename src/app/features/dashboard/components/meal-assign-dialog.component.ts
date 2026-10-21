import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { MealStoreService, getTodayString } from '../../../core/services/meal-store.service';
import { MealType } from '../../../core/models/meal-schedule.model';

export interface MealAssignDialogData {
  mealType: MealType;
  householdId: string;
  dishId: string;
  headcount: number;
  dateStr?: string;
}

@Component({
  selector: 'app-meal-assign-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmAlertImports,
    HlmDialogImports,
    HlmSelectImports
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>Assign Meal: {{ data.mealType | titlecase }}{{ dateLabel() ? ' • ' + dateLabel() : '' }}</h3>
      <p hlmDialogDescription>Select household client and recipe for this schedule.</p>
    </hlm-dialog-header>

    @if (modalHousehold()?.dietary_notes) {
      <div hlmAlert variant="destructive" class="my-3 py-2">
        <p hlmAlertDescription>⚠️ Dietary Notes: {{ modalHousehold()?.dietary_notes }}</p>
      </div>
    }

    <div class="space-y-4 py-3">
      <div class="space-y-1.5">
        <label hlmLabel>Target Household / Client *</label>
        <hlm-select [value]="selectedHouseholdId()" (valueChange)="onHouseholdChange($event)">
          <hlm-select-trigger class="w-full">
            <hlm-select-value placeholder="Select household..." />
          </hlm-select-trigger>
          <hlm-select-content>
            @for (hh of activeHouseholds(); track hh.id) {
              <hlm-select-item [value]="hh.id">
                {{ hh.name }} ({{ hh.code || 'HH' }}) - {{ hh.default_headcount }} pers.
              </hlm-select-item>
            }
          </hlm-select-content>
        </hlm-select>
      </div>

      <div class="space-y-1.5">
        <label hlmLabel>Select Dish from Catalog *</label>
        <hlm-select [value]="selectedDishId()" (valueChange)="onDishChange($event)">
          <hlm-select-trigger class="w-full">
            <hlm-select-value placeholder="Select dish..." />
          </hlm-select-trigger>
          <hlm-select-content>
            @for (dish of dishes(); track dish.id) {
              <hlm-select-item [value]="dish.id">{{ dish.name }}</hlm-select-item>
            }
          </hlm-select-content>
        </hlm-select>
      </div>

      <div class="space-y-1.5">
        <label hlmLabel>Planned Headcount (Portions)</label>
        <input 
          hlmInput 
          type="number" 
          min="1" 
          [value]="modalHeadcount()" 
          (input)="modalHeadcount.set(+$any($event.target).value)" 
          class="w-full" />
      </div>
    </div>

    <hlm-dialog-footer class="mt-4">
      <button hlmBtn variant="secondary" (click)="close()">Cancel</button>
      <button hlmBtn (click)="saveAssignment()">Save to Schedule</button>
    </hlm-dialog-footer>
  `
})
export class MealAssignDialogComponent {
  public store = inject(MealStoreService);
  protected readonly dialogRef = inject(BrnDialogRef);
  public readonly data = injectBrnDialogContext<MealAssignDialogData>() ?? {
    mealType: 'lunch',
    householdId: '',
    dishId: '',
    headcount: 3
  };

  public selectedHouseholdId = signal<string>(this.data.householdId);
  public selectedDishId = signal<string>(this.data.dishId);
  public modalHeadcount = signal<number>(this.data.headcount);

  public activeHouseholds = this.store.activeHouseholds;
  public dishes = this.store.dishes;

  public modalHousehold = computed(() => {
    return this.store.householdsMap().get(this.selectedHouseholdId()) || null;
  });

  public dateLabel = computed(() => {
    if (!this.data.dateStr) return null;
    const parts = this.data.dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return this.data.dateStr;
  });

  public onHouseholdChange(householdId: string | null | undefined): void {
    if (!householdId) return;
    this.selectedHouseholdId.set(householdId);
    const hh = this.store.householdsMap().get(householdId);
    if (hh) {
      this.modalHeadcount.set(hh.default_headcount || 2);
    }
  }

  public onDishChange(dishId: string | null | undefined): void {
    if (dishId) {
      this.selectedDishId.set(dishId);
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  public async saveAssignment(): Promise<void> {
    if (!this.selectedDishId() || !this.selectedHouseholdId()) return;

    const targetDate = this.data.dateStr || getTodayString();
    await this.store.setMealSchedule(
      targetDate,
      this.data.mealType,
      this.selectedDishId(),
      this.modalHeadcount(),
      this.selectedHouseholdId()
    );
    this.dialogRef.close(true);
  }
}
