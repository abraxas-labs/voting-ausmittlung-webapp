/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnDestroy } from '@angular/core';
import { RuntimeConfigService } from '../../services/runtime-config.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ThemeService } from '@abraxas/voting-lib';

@Component({
  selector: 'vo-ausm-system-busy',
  templateUrl: './system-busy.component.html',
  styleUrls: ['./system-busy.component.scss'],
  standalone: false,
})
export class SystemBusyComponent implements OnDestroy {
  private readonly runtimeConfigService = inject(RuntimeConfigService);
  private readonly subscription: Subscription;
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  constructor() {
    this.subscription = this.runtimeConfigService.delay$.subscribe(delay => {
      if (delay !== Infinity) {
        this.router.navigate([this.themeService.theme$.value]);
      }
    });
  }

  public ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
