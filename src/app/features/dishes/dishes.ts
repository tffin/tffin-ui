import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { MealStoreService } from '../../core/services/meal-store.service';
import { Dish } from '../../core/models/dish.model';
import { DishCreateDialogComponent } from './components/dish-create-dialog.component';

@Component({
  selector: 'app-dishes',
  standalone: true,
  imports: [
    CommonModule,
    HlmButton,
    HlmInput,
    HlmBadge,
    HlmCardImports
  ],
  templateUrl: './dishes.html',
  styleUrl: './dishes.scss'
})
export class DishesComponent {
  public store = inject(MealStoreService);
  private dialogService = inject(HlmDialogService);

  public searchQuery = signal<string>('');
  public portionMultiplier = signal<number>(3); // 1, 3, 5 people portion preview

  public dishes = this.store.dishes;
  public masterIngredients = this.store.ingredients;
  public ingredientsMap = this.store.ingredientsMap;

  public filteredDishes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.dishes();
    return this.dishes().filter(d => 
      d.name.toLowerCase().includes(q) ||
      (d.cook_notes && d.cook_notes.toLowerCase().includes(q))
    );
  });

  public openCreateModal(): void {
    this.dialogService.open(DishCreateDialogComponent, {
      contentClass: 'sm:max-w-xl bg-card border border-border text-card-foreground shadow-2xl rounded-2xl p-6'
    });
  }

  public async deleteDish(dishId: string): Promise<void> {
    if (confirm('Are you sure you want to remove this dish?')) {
      await this.store.deleteDish(dishId);
    }
  }

  public getIngredientUnit(id: string): string {
    return this.ingredientsMap().get(id)?.unit || 'g';
  }

  public getIngredientName(id: string): string {
    return this.ingredientsMap().get(id)?.name || 'Unknown';
  }
}
