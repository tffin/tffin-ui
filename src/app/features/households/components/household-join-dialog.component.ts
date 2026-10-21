import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HouseholdService } from '../../../core/services/household.service';

export interface HouseholdJoinDialogData {
  initialCode?: string;
}

@Component({
  selector: 'app-household-join-dialog',
  standalone: true,
  imports: [
    CommonModule,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmAlertImports,
    HlmDialogImports
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>Join a Household</h3>
      <p hlmDialogDescription>Enter the invitation code received from a household owner or manager.</p>
    </hlm-dialog-header>

    <div class="space-y-4 py-3">
      @if (joinError(); as err) {
        <div hlmAlert variant="destructive" class="py-2.5">
          <p hlmAlertDescription>{{ err }}</p>
        </div>
      }

      <div class="space-y-1.5">
        <label hlmLabel>Invite Code *</label>
        <input 
          hlmInput 
          type="text" 
          [value]="joinCodeInput()" 
          (input)="joinCodeInput.set($any($event.target).value)" 
          placeholder="e.g. TFFN-XXXXXX" 
          class="w-full font-mono text-center tracking-widest uppercase text-base h-11" />
      </div>
    </div>

    <hlm-dialog-footer class="mt-4 pt-3 border-t border-border flex justify-end gap-2">
      <button hlmBtn variant="secondary" (click)="close()" [disabled]="isJoining()">Cancel</button>
      <button 
        hlmBtn 
        (click)="submit()" 
        [disabled]="!joinCodeInput().trim() || isJoining()">
        {{ isJoining() ? 'Joining...' : 'Accept & Join Household' }}
      </button>
    </hlm-dialog-footer>
  `
})
export class HouseholdJoinDialogComponent implements OnInit {
  protected readonly context = injectBrnDialogContext<HouseholdJoinDialogData>();
  protected readonly dialogRef = inject(BrnDialogRef);
  private householdService = inject(HouseholdService);

  public joinCodeInput = signal<string>('');
  public isJoining = signal<boolean>(false);
  public joinError = signal<string | null>(null);

  public ngOnInit(): void {
    if (this.context?.initialCode) {
      this.joinCodeInput.set(this.context.initialCode);
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  public async submit(): Promise<void> {
    const code = this.joinCodeInput().trim();
    if (!code) {
      this.joinError.set('Please enter a valid invite code');
      return;
    }

    this.isJoining.set(true);
    this.joinError.set(null);

    const res = await this.householdService.acceptInviteCode(code);
    this.isJoining.set(false);

    if (res.success && res.household_id) {
      this.dialogRef.close({ success: true, householdId: res.household_id });
    } else {
      this.joinError.set(res.message);
    }
  }
}
