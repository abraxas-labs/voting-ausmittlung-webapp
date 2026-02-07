/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService } from '@abraxas/voting-lib';
import { Injectable, inject } from '@angular/core';
import { defer, Observable, of, OperatorFunction, throwError } from 'rxjs';
import { concatMap, retryWhen } from 'rxjs/operators';
import {
  SecondFactorTransactionDialogComponent,
  SecondFactorTransactionDialogData,
} from '../components/transaction-request-dialog/second-factor-transaction-dialog.component';
import { isErrorType } from './utils/error.utils';

const ERROR_TYPE_VERIFY_SECOND_FACTOR = 'VerifySecondFactorTimeoutException';
const RETRY_COUNT = 5;

@Injectable({
  providedIn: 'root',
})
export class SecondFactorTransactionService {
  private readonly dialog = inject(DialogService);

  public showDialogAndExecuteVerifyAction<T>(action: () => Observable<T>, code: string, qrCode: string): Promise<void> {
    const data: SecondFactorTransactionDialogData = {
      code: code,
      qrCode: qrCode,
    };
    const dialogRef = this.dialog.open<SecondFactorTransactionDialogComponent>(SecondFactorTransactionDialogComponent, data);

    return new Promise<void>((resolve, reject) => {
      const subscription = action()
        .pipe(this.retryOnVerifyTimeout())
        .subscribe(
          () => {
            dialogRef.close();
            resolve();
          },
          err => {
            dialogRef.componentInstance.hasError = true;
            reject(err);
          },
        );

      dialogRef.afterClosed().subscribe(() => {
        subscription.unsubscribe();
        reject();
      });
    });
  }

  private retryOnVerifyTimeout<T>(): OperatorFunction<T, T> {
    return (src: Observable<T>) =>
      defer(() => {
        // retry on failure after timeout
        return src.pipe(
          retryWhen(errs =>
            errs.pipe(
              concatMap((err, index) => {
                // after timeout retry x times (see RETRY_COUNT)
                if (isErrorType(err, ERROR_TYPE_VERIFY_SECOND_FACTOR) && index < RETRY_COUNT) {
                  return of(null);
                }

                return throwError(err);
              }),
            ),
          ),
        );
      });
  }
}
