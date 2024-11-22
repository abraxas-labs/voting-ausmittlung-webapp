/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

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
