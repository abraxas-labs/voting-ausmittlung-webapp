/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { HasUnsavedChanges, PermissionService, UnsavedChangesService, Permissions } from 'ausmittlung-lib';

@Component({
  selector: 'app-erfassung-contest-detail',
  templateUrl: './erfassung-contest-detail.component.html',
  standalone: false,
})
export class ErfassungContestDetailComponent implements HasUnsavedChanges, OnInit, OnDestroy {
  private readonly unsavedChangesService = inject(UnsavedChangesService);
  private readonly permissionService = inject(PermissionService);

  public showExport: boolean = false;

  @HostListener('window:beforeunload')
  public beforeUnload(): boolean {
    return !this.unsavedChangesService.hasUnsavedChanges();
  }

  public get hasUnsavedChanges(): boolean {
    return this.unsavedChangesService.hasUnsavedChanges();
  }

  public async ngOnInit(): Promise<void> {
    this.showExport = await this.permissionService.hasPermission(Permissions.Export.ExportData);
  }

  public ngOnDestroy(): void {
    this.unsavedChangesService.removeAllUnsavedChanges();
  }
}
