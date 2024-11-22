/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService } from '@abraxas/voting-lib';
import { ElectionEndResultAvailableLotDecision, groupBy } from 'ausmittlung-lib';

export abstract class ElectionLotDecisionDialogComponent<
  T extends ElectionEndResultAvailableLotDecision = ElectionEndResultAvailableLotDecision,
> {
  protected constructor(protected readonly dialog: DialogService) {}

  protected hasOpenRequiredLotDecisions(lotDecisions: T[]): boolean {
    return lotDecisions.some(lotDecision => !lotDecision.selectedRank && lotDecision.lotDecisionRequired);
  }

  protected hasUniqueLotDecisions(lotDecisions: T[]): boolean {
    const ranks: Set<number> = new Set<number>();

    for (const lotDecision of lotDecisions) {
      if (!lotDecision.selectedRank) {
        continue;
      }

      if (ranks.has(lotDecision.selectedRank)) {
        return false;
      }
      ranks.add(lotDecision.selectedRank);
    }
    return true;
  }

  protected hasValidVoteCountGroups(lotDecisions: T[]): boolean {
    const lotDecisionsByVoteCount = groupBy(
      lotDecisions,
      l => l.voteCount,
      l => l.selectedRank,
    );

    for (const [_, selectedRanks] of Object.entries(lotDecisionsByVoteCount)) {
      if (!selectedRanks.every(r => !!r) && !selectedRanks.every(r => !r)) {
        return false;
      }
    }

    return true;
  }

  protected alertVoteCountGroupConflict(): void {
    this.dialog.alert(
      'END_RESULT.ELECTION.LOT_DECISION.VOTE_COUNT_GROUP_CONFLICT.TITLE',
      'END_RESULT.ELECTION.LOT_DECISION.VOTE_COUNT_GROUP_CONFLICT.MSG',
      'COMMON.CANCEL',
    );
  }

  protected alertDuplicateLotDecisions(): void {
    this.dialog.alert(
      'END_RESULT.ELECTION.LOT_DECISION.DUPLICATE_RANK.TITLE',
      'END_RESULT.ELECTION.LOT_DECISION.DUPLICATE_RANK.MSG',
      'COMMON.CANCEL',
    );
  }
}
