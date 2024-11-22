/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CanDeactivate } from '@angular/router';
import { DialogService } from '@abraxas/voting-lib';
import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HasUnsavedChangesGuard<T extends HasUnsavedChanges> implements CanDeactivate<T> {
  constructor(
    private readonly dialog: DialogService,
    private readonly i18n: TranslateService,
  ) {}

  public async canDeactivate(component: T): Promise<boolean> {
    if (!component.hasUnsavedChanges) {
      return true;
    }

    return await this.dialog.confirm('APP.CHANGES.TITLE', this.i18n.instant('APP.CHANGES.MSG'), 'APP.YES');
  }
}

export interface HasUnsavedChanges {
  hasUnsavedChanges: boolean;
}
