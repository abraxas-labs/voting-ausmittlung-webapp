/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';
import { PoliticalBusinessResultBundleLog as PoliticalBusinessResultBundleLogProto } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_result_bundle_pb';
import { User } from './user.model';
import { ProtocolExport } from './export.model';
import { BallotResult, VoteResult } from './vote-result.model';

export { BallotBundleState };
export { PoliticalBusinessResultBundleLogProto };

export enum ReviewState {
  NOT_REVIEWED = 'notReviewed',
  OK = 'ok',
  FIXED = 'fixed',
}

export interface BallotReview {
  ballotNumber: number;
  state: ReviewState;
}

export interface PoliticalBusinessResultBundles<TBundle extends PoliticalBusinessResultBundle = PoliticalBusinessResultBundle> {
  bundles: TBundle[];
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
  logs: PoliticalBusinessResultBundleLog[];
}

export interface PoliticalBusinessResultBallot {
  number: number;
  isNew: boolean;
}

export interface PoliticalBusinessResultBundleLog {
  user: User;
  timestamp: Date;
  state: BallotBundleState;
}
