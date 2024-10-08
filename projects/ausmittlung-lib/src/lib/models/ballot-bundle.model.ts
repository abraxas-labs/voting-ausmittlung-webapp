/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';
import { User } from './user.model';
import { ProtocolExport } from './export.model';

export { BallotBundleState };

export enum ReviewState {
  NOT_REVIEWED = 'notReviewed',
  OK = 'ok',
  FIXED = 'fixed',
}

export interface BallotReview {
  ballotNumber: number;
  state: ReviewState;
}

export interface PoliticalBusinessResultBundle {
  id: string;
  number: number;
  state: BallotBundleState;
  countOfBallots: number;
  createdBy: User;
  reviewedBy?: User;
  ballotNumbersToReview: number[];
  protocolExport?: ProtocolExport;
}

export interface PoliticalBusinessResultBallot {
  number: number;
  isNew: boolean;
}
