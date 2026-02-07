/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CanDeactivate } from '@angular/router';
import { DialogService } from '@abraxas/voting-lib';
import { TranslateService } from '@ngx-translate/core';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HasDeactivateGuard<T extends HasDeactivate> implements CanDeactivate<T> {
  private readonly dialog = inject(DialogService);
  private readonly i18n = inject(TranslateService);

  public async canDeactivate(component: T): Promise<boolean> {
    if (!component.showDeactivateMessage) {
      return true;
    }

    return await this.dialog.confirm(
      this.i18n.instant(component.deactivateTitle),
      this.i18n.instant(component.deactivateMessage),
      'APP.YES',
    );
  }
}

export interface HasDeactivate {
  showDeactivateMessage: boolean;
  deactivateTitle: string;
  deactivateMessage: string;
}
