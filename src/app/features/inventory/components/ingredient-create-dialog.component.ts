import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { MealStoreService } from '../../../core/services/meal-store.service';
import { IngredientCategory, MeasurementUnit } from '../../../core/models/ingredient.model';

@Component({
  selector: 'app-ingredient-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmDialogImports,
    HlmSelectImports
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>Add New Master Ingredient</h3>
      <p hlmDialogDescription>Register an ingredient into the central pantry catalog with reorder thresholds.</p>
    </hlm-dialog-header>

    <div class="space-y-4 py-3">
      <div class="space-y-1.5">
        <label hlmLabel>Ingredient Name *</label>
        <input 
          hlmInput 
          type="text" 
          [value]="newName()" 
          (input)="newName.set($any($event.target).value)" 
          placeholder="e.g. Kashmiri Chilli Powder, Butter" 
          class="w-full" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label hlmLabel>Category</label>
          <hlm-select [value]="newCategory()" (valueChange)="onCategoryChange($event)">
            <hlm-select-trigger class="w-full h-9 bg-input border-border">
              <hlm-select-value placeholder="Select category..." />
            </hlm-select-trigger>
            <hlm-select-content class="bg-popover border-border">
              <hlm-select-item value="produce">Produce (Vegetables, Greens)</hlm-select-item>
              <hlm-select-item value="dairy">Dairy (Milk, Paneer, Curd)</hlm-select-item>
              <hlm-select-item value="spices">Spices & Condiments</hlm-select-item>
              <hlm-select-item value="staples">Staples (Rice, Dal, Flour, Oil)</hlm-select-item>
            </hlm-select-content>
          </hlm-select>
        </div>

        <div class="space-y-1.5">
          <label hlmLabel>Standard Unit</label>
          <hlm-select [value]="newUnit()" (valueChange)="onUnitChange($event)">
            <hlm-select-trigger class="w-full h-9 bg-input border-border">
              <hlm-select-value placeholder="Select unit..." />
            </hlm-select-trigger>
            <hlm-select-content class="bg-popover border-border">
              <hlm-select-item value="g">Grams (g)</hlm-select-item>
              <hlm-select-item value="kg">Kilograms (kg)</hlm-select-item>
              <hlm-select-item value="ml">Milliliters (ml)</hlm-select-item>
              <hlm-select-item value="pcs">Pieces (pcs)</hlm-select-item>
            </hlm-select-content>
          </hlm-select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label hlmLabel>Initial Stock Quantity</label>
          <input 
            hlmInput 
            type="number" 
            [value]="newInitialStock()" 
            (input)="newInitialStock.set(+$any($event.target).value)" 
            min="0" 
            class="w-full" />
        </div>

        <div class="space-y-1.5">
          <label hlmLabel>Low Stock Threshold</label>
          <input 
            hlmInput 
            type="number" 
            [value]="newMinThreshold()" 
            (input)="newMinThreshold.set(+$any($event.target).value)" 
            min="0" 
            class="w-full" />
        </div>
      </div>
    </div>

    <hlm-dialog-footer class="mt-4 pt-3 border-t border-border">
      <button hlmBtn variant="secondary" (click)="close()">Cancel</button>
      <button hlmBtn (click)="saveNewIngredient()" [disabled]="!newName().trim()">
        Save Ingredient
      </button>
    </hlm-dialog-footer>
  `
})
export class IngredientCreateDialogComponent {
  public store = inject(MealStoreService);
  protected readonly dialogRef = inject(BrnDialogRef);

  public newName = signal<string>('');
  public newCategory = signal<IngredientCategory>('produce');
  public newUnit = signal<MeasurementUnit>('g');
  public newInitialStock = signal<number>(500);
  public newMinThreshold = signal<number>(250);

  public onCategoryChange(cat: string | null | undefined): void {
    if (cat) {
      this.newCategory.set(cat as IngredientCategory);
    }
  }

  public onUnitChange(unit: string | null | undefined): void {
    if (unit) {
      this.newUnit.set(unit as MeasurementUnit);
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  public async saveNewIngredient(): Promise<void> {
    const name = this.newName().trim();
    if (!name) return;

    await this.store.createIngredient(
      name,
      this.newCategory(),
      this.newUnit(),
      this.newInitialStock(),
      this.newMinThreshold()
    );
    this.dialogRef.close(true);
  }
}
