import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HouseholdService } from '../../../core/services/household.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-household-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmTextarea,
    HlmDialogImports
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>Create New Household Profile</h3>
      <p hlmDialogDescription>Set up your residence or family kitchen profile to start meal planning.</p>
    </hlm-dialog-header>

    <div class="space-y-4 py-3 max-h-[70vh] overflow-y-auto pr-1">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label hlmLabel>Household Name *</label>
          <input 
            hlmInput 
            type="text" 
            [value]="createName()" 
            (input)="createName.set($any($event.target).value)" 
            placeholder="e.g. Sharma Residence or Flat 402" 
            class="w-full text-sm" />
        </div>

        <div class="space-y-1.5">
          <label hlmLabel>Short Code</label>
          <input 
            hlmInput 
            type="text" 
            [value]="createCode()" 
            (input)="createCode.set($any($event.target).value)" 
            placeholder="e.g. HH-04" 
            class="w-full text-sm" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="space-y-1.5">
          <label hlmLabel>Default Headcount (Persons) *</label>
          <input 
            hlmInput 
            type="number" 
            min="1" 
            [value]="createHeadcount()" 
            (input)="createHeadcount.set(+$any($event.target).value)" 
            class="w-full text-sm" />
        </div>

        <div class="space-y-1.5">
          <label hlmLabel>Contact Person</label>
          <input 
            hlmInput 
            type="text" 
            [value]="createContactName()" 
            (input)="createContactName.set($any($event.target).value)" 
            placeholder="e.g. Primary resident" 
            class="w-full text-sm" />
        </div>

        <div class="space-y-1.5">
          <label hlmLabel>Theme Color Tag</label>
          <div class="flex items-center gap-2 pt-1">
            <input 
              type="color" 
              [value]="createColorTag()" 
              (input)="createColorTag.set($any($event.target).value)" 
              class="w-9 h-9 p-0.5 rounded cursor-pointer border border-border bg-transparent" />
            <span class="text-xs font-mono text-muted-foreground">{{ createColorTag() }}</span>
          </div>
        </div>
      </div>

      <div class="space-y-1.5">
        <label hlmLabel>Contact Phone</label>
        <input 
          hlmInput 
          type="text" 
          [value]="createContactPhone()" 
          (input)="createContactPhone.set($any($event.target).value)" 
          placeholder="e.g. +91 98765 43210" 
          class="w-full text-sm" />
      </div>

      <div class="space-y-1.5">
        <label hlmLabel>Delivery Address</label>
        <input 
          hlmInput 
          type="text" 
          [value]="createAddress()" 
          (input)="createAddress.set($any($event.target).value)" 
          placeholder="e.g. B-104 Sunrise Heights, Road No. 2" 
          class="w-full text-sm" />
      </div>

      <div class="space-y-1.5">
        <label hlmLabel>Dietary Restrictions & Guidelines</label>
        <textarea 
          hlmTextarea 
          [value]="createDietaryNotes()" 
          (input)="createDietaryNotes.set($any($event.target).value)" 
          placeholder="e.g. Vegetarian, Jain (no root veggies), Low spice, Nut allergy" 
          rows="2" 
          class="w-full text-sm"></textarea>
      </div>
    </div>

    <hlm-dialog-footer class="mt-4 pt-3 border-t border-border flex justify-end gap-2">
      <button hlmBtn variant="secondary" (click)="close()" [disabled]="isCreating()">Cancel</button>
      <button 
        hlmBtn 
        (click)="submit()" 
        [disabled]="!createName().trim() || isCreating()">
        {{ isCreating() ? 'Creating Household...' : 'Create Household' }}
      </button>
    </hlm-dialog-footer>
  `
})
export class HouseholdCreateDialogComponent {
  private householdService = inject(HouseholdService);
  private auth = inject(AuthService);
  protected readonly dialogRef = inject(BrnDialogRef);

  public createName = signal<string>('');
  public createCode = signal<string>('');
  public createContactName = signal<string>(this.auth.currentUser()?.fullName || '');
  public createContactPhone = signal<string>('');
  public createAddress = signal<string>('');
  public createHeadcount = signal<number>(2);
  public createDietaryNotes = signal<string>('');
  public createColorTag = signal<string>('#6366f1');
  public isCreating = signal<boolean>(false);

  public close(): void {
    this.dialogRef.close();
  }

  public async submit(): Promise<void> {
    const name = this.createName().trim();
    if (!name) return;

    this.isCreating.set(true);
    try {
      const created = await this.householdService.createHousehold({
        name,
        code: this.createCode().trim() || undefined,
        contact_name: this.createContactName().trim() || undefined,
        contact_phone: this.createContactPhone().trim() || undefined,
        address: this.createAddress().trim() || undefined,
        default_headcount: Number(this.createHeadcount()) || 2,
        dietary_notes: this.createDietaryNotes().trim() || undefined,
        color_tag: this.createColorTag() || '#6366f1',
        is_active: true
      });

      if (created) {
        this.dialogRef.close(created);
      }
    } finally {
      this.isCreating.set(false);
    }
  }
}
