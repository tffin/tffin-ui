import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { Household } from '../../../core/models/household.model';
import { HouseholdService } from '../../../core/services/household.service';

export interface HouseholdDeleteDialogData {
  household: Household;
}

@Component({
  selector: 'app-household-delete-dialog',
  standalone: true,
  imports: [
    CommonModule,
    HlmButton,
    HlmAlertImports,
    HlmDialogImports
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle class="text-destructive">Delete Household</h3>
      <p hlmDialogDescription>This action cannot be undone.</p>
    </hlm-dialog-header>

    <div class="space-y-4 py-3">
      <div hlmAlert variant="destructive" class="py-3">
        <div class="space-y-1">
          <p class="font-bold text-sm">Warning: Permanent Deletion</p>
          <p class="text-xs text-muted-foreground">
            Deleting <strong>{{ context.household.name }}</strong> will permanently remove all associated meal plans, member memberships, and pending invitations.
          </p>
        </div>
      </div>

      <p class="text-sm text-foreground">
        Are you sure you want to permanently delete <strong>{{ context.household.name }}</strong>?
      </p>
    </div>

    <hlm-dialog-footer class="mt-4 pt-3 border-t border-border flex justify-end gap-2">
      <button hlmBtn variant="secondary" (click)="close()" [disabled]="isDeleting()">Cancel</button>
      <button 
        hlmBtn 
        variant="destructive" 
        (click)="confirmDelete()" 
        [disabled]="isDeleting()">
        {{ isDeleting() ? 'Deleting...' : 'Yes, Delete Household' }}
      </button>
    </hlm-dialog-footer>
  `
})
export class HouseholdDeleteDialogComponent {
  protected readonly context = injectBrnDialogContext<HouseholdDeleteDialogData>();
  protected readonly dialogRef = inject(BrnDialogRef);
  private householdService = inject(HouseholdService);

  public isDeleting = signal<boolean>(false);

  public close(): void {
    this.dialogRef.close();
  }

  public async confirmDelete(): Promise<void> {
    const hh = this.context.household;
    if (!hh) return;

    this.isDeleting.set(true);
    try {
      const success = await this.householdService.deleteHousehold(hh.id);
      if (success) {
        this.dialogRef.close(true);
      }
    } finally {
      this.isDeleting.set(false);
    }
  }
}
