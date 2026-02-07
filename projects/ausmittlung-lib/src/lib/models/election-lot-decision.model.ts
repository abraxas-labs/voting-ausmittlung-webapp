/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ElectionLotDecisionState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/election_lot_decision_pb';

export { ElectionLotDecisionState };

export interface ElectionEndResultAvailableLotDecision {
  selectedRank?: number;
  voteCount: number;
  lotDecisionRequired: boolean;
  selectableRanks: ElectionEndResultAvailableLotDecisionSelectableRank[];
  originalRank: number;
}

export interface ElectionEndResultAvailableLotDecisionSelectableRank {
  value: number;
  description: string;
}
