/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  MajorityElectionContestWriteInMappings as MajorityElectionContestWriteInMappingsProto,
  MajorityElectionWriteInMapping as MajorityElectionWriteInMappingProto,
  MajorityElectionWriteInMappings as MajorityElectionWriteInMappingsProto,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/majority_election_write_in_pb';
import { ResultImport as ResultImportProto } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/results_pb';
import { MajorityElectionWriteInMappingTarget } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/majority_election_write_in_pb';
import { SimplePoliticalBusiness } from './political-business.model';
import { ResultImportType } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/import_pb';

export interface ResultImport extends Omit<ResultImportProto.AsObject, 'started'> {
  started: Date;
}

export {
  MajorityElectionWriteInMappingTarget,
  MajorityElectionContestWriteInMappingsProto,
  MajorityElectionWriteInMappingsProto,
  MajorityElectionWriteInMappingProto,
};

export interface MajorityElectionWriteInMappings {
  importId: string;
  importType: ResultImportType;
  election: SimplePoliticalBusiness;
  invalidVotes: boolean;
  individualVotes: boolean;
  writeInMappings: MajorityElectionWriteInMapping[];
}

export interface MajorityElectionWriteInMapping extends MajorityElectionWriteInMappingProto.AsObject {
  selected: boolean;
}
