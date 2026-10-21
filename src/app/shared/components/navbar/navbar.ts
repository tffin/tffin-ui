import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  lucideMenu, 
  lucideX, 
  lucideCookingPot, 
  lucideLayoutDashboard, 
  lucideCalendar, 
  lucideUtensilsCrossed, 
  lucidePackage, 
  lucideShoppingCart, 
  lucideUsers, 
  lucideLogOut 
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HouseholdService } from '../../../core/services/household.service';
import { MealStoreService } from '../../../core/services/meal-store.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    NgIcon,
    HlmBadge,
    HlmSelectImports,
    HlmAvatarImports
  ],
  providers: [
    provideIcons({
      lucideMenu,
      lucideX,
      lucideCookingPot,
      lucideLayoutDashboard,
      lucideCalendar,
      lucideUtensilsCrossed,
      lucidePackage,
      lucideShoppingCart,
      lucideUsers,
      lucideLogOut
    })
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  public householdService = inject(HouseholdService);
  public store = inject(MealStoreService);
  public auth = inject(AuthService);
  private router = inject(Router);

  // Drawer / Sidebar State
  public isSidebarOpen = signal<boolean>(false);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeSidebar();
      });
  }

  public toggleSidebar(): void {
    this.isSidebarOpen.update(open => !open);
  }

  public openSidebar(): void {
    this.isSidebarOpen.set(true);
  }

  public closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  public onEscape(): void {
    if (this.isSidebarOpen()) {
      this.closeSidebar();
    }
  }

  public currentUser = this.auth.currentUser;
  public households = this.householdService.households;
  public activeHouseholds = this.householdService.activeHouseholds;
  public authorizedHouseholds = this.householdService.authorizedHouseholds;
  public selectedHouseholdId = this.householdService.selectedHouseholdId;

  public isSingleHouseholdUser = this.householdService.isSingleHouseholdUser;
  public singleHousehold = this.householdService.singleHousehold;
  public canManageHouseholds = computed(() => this.householdService.canManageAnyHousehold());

  get lowStockCount(): number {
    return this.store.lowStockCount();
  }

  public onSelectHouseholdValue(val: string | null | undefined): void {
    this.householdService.setSelectedHousehold(val ? val : null);
  }

  public onLogout(): void {
    this.auth.logout();
  }
}
