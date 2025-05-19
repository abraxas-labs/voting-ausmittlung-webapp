/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  DeleteECountingResultImportDataRequest,
  DeleteEVotingResultImportDataRequest,
  GetMajorityElectionWriteInMappingsRequest,
  ListECountingResultImportsRequest,
  ListEVotingResultImportsRequest,
  MapMajorityElectionWriteInRequest,
  MapMajorityElectionWriteInsRequest,
  ResetMajorityElectionWriteInMappingsRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/result_import_requests_pb';
import { ResultImportServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/result_import_service_grpc_web_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcService } from '@abraxas/voting-lib';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { MajorityElectionWriteInMappings, PoliticalBusinessType, ResultImport } from '../models';
import { MajorityElectionWriteInMappingsProto, MajorityElectionWriteInMappingTarget } from '../models/result-import.model';
import { PoliticalBusinessService } from './political-business.service';
import { GRPC_ENV_INJECTION_TOKEN, REST_API_URL_INJECTION_TOKEN } from './tokens';
import { firstValueFrom } from 'rxjs';
import { ResultImportType } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/import_pb';

@Injectable({
  providedIn: 'root',
})
export class ResultImportService extends GrpcService<ResultImportServicePromiseClient> {
  private readonly apiUrl: string = '';

  constructor(
    private readonly http: HttpClient,
    @Inject(REST_API_URL_INJECTION_TOKEN) restApiUrl: string,
    grpcBackend: GrpcBackendService,
    @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment,
  ) {
    super(ResultImportServicePromiseClient, env ?? { production: false, grpcApiEndpoint: 'http://localhost:5100' }, grpcBackend);
    this.apiUrl = `${restApiUrl ?? 'http://localhost:5100/api'}/result_import/`;
  }

  public async import(
    importType: ResultImportType,
    contestId: string,
    countingCircleId: string | undefined,
    eCH0222File: File,
    eCH0110File?: File,
  ): Promise<void> {
    const data = new FormData();
    data.append('ech0222File', eCH0222File, eCH0222File.name);

    if (eCH0110File) {
      data.append('ech0110File', eCH0110File, eCH0110File.name);
    }

    const path = (
      {
        [ResultImportType.RESULT_IMPORT_TYPE_EVOTING]: `e-voting/${contestId}`,
        [ResultImportType.RESULT_IMPORT_TYPE_ECOUNTING]: `e-counting/${contestId}/${countingCircleId}`,
      } as Partial<Record<ResultImportType, string>>
    )[importType];
    await firstValueFrom(this.http.post(this.apiUrl + path, data));
  }

  public listImportedResultFiles(importType: ResultImportType, contestId: string, countingCircleId?: string): Promise<ResultImport[]> {
    switch (importType) {
      case ResultImportType.RESULT_IMPORT_TYPE_EVOTING:
        return this.listImportedEVotingResultFiles(contestId);
      case ResultImportType.RESULT_IMPORT_TYPE_ECOUNTING:
        return this.listImportedECountingResultFiles(contestId, countingCircleId!);
      default:
        throw new Error('unknown import type ' + importType);
    }
  }

  public listImportedECountingResultFiles(contestId: string, countingCircleId: string): Promise<ResultImport[]> {
    const req = new ListECountingResultImportsRequest();
    req.setContestId(contestId);
    req.setCountingCircleId(countingCircleId);
    return this.request(
      c => c.listECountingImports,
      req,
      r =>
        r.getImportsList().map(x => ({
          ...x.toObject(),
          started: x.getStarted()!.toDate(),
        })),
    );
  }

  public listImportedEVotingResultFiles(contestId: string): Promise<ResultImport[]> {
    const req = new ListEVotingResultImportsRequest();
    req.setContestId(contestId);
    return this.request(
      c => c.listEVotingImports,
      req,
      r =>
        r.getImportsList().map(x => ({
          ...x.toObject(),
          started: x.getStarted()!.toDate(),
        })),
    );
  }

