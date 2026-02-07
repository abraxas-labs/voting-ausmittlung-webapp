/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';
import {
  PoliticalBusinessResultBundleLog as PoliticalBusinessResultBundleLogProto,
  PoliticalBusinessResultBallotLog as PoliticalBusinessResultBallotLogProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_result_bundle_pb';
import { User } from './user.model';
import { ProtocolExport } from './export.model';

export { BallotBundleState };
export { PoliticalBusinessResultBundleLogProto };
export { PoliticalBusinessResultBallotLogProto };

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
  countOfModifiedBallots: number;
  createdBy: User;
  reviewedBy?: User;
  ballotNumbers: number[];
  ballotNumbersToReview: number[];
  protocolExport?: ProtocolExport;
  logs: PoliticalBusinessResultBundleLog[];
}

export interface PoliticalBusinessResultBallot {
  number: number;
  isNew: boolean;
  logs: PoliticalBusinessResultBallotLog[];
}

export interface PoliticalBusinessResultBundleLog {
  user: User;
  timestamp: Date;
  state: BallotBundleState;
}

export interface PoliticalBusinessResultBallotLog {
  user: User;
  timestamp: Date;
}
