import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { Household, HouseholdInvitation, HouseholdMemberRole } from '../../../core/models/household.model';
import { HouseholdService } from '../../../core/services/household.service';
import { MealStoreService } from '../../../core/services/meal-store.service';

export interface HouseholdInviteDialogData {
  household: Household;
}

@Component({
  selector: 'app-household-invite-dialog',
  standalone: true,
  imports: [
    CommonModule,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmSelectImports,
    HlmDialogImports
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>Invite to {{ context.household.name }}</h3>
      <p hlmDialogDescription>Generate an invitation link to share with a member.</p>
    </hlm-dialog-header>

    <div class="space-y-4 py-3">
      @if (!generatedInvite()) {
        <div class="space-y-1.5">
          <label hlmLabel>Role in Household</label>
          <hlm-select [value]="inviteRole()" [itemToString]="roleItemToString" (valueChange)="onRoleChange($event)">
            <hlm-select-trigger class="w-full h-9 bg-input border-border text-sm">
              <hlm-select-value placeholder="Select role..." />
            </hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal class="bg-popover border-border">
              <hlm-select-item value="member">Household Member (View &amp; plan meals)</hlm-select-item>
              <hlm-select-item value="owner">Household Owner (Full admin access)</hlm-select-item>
              <hlm-select-item value="viewer">Viewer (Read-only)</hlm-select-item>
            </hlm-select-content>
          </hlm-select>
        </div>

        <div class="space-y-1.5">
          <label hlmLabel>Optional Email or Note</label>
          <input 
            hlmInput 
            type="text" 
            [value]="inviteEmail()" 
            (input)="inviteEmail.set($any($event.target).value)" 
            placeholder="e.g. spouse@example.com" 
            class="w-full text-sm" />
        </div>

        <div class="space-y-1.5">
          <label hlmLabel>Link Expiration</label>
          <hlm-select [value]="inviteExpiryDays().toString()" [itemToString]="expiryItemToString" (valueChange)="onExpiryChange($event)">
            <hlm-select-trigger class="w-full h-9 bg-input border-border text-sm">
              <hlm-select-value placeholder="Select expiration..." />
            </hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal class="bg-popover border-border">
              <hlm-select-item value="3">3 Days</hlm-select-item>
              <hlm-select-item value="7">7 Days (Standard)</hlm-select-item>
              <hlm-select-item value="14">14 Days</hlm-select-item>
              <hlm-select-item value="30">30 Days</hlm-select-item>
            </hlm-select-content>
          </hlm-select>
        </div>
      } @else {
        <div class="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-3">
          <div class="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <span>✓ Invite link generated successfully!</span>
          </div>

          <div class="flex items-center gap-2 font-mono text-xs text-foreground bg-input/50 p-2 rounded-lg border border-border">
            <span class="text-muted-foreground uppercase">Code:</span>
            <span class="font-bold tracking-wider text-primary">{{ generatedInvite()?.invite_code }}</span>
          </div>

          <div class="flex items-center gap-2">
            <input 
              hlmInput 
              type="text" 
              readonly 
              [value]="getInviteUrl(generatedInvite()!.invite_code)" 
              class="w-full text-xs font-mono select-all" />
            <button 
              hlmBtn 
              size="sm" 
              (click)="copyInviteLink(generatedInvite()!.invite_code)"
              class="whitespace-nowrap">
              {{ copiedInviteLink() ? '✓ Copied!' : 'Copy Link' }}
            </button>
          </div>
        </div>
      }
    </div>

    <hlm-dialog-footer class="mt-4 pt-3 border-t border-border flex justify-end gap-2">
      @if (!generatedInvite()) {
        <button hlmBtn variant="secondary" (click)="close()" [disabled]="isCreating()">Cancel</button>
        <button 
          hlmBtn 
          (click)="generateInvite()" 
          [disabled]="isCreating()">
          {{ isCreating() ? 'Generating...' : 'Create Invite Link' }}
        </button>
      } @else {
        <button hlmBtn (click)="close()">Done</button>
      }
    </hlm-dialog-footer>
  `
})
export class HouseholdInviteDialogComponent {
  protected readonly context = injectBrnDialogContext<HouseholdInviteDialogData>();
  protected readonly dialogRef = inject(BrnDialogRef);
  private householdService = inject(HouseholdService);
  private store = inject(MealStoreService);

  public inviteRole = signal<HouseholdMemberRole>('member');
  public inviteEmail = signal<string>('');
  public inviteExpiryDays = signal<number>(7);
  public generatedInvite = signal<HouseholdInvitation | null>(null);
  public copiedInviteLink = signal<boolean>(false);
  public isCreating = signal<boolean>(false);

  public readonly roleMap: Record<string, string> = {
    member: 'Household Member (View & plan meals)',
    owner: 'Household Owner (Full admin access)',
    viewer: 'Viewer (Read-only)',
  };

  public readonly expiryMap: Record<string, string> = {
    '3': '3 Days',
    '7': '7 Days (Standard)',
    '14': '14 Days',
    '30': '30 Days',
  };

  public readonly roleItemToString = (val: unknown): string => {
    return (typeof val === 'string' && this.roleMap[val]) || '';
  };

  public readonly expiryItemToString = (val: unknown): string => {
    return (typeof val === 'string' && this.expiryMap[val]) || '';
  };

  public onRoleChange(role: string | null | undefined): void {
    if (role) {
      this.inviteRole.set(role as HouseholdMemberRole);
    }
  }

  public onExpiryChange(days: string | null | undefined): void {
    if (days) {
      this.inviteExpiryDays.set(Number(days));
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  public async generateInvite(): Promise<void> {
    const hh = this.context.household;
    if (!hh) return;

    this.isCreating.set(true);
    try {
      const inv = await this.householdService.createInviteLink(
        hh.id,
        this.inviteRole(),
        this.inviteEmail().trim() || undefined,
        this.inviteExpiryDays()
      );
      this.generatedInvite.set(inv);
    } finally {
      this.isCreating.set(false);
    }
  }

  public getInviteUrl(code: string): string {
    const origin = window.location.origin;
    return `${origin}/households?join=${code}`;
  }

  public async copyInviteLink(code: string): Promise<void> {
    const url = this.getInviteUrl(code);
    try {
      await navigator.clipboard.writeText(url);
      this.copiedInviteLink.set(true);
      setTimeout(() => this.copiedInviteLink.set(false), 2500);
      this.store.showNotification('Invite link copied to clipboard!', 'info');
    } catch {
      this.store.showNotification(`Invite Code: ${code}`, 'info');
    }
  }
}
