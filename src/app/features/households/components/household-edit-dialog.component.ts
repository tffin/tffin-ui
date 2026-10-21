import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { Household } from '../../../core/models/household.model';
import { HouseholdService } from '../../../core/services/household.service';

export interface HouseholdEditDialogData {
  household: Household;
}

@Component({
  selector: 'app-household-edit-dialog',
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
      <h3 hlmDialogTitle>Edit Household Profile</h3>
      <p hlmDialogDescription>Update name, contact info, default portions, and dietary notes.</p>
    </hlm-dialog-header>

    <div class="space-y-4 py-3 max-h-[70vh] overflow-y-auto pr-1">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label hlmLabel>Household Name *</label>
          <input 
            hlmInput 
            type="text" 
            [value]="editName()" 
            (input)="editName.set($any($event.target).value)" 
            class="w-full text-sm" />
        </div>

        <div class="space-y-1.5">
          <label hlmLabel>Short Code</label>
          <input 
            hlmInput 
            type="text" 
            [value]="editCode()" 
            (input)="editCode.set($any($event.target).value)" 
            class="w-full text-sm" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="space-y-1.5">
          <label hlmLabel>Default Headcount</label>
          <input 
            hlmInput 
            type="number" 
            min="1" 
            [value]="editHeadcount()" 
            (input)="editHeadcount.set(+$any($event.target).value)" 
            class="w-full text-sm" />
        </div>

        <div class="space-y-1.5">
          <label hlmLabel>Contact Person</label>
          <input 
            hlmInput 
            type="text" 
            [value]="editContactName()" 
            (input)="editContactName.set($any($event.target).value)" 
            class="w-full text-sm" />
        </div>

        <div class="space-y-1.5">
          <label hlmLabel>Theme Color Tag</label>
          <div class="flex items-center gap-2 pt-1">
            <input 
              type="color" 
              [value]="editColorTag()" 
              (input)="editColorTag.set($any($event.target).value)" 
              class="w-9 h-9 p-0.5 rounded cursor-pointer border border-border bg-transparent" />
            <span class="text-xs font-mono text-muted-foreground">{{ editColorTag() }}</span>
          </div>
        </div>
      </div>

      <div class="space-y-1.5">
        <label hlmLabel>Contact Phone</label>
        <input 
          hlmInput 
          type="text" 
          [value]="editContactPhone()" 
          (input)="editContactPhone.set($any($event.target).value)" 
          class="w-full text-sm" />
      </div>

      <div class="space-y-1.5">
        <label hlmLabel>Delivery Address</label>
        <input 
          hlmInput 
          type="text" 
          [value]="editAddress()" 
          (input)="editAddress.set($any($event.target).value)" 
          class="w-full text-sm" />
      </div>

      <div class="space-y-1.5">
        <label hlmLabel>Dietary Restrictions & Guidelines</label>
        <textarea 
          hlmTextarea 
          [value]="editDietaryNotes()" 
          (input)="editDietaryNotes.set($any($event.target).value)" 
          rows="2" 
          class="w-full text-sm"></textarea>
      </div>
    </div>

    <hlm-dialog-footer class="mt-4 pt-3 border-t border-border flex justify-between items-center">
      <button hlmBtn variant="destructive" size="sm" (click)="onDeleteClick()">
        Delete Household
      </button>

      <div class="flex items-center gap-2">
        <button hlmBtn variant="secondary" (click)="close()" [disabled]="isSaving()">Cancel</button>
        <button 
          hlmBtn 
          (click)="save()" 
          [disabled]="!editName().trim() || isSaving()">
          {{ isSaving() ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </hlm-dialog-footer>
  `
})
export class HouseholdEditDialogComponent implements OnInit {
  protected readonly context = injectBrnDialogContext<HouseholdEditDialogData>();
  protected readonly dialogRef = inject(BrnDialogRef);
  private householdService = inject(HouseholdService);

  public editName = signal<string>('');
  public editCode = signal<string>('');
  public editContactName = signal<string>('');
  public editContactPhone = signal<string>('');
  public editAddress = signal<string>('');
  public editHeadcount = signal<number>(2);
  public editDietaryNotes = signal<string>('');
  public editColorTag = signal<string>('#6366f1');
  public isSaving = signal<boolean>(false);

  public ngOnInit(): void {
    const hh = this.context.household;
    if (hh) {
      this.editName.set(hh.name);
      this.editCode.set(hh.code || '');
      this.editContactName.set(hh.contact_name || '');
      this.editContactPhone.set(hh.contact_phone || '');
      this.editAddress.set(hh.address || '');
      this.editHeadcount.set(hh.default_headcount || 2);
      this.editDietaryNotes.set(hh.dietary_notes || '');
      this.editColorTag.set(hh.color_tag || '#6366f1');
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  public onDeleteClick(): void {
    this.dialogRef.close({ action: 'delete', household: this.context.household });
  }

  public async save(): Promise<void> {
    const hh = this.context.household;
    if (!hh) return;

    const name = this.editName().trim();
    if (!name) return;

    this.isSaving.set(true);
    try {
      await this.householdService.updateHousehold(hh.id, {
        name,
        code: this.editCode().trim() || undefined,
        contact_name: this.editContactName().trim() || undefined,
        contact_phone: this.editContactPhone().trim() || undefined,
        address: this.editAddress().trim() || undefined,
        default_headcount: Number(this.editHeadcount()) || 2,
        dietary_notes: this.editDietaryNotes().trim() || undefined,
        color_tag: this.editColorTag() || '#6366f1'
      });
      this.dialogRef.close({ action: 'saved' });
    } finally {
      this.isSaving.set(false);
    }
  }
}
