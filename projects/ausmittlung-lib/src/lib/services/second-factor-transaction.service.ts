/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService } from '@abraxas/voting-lib';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  SecondFactorTransactionDialogComponent,
  SecondFactorTransactionDialogData,
  SecondFactorTransactionDialogResult,
} from '../components/transaction-request-dialog/second-factor-transaction-dialog.component';
import { SecondFactorTransactionNevisInfo, SecondFactorTransactionProvider } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SecondFactorTransactionService {
  private readonly dialog = inject(DialogService);

  public async showDialogAndExecuteVerifyAction<T>(
    action: (otpCode?: string) => Observable<T>,
    nevisInfo?: SecondFactorTransactionNevisInfo,
    availableProviders?: SecondFactorTransactionProvider[],
  ): Promise<void> {
    const data: SecondFactorTransactionDialogData = {
      nevisInfo,
      availableProviders,
      action,
    };

    const result = await this.dialog.openForResult<SecondFactorTransactionDialogComponent, SecondFactorTransactionDialogResult>(
      SecondFactorTransactionDialogComponent,
      data,
    );

    if (result?.error) {
      throw result.error;
    }

    if (!result?.verified) {
      throw new Error('Second factor transaction not verified');
    }
  }
}
