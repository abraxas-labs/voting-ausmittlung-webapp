/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Pipe, PipeTransform } from '@angular/core';
import { PoliticalBusinessResultBundleLog } from '../models';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'politicalBusinessResultBundleLogs',
  standalone: false,
})
export class PoliticalBusinessResultBundleLogsPipe implements PipeTransform {
  constructor(
    private readonly i18n: TranslateService,
    private readonly datePipe: DatePipe,
  ) {}

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
