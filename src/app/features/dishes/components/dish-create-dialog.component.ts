import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { MealStoreService } from '../../../core/services/meal-store.service';

interface RecipeIngredientRow {
  ingredient_id: string;
  qty_per_person: number;
}

@Component({
  selector: 'app-dish-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmTextarea,
    HlmDialogImports,
    HlmSelectImports
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>Create New Recipe / Dish</h3>
      <p hlmDialogDescription>Define recipe composition with base per-person ingredient quantities.</p>
    </hlm-dialog-header>

    <div class="space-y-4 py-3 max-h-[70vh] overflow-y-auto pr-1">
      <div class="space-y-1.5">
        <label hlmLabel>Dish Name *</label>
        <input 
          hlmInput 
          type="text" 
          [value]="newDishName()" 
          (input)="newDishName.set($any($event.target).value)" 
          placeholder="e.g. Palak Paneer, Rajma Masala" 
          class="w-full" />
      </div>

      <div class="space-y-1.5">
        <label hlmLabel>Cooking Notes & Preparation Instructions</label>
        <textarea 
          hlmTextarea 
          rows="3" 
          [value]="newCookNotes()" 
          (input)="newCookNotes.set($any($event.target).value)" 
          placeholder="Special instructions, marination details, or boiling steps..." 
          class="w-full"></textarea>
      </div>

      <div class="space-y-2 pt-2 border-t border-border">
        <div class="flex items-center justify-between">
          <label hlmLabel class="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Recipe Ingredients (Per-person base)
          </label>
          <button hlmBtn variant="secondary" size="xs" (click)="addIngredientRow()">
            + Add Ingredient
          </button>
        </div>

        <div class="space-y-2.5">
          @for (row of newIngredients(); track $index; let idx = $index) {
            <div class="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border">
              <div class="flex-1">
                <hlm-select [value]="row.ingredient_id" (valueChange)="onIngredientChange(idx, $event)">
                  <hlm-select-trigger class="w-full h-8 text-xs bg-input border-border">
                    <hlm-select-value placeholder="Select ingredient..." />
                  </hlm-select-trigger>
                  <hlm-select-content class="bg-popover border-border max-h-56">
                    @for (ing of masterIngredients(); track ing.id) {
                      <hlm-select-item [value]="ing.id">{{ ing.name }} ({{ ing.category }})</hlm-select-item>
                    }
                  </hlm-select-content>
                </hlm-select>
              </div>

              <div class="flex items-center gap-1.5 w-32 shrink-0">
                <input 
                  hlmInput 
                  type="number" 
                  [value]="row.qty_per_person" 
                  (input)="onQtyChange(idx, +$any($event.target).value)" 
                  min="0.1" 
                  step="any" 
                  class="h-8 text-xs w-18 text-center" />
                <span class="text-[0.7rem] text-muted-foreground whitespace-nowrap">
                  {{ getIngredientUnit(row.ingredient_id) }}/p
                </span>
              </div>

              <button 
                hlmBtn 
                variant="ghost" 
                size="icon-xs" 
                (click)="removeIngredientRow(idx)" 
                class="text-rose hover:bg-rose/10 hover:text-rose shrink-0" 
                title="Remove ingredient">
                ✕
              </button>
            </div>
          }
        </div>
      </div>
    </div>

    <hlm-dialog-footer class="mt-4 pt-3 border-t border-border">
      <button hlmBtn variant="secondary" (click)="close()">Cancel</button>
      <button hlmBtn (click)="saveDish()" [disabled]="!newDishName().trim()">
        Save Dish & Recipe
      </button>
    </hlm-dialog-footer>
  `
})
export class DishCreateDialogComponent {
  public store = inject(MealStoreService);
  protected readonly dialogRef = inject(BrnDialogRef);

  public newDishName = signal<string>('');
  public newCookNotes = signal<string>('');
  public newIngredients = signal<RecipeIngredientRow[]>([]);

  public masterIngredients = this.store.ingredients;
  public ingredientsMap = this.store.ingredientsMap;

  constructor() {
    const firstIng = this.masterIngredients()[0]?.id || '';
    this.newIngredients.set([
      { ingredient_id: firstIng, qty_per_person: 50 }
    ]);
  }

  public addIngredientRow(): void {
    const firstIng = this.masterIngredients()[0]?.id || '';
    this.newIngredients.update(rows => [
      ...rows,
      { ingredient_id: firstIng, qty_per_person: 50 }
    ]);
  }

  public removeIngredientRow(index: number): void {
    this.newIngredients.update(rows => rows.filter((_, i) => i !== index));
  }

  public onIngredientChange(index: number, ingId: string | null | undefined): void {
    if (!ingId) return;
    this.newIngredients.update(rows => {
      const updated = [...rows];
      if (updated[index]) {
        updated[index] = { ...updated[index], ingredient_id: ingId };
      }
      return updated;
    });
  }

  public onQtyChange(index: number, qty: number): void {
    this.newIngredients.update(rows => {
      const updated = [...rows];
      if (updated[index]) {
        updated[index] = { ...updated[index], qty_per_person: qty };
      }
      return updated;
    });
  }

  public getIngredientUnit(id: string): string {
    return this.ingredientsMap().get(id)?.unit || 'g';
  }

  public close(): void {
    this.dialogRef.close();
  }

  public async saveDish(): Promise<void> {
    const name = this.newDishName().trim();
    if (!name) return;

    const validIngredients = this.newIngredients().filter(
      r => r.ingredient_id && r.qty_per_person > 0
    );

    await this.store.createDish(name, this.newCookNotes(), validIngredients);
    this.dialogRef.close(true);
  }
}
