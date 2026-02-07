/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, HostListener, OnDestroy, inject } from '@angular/core';
import { HasUnsavedChanges, UnsavedChangesService } from 'ausmittlung-lib';

@Component({
  selector: 'app-erfassung-contest-detail',
  templateUrl: './erfassung-contest-detail.component.html',
  standalone: false,
})
export class ErfassungContestDetailComponent implements HasUnsavedChanges, OnDestroy {
  private readonly unsavedChangesService = inject(UnsavedChangesService);

  @HostListener('window:beforeunload')
  public beforeUnload(): boolean {
    return !this.unsavedChangesService.hasUnsavedChanges();
  }

  public get hasUnsavedChanges(): boolean {
    return this.unsavedChangesService.hasUnsavedChanges();
  }

  public ngOnDestroy(): void {
    this.unsavedChangesService.removeAllUnsavedChanges();
  }
}
