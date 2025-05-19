/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { FileDownloadService } from '@abraxas/voting-lib';
import { Inject, Injectable } from '@angular/core';
import { FetchProtocolExportsRequest, GenerateResultExportsRequest, ProtocolExport, ResultExportTemplate } from '../models';
import { REST_API_URL_INJECTION_TOKEN } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class ResultExportService {
  private readonly apiUrl: string = '';

  constructor(
    private readonly fileDownloadService: FileDownloadService,
    @Inject(REST_API_URL_INJECTION_TOKEN) restApiUrl: string,
  ) {
    this.apiUrl = `${restApiUrl}/result_export`;
  }

  public async downloadExports(
    resultExportTemplates: ResultExportTemplate[],
    contestId: string,
    countingCircleId: string | undefined,
  ): Promise<void> {
    const req: GenerateResultExportsRequest = {
      contestId,
      countingCircleId,
      exportTemplateIds: resultExportTemplates.map(e => e.exportTemplateId),
    };
    return await this.fileDownloadService.postDownloadFile(this.apiUrl, req);
  }

  public async downloadProtocolExports(
    resultExportTemplates: ProtocolExport[],
    contestId: string,
    countingCircleId: string | undefined,
  ): Promise<void> {
    const req: FetchProtocolExportsRequest = {
      contestId,
      countingCircleId,
      protocolExportIds: resultExportTemplates.map(t => t.protocolExportId),
    };
    return await this.fileDownloadService.postDownloadFile(`${this.apiUrl}/protocol_exports`, req);
  }

  public async downloadResultBundleReviewExport(
    protocolExportId: string,
    contestId: string,
    countingCircleId: string | undefined,
  ): Promise<void> {
    const req: FetchProtocolExportsRequest = {
      contestId,
      countingCircleId,
      protocolExportIds: [protocolExportId],
    };
    return await this.fileDownloadService.postDownloadFile(`${this.apiUrl}/bundle_review`, req);
  }
}
