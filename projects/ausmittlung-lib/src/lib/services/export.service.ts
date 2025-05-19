/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ExportServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/export_service_grpc_web_pb';
import {
  ListDataExportTemplatesRequest,
  ListProtocolExportsRequest,
  ListResultExportConfigurationsRequest,
  StartBundleReviewExportRequest,
  StartProtocolExportsRequest,
  TriggerResultExportRequest,
  UpdatePoliticalBusinessExportMetadataRequest,
  UpdateResultExportConfigurationRequest,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/export_requests_pb';
import { GrpcBackendService, GrpcEnvironment, GrpcService } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import { Int32Value } from 'google-protobuf/google/protobuf/wrappers_pb';
import { PoliticalBusinessExportMetadata, ResultExportConfiguration, ResultExportTemplate, ResultExportTemplateContainer } from '../models';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';
import { DataExportTemplates, ProtocolExports } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/export_pb';
import { ContestService } from './contest.service';
import { PoliticalBusinessType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/political_business_pb';

@Injectable({
  providedIn: 'root',
})
export class ExportService extends GrpcService<ExportServicePromiseClient> {
  constructor(grpcBackend: GrpcBackendService, @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment) {
    super(ExportServicePromiseClient, env, grpcBackend);
  }

  public listDataExportTemplates(contestId: string, countingCircleId: string | undefined): Promise<ResultExportTemplateContainer> {
    const req = new ListDataExportTemplatesRequest();
    req.setContestId(contestId);

    if (countingCircleId !== undefined) {
      req.setCountingCircleId(countingCircleId);
    }

    return this.request(
      c => c.listDataExportTemplates,
      req,
      r => this.mapDataExportsToResultExportTemplatesContainer(r),
    );
  }

  public listProtocolExports(contestId: string, countingCircleId: string | undefined): Promise<ResultExportTemplateContainer> {
    const req = new ListProtocolExportsRequest();
    req.setContestId(contestId);

    if (countingCircleId !== undefined) {
      req.setCountingCircleId(countingCircleId);
    }

    return this.request(
      c => c.listProtocolExports,
      req,
      r => this.mapProtocolExportsToResultExportTemplatesContainer(r),
    );
  }

  public startProtocolExports(contestId: string, countingCircleId: string | undefined, exports: ResultExportTemplate[]): Promise<void> {
    const req = new StartProtocolExportsRequest();
    req.setContestId(contestId);

    if (countingCircleId !== undefined) {
      req.setCountingCircleId(countingCircleId);
    }

    req.setExportTemplateIdsList(exports.map(e => e.exportTemplateId));

    return this.requestEmptyResp(c => c.startProtocolExports, req);
  }

  public listResultExportConfigurations(contestId: string): Promise<ResultExportConfiguration[]> {
    const req = new ListResultExportConfigurationsRequest();
    req.setContestId(contestId);
    return this.request(
      c => c.listResultExportConfigurations,
      req,
      r =>
        r.getConfigurationsList().map(x => ({
          ...x.toObject(),
          intervalMinutes: x.getIntervalMinutes()?.getValue(),
          politicalBusinessMetadata: this.mapToMetadataMap(x.toObject().politicalBusinessMetadataMap),
          latestExecution: x.getLatestExecution()?.toDate(),
        })),
    );
  }

  public updateResultExportConfigurations(config: ResultExportConfiguration): Promise<void> {
    const req = new UpdateResultExportConfigurationRequest();
    req.setContestId(config.contestId);
    req.setExportConfigurationId(config.exportConfigurationId);
    req.setPoliticalBusinessIdsList(config.politicalBusinessIdsList);

    const reqMetadataMap = req.getPoliticalBusinessMetadataMap();
    for (const metadataEntry of config.politicalBusinessMetadata) {
      reqMetadataMap.set(metadataEntry[0], this.mapToUpdateMetadataRequest(metadataEntry[1]));
    }

    if (config.intervalMinutes !== undefined) {
      const intervalMinutes = new Int32Value();
      intervalMinutes.setValue(config.intervalMinutes);
      req.setIntervalMinutes(intervalMinutes);
    }

    return this.requestEmptyResp(c => c.updateResultExportConfiguration, req);
  }

  public triggerResultExportConfigurations(
    contestId: string,
    exportConfigurationId: string,
    politicalBusinessIds: string[],
    politicalBusinessMetadata: Map<string, PoliticalBusinessExportMetadata>,
  ): Promise<void> {
    const req = new TriggerResultExportRequest();
    req.setContestId(contestId);
    req.setExportConfigurationId(exportConfigurationId);
    req.setPoliticalBusinessIdsList(politicalBusinessIds);

    const reqMetadataMap = req.getPoliticalBusinessMetadataMap();
    for (const metadataEntry of politicalBusinessMetadata) {
      reqMetadataMap.set(metadataEntry[0], this.mapToUpdateMetadataRequest(metadataEntry[1]));
    }

    return this.requestEmptyResp(x => x.triggerResultExport, req);
  }

  public startBundleReviewExport(politicalBusinessResultBundleId: string, politicalBusinessType: PoliticalBusinessType): Promise<string> {
    const req = new StartBundleReviewExportRequest();
    req.setPoliticalBusinessResultBundleId(politicalBusinessResultBundleId);
    req.setPoliticalBusinessType(politicalBusinessType);

    return this.request(
      c => c.startBundleReviewExport,
      req,
      r => r.getProtocolExportId(),
    );
  }

  private mapToMetadataMap(metadata: [string, PoliticalBusinessExportMetadata][]): Map<string, PoliticalBusinessExportMetadata> {
    const map = new Map<string, PoliticalBusinessExportMetadata>();
    for (const entry of metadata) {
      map.set(entry[0], entry[1]);
    }

    return map;
  }

  private mapToUpdateMetadataRequest(metadata: PoliticalBusinessExportMetadata): UpdatePoliticalBusinessExportMetadataRequest {
    const req = new UpdatePoliticalBusinessExportMetadataRequest();
    req.setToken(metadata.token);
    return req;
  }

  private mapDataExportsToResultExportTemplatesContainer(r: DataExportTemplates): ResultExportTemplateContainer {
    const obj = r.toObject();
    return {
      templates: obj.templatesList,
      contest: ContestService.mapToContest(r.getContest()!),
      countingCircle: obj.countingCircle,
    };
  }

  private mapProtocolExportsToResultExportTemplatesContainer(exports: ProtocolExports): ResultExportTemplateContainer {
    return {
      templates: exports.getProtocolExportsList().map(x => ({
        ...x.toObject(),
        started: x.getStarted()?.toDate(),
      })),
      contest: ContestService.mapToContest(exports.getContest()!),
      countingCircle: exports.getCountingCircle()?.toObject(),
    };
  }
}
