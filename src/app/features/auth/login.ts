import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCookingPot,
  lucideUser,
  lucideLock,
  lucideEye,
  lucideEyeOff,
  lucideArrowRight
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmAlertImports,
    HlmCheckbox
  ],
  providers: [
    provideIcons({
      lucideCookingPot,
      lucideUser,
      lucideLock,
      lucideEye,
      lucideEyeOff,
      lucideArrowRight
    })
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  public auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public username = signal<string>('');
  public password = signal<string>('');
  public rememberMe = signal<boolean>(true);
  public showPassword = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);
  public isGoogleLoading = signal<boolean>(false);

  constructor() {
    // If already logged in, redirect directly to dashboard or returnUrl
    if (this.auth.isAuthenticated()) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigateByUrl(returnUrl);
    }
  }

  public async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage.set(null);

    const userVal = this.username().trim();
    const passVal = this.password();

    if (!userVal || !passVal) {
      this.errorMessage.set('Please enter both username and password.');
      return;
    }

    const res = await this.auth.login(userVal, passVal, this.rememberMe());

    if (res.success) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigateByUrl(returnUrl);
    } else {
      this.errorMessage.set(res.error || 'Authentication failed. Please verify credentials.');
    }
  }

  public async onSignInGoogle(): Promise<void> {
    this.errorMessage.set(null);
    this.isGoogleLoading.set(true);

    const res = await this.auth.loginWithGoogle();
    if (!res.success && res.error) {
      this.errorMessage.set(res.error);
      this.isGoogleLoading.set(false);
    }
  }

  public togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }
}
