import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideSearch } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { MealStoreService } from '../../core/services/meal-store.service';
import { IngredientCreateDialogComponent } from './components/ingredient-create-dialog.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    HlmButton,
    HlmBadge,
    HlmInput,
    HlmTableImports,
    HlmProgressImports
  ],
  providers: [
    provideIcons({
      lucidePlus,
      lucideSearch
    })
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss'
})
export class InventoryComponent {
  public store = inject(MealStoreService);
  protected readonly dialogService = inject(HlmDialogService);

  public selectedCategory = signal<string>('all');
  public searchQuery = signal<string>('');
  public filterLowStockOnly = signal<boolean>(false);

  public enrichedInventory = this.store.enrichedInventory;

  public categories = ['all', 'produce', 'dairy', 'spices', 'staples'];

  public filteredInventory = computed(() => {
    let list = this.enrichedInventory();
    const cat = this.selectedCategory();
    const query = this.searchQuery().toLowerCase().trim();
    const lowOnly = this.filterLowStockOnly();

    if (cat !== 'all') {
      list = list.filter(item => item.ingredient?.category?.toLowerCase() === cat.toLowerCase());
    }

    if (query) {
      list = list.filter(item => item.ingredient?.name.toLowerCase().includes(query));
    }

    if (lowOnly) {
      list = list.filter(item => item.isLowStock);
    }

    return list;
  });

  public openCreateModal(): void {
    this.dialogService.open(IngredientCreateDialogComponent, {
      contentClass: 'sm:max-w-[500px] bg-card text-card-foreground border-border'
    });
  }

  public async adjustStock(ingredientId: string, delta: number): Promise<void> {
    await this.store.adjustInventoryDelta(ingredientId, delta);
  }

  public async onDirectQtyChange(ingredientId: string, event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const val = Number(target.value);
    if (!isNaN(val)) {
      await this.store.updateInventoryQuantity(ingredientId, val);
    }
  }

  public async onDirectThresholdChange(ingredientId: string, currentQty: number, event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const val = Number(target.value);
    if (!isNaN(val)) {
      await this.store.updateInventoryQuantity(ingredientId, currentQty, val);
    }
  }
}
