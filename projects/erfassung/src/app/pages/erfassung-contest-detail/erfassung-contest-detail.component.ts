/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, HostListener, OnDestroy } from '@angular/core';
import { HasUnsavedChanges, UnsavedChangesService } from 'ausmittlung-lib';

@Component({
  selector: 'app-erfassung-contest-detail',
  templateUrl: './erfassung-contest-detail.component.html',
})
export class ErfassungContestDetailComponent implements HasUnsavedChanges, OnDestroy {
  @HostListener('window:beforeunload')
  public beforeUnload(): boolean {
    return !this.unsavedChangesService.hasUnsavedChanges();
  }

  constructor(private readonly unsavedChangesService: UnsavedChangesService) {}

  public get hasUnsavedChanges(): boolean {
    return this.unsavedChangesService.hasUnsavedChanges();
  }

  public ngOnDestroy(): void {
    this.unsavedChangesService.removeAllUnsavedChanges();
  }
}
