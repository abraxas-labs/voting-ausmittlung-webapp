/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  Event as EventProto,
  ProtocolExportStateChangeEventDetails as ProtocolExportStateChangeEventDetailsProto,
  ResultImportCountingCircleCompletedEventDetails,
  WriteInsMappedEventDetails,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/event_log_pb';
import { WatchEventsRequestFilter } from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/event_log_requests_pb';
import { PoliticalBusinessResultBundleLog } from './ballot-bundle.model';
import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';

export { EventProto };

export type ProtocolExportStateChangeEventDetails = ProtocolExportStateChangeEventDetailsProto.AsObject;

export interface Event<T extends EventType = EventType> extends Omit<EventProto.AsObject, 'type' | 'data' | 'timestamp'> {
  type: T | '_reconnectAttempt';
  timestamp: Date;
  data: {
    bundleLog?: PoliticalBusinessResultBundleLog;
    countingCircleImportCompleted?: ResultImportCountingCircleCompletedEventDetails.AsObject;
    writeInsMapped?: WriteInsMappedEventDetails.AsObject;
    protocolExportStateChange?: ProtocolExportStateChangeEventDetails;
  };
}

export interface FilterParams extends Partial<Omit<WatchEventsRequestFilter.AsObject, 'id' | 'typesList'>> {
  contestId: string;
  countingCircleId?: string;
  skipCall?: boolean;
  dontFireOnReconnectAttempt?: boolean;
}

export interface ResultStateChangeEvent {
  event: Event<ResultStateEventType>;
  newState: CountingCircleResultState;
  isReconnect?: boolean;
}

export const ProtocolEventTypes = ['ProtocolExportStarted', 'ProtocolExportCompleted', 'ProtocolExportFailed'] as const;

export type ProtocolEventType = (typeof ProtocolEventTypes)[number];

export const VoteResultBundleEventTypes = [
  'VoteResultBundleCreated',
  'VoteResultBundleDeleted',
  'VoteResultBundleReviewSucceeded',
  'VoteResultBundleReviewRejected',
  'VoteResultBundleSubmissionFinished',
  'VoteResultBundleCorrectionFinished',
  'VoteResultBallotCreated',
  'VoteResultBallotUpdated',
  'VoteResultBallotDeleted',
] as const;

export type VoteResultBundleEventType = (typeof VoteResultBundleEventTypes)[number];

export const VoteEndResultEventTypes = [
  'VoteResultSubmissionFinished',
  'VoteResultCorrectionFinished',
  'VoteResultFlaggedForCorrection',
  'VoteResultResetted',
] as const;

export type VoteEndResultEventType = (typeof VoteEndResultEventTypes)[number];

export const VoteResultStateEventTypes = [
  'VoteResultSubmissionStarted',
  'VoteResultSubmissionFinished',
  'VoteResultCorrectionFinished',
  'VoteResultFlaggedForCorrection',
  'VoteResultAuditedTentatively',
  'VoteResultResettedToSubmissionFinished',
  'VoteResultPlausibilised',
  'VoteResultResettedToAuditedTentatively',
  'VoteResultResetted',
] as const;

export type VoteResultStateEventType = (typeof VoteResultStateEventTypes)[number];

export const VoteResultEventTypes = [
  'VoteResultEntryDefined',
  'VoteResultEntered',
  'VoteResultCorrectionEntered',
  'VoteResultCountOfVotersEntered',
  'VoteResultPublished',
  'VoteResultUnpublished',
] as const;

export type VoteResultEventType = (typeof VoteResultEventTypes)[number];

export type VoteEventType = VoteResultBundleEventType | VoteResultStateEventType | VoteResultEventType | VoteEndResultEventType;

export const ProportionalElectionResultBundleEventTypes = [
  'ProportionalElectionResultBundleCreated',
  'ProportionalElectionResultBundleDeleted',
  'ProportionalElectionResultBundleReviewSucceeded',
  'ProportionalElectionResultBundleReviewRejected',
  'ProportionalElectionResultBundleSubmissionFinished',
  'ProportionalElectionResultBundleCorrectionFinished',
  'ProportionalElectionResultBallotCreated',
  'ProportionalElectionResultBallotUpdated',
  'ProportionalElectionResultBallotDeleted',
] as const;

export type ProportionalElectionResultBundleEventType = (typeof ProportionalElectionResultBundleEventTypes)[number];

export const ProportionalElectionEndResultEventTypes = [
  'ProportionalElectionResultSubmissionFinished',
  'ProportionalElectionResultCorrectionFinished',
  'ProportionalElectionResultFlaggedForCorrection',
  'ProportionalElectionResultResetted',
  'ProportionalElectionEndResultMandateDistributionStarted',
  'ProportionalElectionEndResultMandateDistributionReverted',
] as const;

type ProportionalElectionEndResultEventType = (typeof ProportionalElectionEndResultEventTypes)[number];