  public async deleteResultImportData(importType: ResultImportType, contestId: string, countingCircleId?: string): Promise<void> {
    switch (importType) {
      case ResultImportType.RESULT_IMPORT_TYPE_EVOTING:
        await this.deleteEVotingResultImportData(contestId);
        break;
      case ResultImportType.RESULT_IMPORT_TYPE_ECOUNTING:
        await this.deleteECountingResultImportData(contestId, countingCircleId!);
        break;
      default:
        throw new Error('unknown import type ' + importType);
    }
  }

  public deleteEVotingResultImportData(contestId: string): Promise<void> {
    const req = new DeleteEVotingResultImportDataRequest();
    req.setContestId(contestId);
    return this.requestEmptyResp(c => c.deleteEVotingImportData, req);
  }

  public deleteECountingResultImportData(contestId: string, countingCircleId: string): Promise<void> {
    const req = new DeleteECountingResultImportDataRequest();
    req.setContestId(contestId);
    req.setCountingCircleId(countingCircleId);
    return this.requestEmptyResp(c => c.deleteECountingImportData, req);
  }

  public async mapMajorityElectionWriteIns(mappings: MajorityElectionWriteInMappings, countingCircleId: string): Promise<void> {
    const req = new MapMajorityElectionWriteInsRequest();
    req.setImportId(mappings.importId);
    req.setElectionId(mappings.election.id);
    req.setPoliticalBusinessType(mappings.election.businessType);
    req.setCountingCircleId(countingCircleId);
    req.setMappingsList(
      mappings.writeInMappings.map(m => {
        const protoMapping = new MapMajorityElectionWriteInRequest();
        protoMapping.setWriteInId(m.id);
        protoMapping.setTarget(m.target);

        if (m.target === MajorityElectionWriteInMappingTarget.MAJORITY_ELECTION_WRITE_IN_MAPPING_TARGET_CANDIDATE) {
          protoMapping.setCandidateId(m.candidateId);
        }

        return protoMapping;
      }),
    );
    await this.requestEmptyResp(c => c.mapMajorityElectionWriteIns, req);
  }

  public async getMajorityElectionWriteInMappings(
    contestId: string,
    countingCircleId: string,
    electionId?: string,
    importType?: ResultImportType,
  ): Promise<MajorityElectionWriteInMappings[]> {
    const req = new GetMajorityElectionWriteInMappingsRequest();
    req.setCountingCircleId(countingCircleId);
    req.setContestId(contestId);

    if (importType !== undefined) {
      req.setImportType(importType);
    }

    if (electionId) {
      req.setElectionId(electionId);
    }

    const resp = await this.request(
      c => c.getMajorityElectionWriteInMappings,
      req,
      res => res,
    );

    return resp.getWriteInMappingsList().map(x => this.mapMajorityElectionWriteIn(x));
  }

  public async resetMajorityElectionWriteIns(
    importId: string,
    electionId: string,
    countingCircleId: string,
    pbType: PoliticalBusinessType,
  ): Promise<void> {
    const req = new ResetMajorityElectionWriteInMappingsRequest();
    req.setImportId(importId);
    req.setCountingCircleId(countingCircleId);
    req.setElectionId(electionId);
    req.setPoliticalBusinessType(pbType);
    await this.requestEmptyResp(c => c.resetMajorityElectionWriteIns, req);
  }

  private mapMajorityElectionWriteIn(proto: MajorityElectionWriteInMappingsProto): MajorityElectionWriteInMappings {
    const obj = proto.toObject();
    return {
      importId: obj.importId,
      importType: obj.importType,
      election: PoliticalBusinessService.mapToPoliticalBusiness(proto.getElection()!),
      invalidVotes: obj.invalidVotes,
      individualVotes: obj.individualVotes,
      writeInMappings: obj.writeInMappingsList.map(writeIn => ({
        ...writeIn,
        selected: false,
      })),
    };
  }
}
