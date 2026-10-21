import { Injectable, inject, signal } from '@angular/core';
import { LumberjackService } from '@ngworker/lumberjack';
import { toast } from '@spartan-ng/brain/sonner';

export interface AppNotification {
  message: string;
  type: 'success' | 'info' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private lumberjack = inject(LumberjackService);
  public notification = signal<AppNotification | null>(null);
  private timeoutId: any = null;

  public show(message: string, type: 'success' | 'info' | 'error' = 'info', durationMs: number = 4000): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    try {
      if (type === 'error') {
        this.lumberjack.logWarning(`Displaying error notification: "${message}"`, undefined, 'NotificationService');
        toast.error(message, { duration: durationMs });
      } else if (type === 'success') {
        this.lumberjack.logInfo(`Displaying success notification: "${message}"`, undefined, 'NotificationService');
        toast.success(message, { duration: durationMs });
      } else {
        this.lumberjack.logInfo(`Displaying info notification: "${message}"`, undefined, 'NotificationService');
        toast.info(message, { duration: durationMs });
      }
    } catch {
      // In non-browser environments or tests without sonner context
    }

    this.notification.set({ message, type });
    this.timeoutId = setTimeout(() => {
      this.notification.set(null);
      this.timeoutId = null;
    }, durationMs);
  }

  public clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.notification.set(null);
  }
}