export const ProportionalElectionResultStateEventTypes = [
  'ProportionalElectionResultSubmissionStarted',
  'ProportionalElectionResultSubmissionFinished',
  'ProportionalElectionResultCorrectionFinished',
  'ProportionalElectionResultFlaggedForCorrection',
  'ProportionalElectionResultAuditedTentatively',
  'ProportionalElectionResultResettedToSubmissionFinished',
  'ProportionalElectionResultPlausibilised',
  'ProportionalElectionResultResettedToAuditedTentatively',
  'ProportionalElectionResultResetted',
] as const;

export type ProportionalElectionResultStateEventType = (typeof ProportionalElectionResultStateEventTypes)[number];

export const ProportionalElectionResultEventTypes = [
  'ProportionalElectionResultEntryDefined',
  'ProportionalElectionResultCountOfVotersEntered',
  'ProportionalElectionUnmodifiedListResultsEntered',
  'ProportionalElectionResultPublished',
  'ProportionalElectionResultUnpublished',
] as const;

export type ProportionalElectionResultEventType = (typeof ProportionalElectionResultEventTypes)[number];

export type ProportionalElectionEventType =
  | ProportionalElectionResultBundleEventType
  | ProportionalElectionResultStateEventType
  | ProportionalElectionResultEventType
  | ProportionalElectionEndResultEventType;

export const MajorityElectionResultBundleEventTypes = [
  'MajorityElectionResultBundleCreated',
  'MajorityElectionResultBundleDeleted',
  'MajorityElectionResultBundleReviewSucceeded',
  'MajorityElectionResultBundleReviewRejected',
  'MajorityElectionResultBundleSubmissionFinished',
  'MajorityElectionResultBundleCorrectionFinished',
  'MajorityElectionResultBallotCreated',
  'MajorityElectionResultBallotUpdated',
  'MajorityElectionResultBallotDeleted',
] as const;

type MajorityElectionResultBundleEventType = (typeof MajorityElectionResultBundleEventTypes)[number];

export const MajorityElectionEndResultEventTypes = [
  'MajorityElectionResultSubmissionFinished',
  'MajorityElectionResultCorrectionFinished',
  'MajorityElectionResultFlaggedForCorrection',
  'MajorityElectionResultResetted',
  'MajorityElectionEndResultLotDecisionsUpdated',
  'MajorityElectionEndResultSecondaryLotDecisionsUpdated',
] as const;

type MajorityElectionEndResultEventType = (typeof MajorityElectionEndResultEventTypes)[number];

export const MajorityElectionResultStateEventTypes = [
  'MajorityElectionResultSubmissionStarted',
  'MajorityElectionResultSubmissionFinished',
  'MajorityElectionResultCorrectionFinished',
  'MajorityElectionResultFlaggedForCorrection',
  'MajorityElectionResultAuditedTentatively',
  'MajorityElectionResultResettedToSubmissionFinished',
  'MajorityElectionResultPlausibilised',
  'MajorityElectionResultResettedToAuditedTentatively',
  'MajorityElectionResultResetted',
] as const;

export type MajorityElectionResultStateEventType = (typeof MajorityElectionResultStateEventTypes)[number];

export const MajorityElectionResultEventTypes = [
  'MajorityElectionResultEntryDefined',
  'MajorityElectionResultCountOfVotersEntered',
  'MajorityElectionCandidateResultsEntered',
  'MajorityElectionBallotGroupResultsEntered',
  'MajorityElectionResultPublished',
  'MajorityElectionResultUnpublished',
] as const;

export type MajorityElectionResultEventType = (typeof MajorityElectionResultEventTypes)[number];

export const MajorityElectionWriteInEventTypes = [
  'MajorityElectionWriteInsMapped',
  'MajorityElectionWriteInsReset',
  'SecondaryMajorityElectionWriteInsMapped',
  'SecondaryMajorityElectionWriteInsReset',
] as const;

export type MajorityElectionWriteInEventType = (typeof MajorityElectionWriteInEventTypes)[number];

export type MajorityElectionEventType =
  | MajorityElectionResultBundleEventType
  | MajorityElectionResultStateEventType
  | MajorityElectionResultEventType
  | MajorityElectionWriteInEventType
  | MajorityElectionEndResultEventType;

export const ResultStateEventTypes = [
  ...VoteResultStateEventTypes,
  ...ProportionalElectionResultStateEventTypes,
  ...MajorityElectionResultStateEventTypes,
] as const;
export type ResultStateEventType = (typeof ResultStateEventTypes)[number];

type ImportEventType = 'ResultImportCountingCircleCompleted';

type MiscEventType = '_reconnectAttempt';

export const EventTypePrefix: string = 'abraxas.voting.ausmittlung.events.v1.';
export type EventType =
  | MiscEventType
  | ImportEventType
  | ProtocolEventType
  | VoteEventType
  | ProportionalElectionEventType
  | MajorityElectionEventType;
