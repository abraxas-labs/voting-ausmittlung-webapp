/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Pipe, PipeTransform, inject } from '@angular/core';
import { PoliticalBusinessResultBundleLog } from '../models';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'politicalBusinessResultBundleLogs',
  standalone: false,
})
export class PoliticalBusinessResultBundleLogsPipe implements PipeTransform {
  private readonly i18n = inject(TranslateService);
  private readonly datePipe = inject(DatePipe);

  public transform(logs: PoliticalBusinessResultBundleLog[]): string {
    return logs
      .map(x =>
        this.i18n.instant('ELECTION.BUNDLE_LOG_ENTRY', {
          state: this.i18n.instant('ELECTION.BUNDLE_STATES.' + x.state),
          timestamp: this.datePipe.transform(x.timestamp, 'HH:mm'),
          user: x.user.fullName,
        }),
      )
      .join('\n');
  }
}
