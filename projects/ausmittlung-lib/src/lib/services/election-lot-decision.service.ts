/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ElectionEndResultAvailableLotDecisionSelectableRank } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ElectionLotDecisionService {
  constructor(private readonly i18n: TranslateService) {}

  public buildSelectableRank(selectableRanks: number[]): ElectionEndResultAvailableLotDecisionSelectableRank[] {
    // Bc dropdown does not work with null/undefined value. Workaround where rank 0 is "Pending".
    return [0, ...selectableRanks].map(r => ({
      value: r,
      description: !!r ? '' + r : this.i18n.instant('END_RESULT.ELECTION.LOT_DECISION.PENDING'),
    }));
  }
}
