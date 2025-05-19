/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  Contest,
  CountingCircle,
  Event,
  ProtocolEventType,
  ProtocolEventTypes,
  ProtocolExport,
  ProtocolExportStateChangeEventDetails,
  ResultExportTemplate,
} from '../../models';
import { ExportService } from '../../services/export.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { ResultExportService } from '../../services/result-export.service';
import { BreadcrumbItem, BreadcrumbsService } from '../../services/breadcrumbs.service';
import { ProtocolExportState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/export_pb';
import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { TableDataSource } from '@abraxas/base-components';
import { HttpErrorResponse } from '@angular/common/http';
import { EventLogService } from '../../services/event-log.service';

enum Tabs {
  PROTOCOLS,
  DATA_FILES,
}

@Component({
  selector: 'vo-ausm-result-export',
  templateUrl: './result-export.component.html',
  styleUrls: ['./result-export.component.scss'],
  standalone: false,
})
export class ResultExportComponent implements OnInit, OnDestroy {
  private readonly defaultColumns = ['select', 'description', 'political-business'];
  private readonly dataExportColumns = [...this.defaultColumns, 'export'];
  private readonly protocolExportColumns = [...this.defaultColumns, 'generate', 'state', 'data-date', 'file-name', 'download-button'];

  public readonly protocolExportStates: typeof ProtocolExportState = ProtocolExportState;
  public readonly tabs: typeof Tabs = Tabs;

  public columns: string[] = this.protocolExportColumns;

  public selectedTab: Tabs = Tabs.PROTOCOLS;
  public loadingTemplates: boolean = true;
  public generatingExports: boolean = false;

  public breadcrumbs: BreadcrumbItem[] = [];

  public contest?: Contest;
  public countingCircle?: CountingCircle;
  public templates: TableDataSource<ResultExportTemplate> = new TableDataSource<ResultExportTemplate>();
  public selectedTemplates = new SelectionModel<ResultExportTemplate>(true, []);
  public allTemplatesSelected: boolean = false;

  private routeParamsSubscription: Subscription = Subscription.EMPTY;

  private contestId: string = '';
  private countingCircleId?: string;
  private watchSubscription?: Subscription;

  constructor(
    private readonly exportService: ExportService,
    private readonly resultExportService: ResultExportService,
    private readonly route: ActivatedRoute,
    private readonly breadcrumbsService: BreadcrumbsService,
    private readonly dialog: DialogService,
    private readonly i18n: TranslateService,
    private readonly datePipe: DatePipe,
    private readonly toast: SnackbarService,
    private readonly eventLogService: EventLogService,
  ) {}

  public async ngOnInit(): Promise<void> {
    this.routeParamsSubscription = this.route.params.subscribe(({ contestId, countingCircleId }) => {
      this.contestId = contestId;
      this.countingCircleId = countingCircleId;
      this.loadData();
    });
  }

  public ngOnDestroy(): void {
    this.routeParamsSubscription.unsubscribe();
    this.watchSubscription?.unsubscribe();
  }

  public async changeTab(tab: Tabs): Promise<void> {
    this.selectedTab = tab;

    this.columns = tab === Tabs.PROTOCOLS ? this.protocolExportColumns : this.dataExportColumns;

    await this.loadData();
  }

  public toggleTemplate(template: ResultExportTemplate, selected?: boolean): void {
    if (selected === this.selectedTemplates.isSelected(template)) {
      return;
    }

    this.selectedTemplates.toggle(template);
    this.updateAllTemplatesSelected();
  }

  public selectAllTemplates(selected: boolean) {
    if (selected === this.allTemplatesSelected) {
      return;
    }

    if (selected) {
      this.selectedTemplates.select(...this.templates.data);
    } else {
      this.selectedTemplates.clear();
    }

    this.updateAllTemplatesSelected();
  }

  public async generateSelected(): Promise<void> {
    if (await this.generateProtocolExports(this.selectedTemplates.selected)) {
      this.selectedTemplates.clear();
    }
  }

  public async exportSelected(): Promise<void> {
    if (this.selectedTab === Tabs.DATA_FILES) {
      await this.downloadDataExports(this.selectedTemplates.selected);
    } else {
      await this.downloadProtocolExports(this.selectedTemplates.selected as ProtocolExport[]);
    }

    this.selectedTemplates.clear();
  }

  public async downloadDataExports(templates: ResultExportTemplate[]): Promise<void> {
    this.generatingExports = true;
    try {
      await this.resultExportService.downloadExports(templates, this.contestId, this.countingCircleId);
    } catch (e: any) {
      if (e instanceof HttpErrorResponse && e.status === 0) {
        this.toast.error(this.i18n.instant('EXPORTS.DATA_EXPORT_FAILED'));
        return;
      }

      throw e;
    } finally {
      this.generatingExports = false;
    }
  }

  public async generateProtocolExports(templates: ResultExportTemplate[]): Promise<boolean> {
    if (!(await this.confirmGenerationIfNeeded(templates as ProtocolExport[]))) {
      return false;
    }

    this.generatingExports = true;
    try {
      await this.exportService.startProtocolExports(this.contestId, this.countingCircleId, templates);
    } finally {
      this.generatingExports = false;
    }

    return true;
  }

  public async downloadProtocolExports(protocolExports: ProtocolExport[]): Promise<void> {
    const generatedExports = protocolExports.filter(p => p.state === ProtocolExportState.PROTOCOL_EXPORT_STATE_COMPLETED);
    if (generatedExports.length !== protocolExports.length) {
      await this.dialog.alert('', 'EXPORTS.NOT_YET_GENERATED');
    }

    this.generatingExports = true;
    try {
      await this.resultExportService.downloadProtocolExports(generatedExports, this.contestId, this.countingCircleId);
    } finally {
      this.generatingExports = false;
    }
  }

  private async confirmGenerationIfNeeded(protocolExports: ProtocolExport[]): Promise<boolean> {
    if (
      protocolExports.every(
        p =>
          p.state !== ProtocolExportState.PROTOCOL_EXPORT_STATE_GENERATING &&
          p.state !== ProtocolExportState.PROTOCOL_EXPORT_STATE_COMPLETED,
      )
    ) {
      return true;
    }

    const i18nPrefix = 'EXPORTS.CONFIRM_GENERATE_AGAIN';
    let message = i18nPrefix + '.MESSAGE.MULTIPLE';
    if (protocolExports.length === 1) {
      const started = this.datePipe.transform(protocolExports[0].started, 'dd.MM.yyyy, HH:mm')!;
      message = this.i18n.instant(`${i18nPrefix}.MESSAGE.${protocolExports[0].state}`, { started });
    }
    return await this.dialog.confirm(`${i18nPrefix}.TITLE`, message, `${i18nPrefix}.CONFIRM`);
  }

  private async loadData(): Promise<void> {
    this.loadingTemplates = true;

    try {
      this.selectedTemplates.clear();
      this.allTemplatesSelected = false;

      const data =
        this.selectedTab === Tabs.PROTOCOLS
          ? await this.exportService.listProtocolExports(this.contestId, this.countingCircleId)
          : await this.exportService.listDataExportTemplates(this.contestId, this.countingCircleId);
      this.contest = data.contest;
      this.countingCircle = data.countingCircle;
      this.templates.data = data.templates;

      this.startStopProtocolExportStateChangeListener();
      this.updateBreadcrumbs();
    } finally {
      this.loadingTemplates = false;
    }
  }

  private startStopProtocolExportStateChangeListener(): void {
    this.watchSubscription?.unsubscribe();

    if (this.selectedTab !== Tabs.PROTOCOLS || !this.contestId) {
      delete this.watchSubscription;
      return;
    }

    this.watchSubscription = this.eventLogService
      .watch([...ProtocolEventTypes], { contestId: this.contestId, countingCircleId: this.countingCircleId })
      .subscribe(e => this.handleEvent(e));
  }

  private async handleEvent(e: Event<ProtocolEventType>): Promise<void> {
    switch (e.type) {
      case 'ProtocolExportStarted':
      case 'ProtocolExportCompleted':
      case 'ProtocolExportFailed':
        this.protocolExportStateChanged(e.timestamp, e.data.protocolExportStateChange!);
        break;
      case '_reconnectAttempt':
        await this.reloadAllStates();
        break;
    }
  }

  private async reloadAllStates(): Promise<void> {
    if (!this.watchSubscription) {
      return;
    }

    // When the export state change listener fails, it is being retried with an exponential backoff
    // During that retry backoff, changes aren't being delivered -> we need to poll for them
    const data = await this.exportService.listProtocolExports(this.contestId, this.countingCircleId);
    const templates = data.templates as ProtocolExport[];
    for (let template of templates) {
      const syntheticStateChange: ProtocolExportStateChangeEventDetails = {
        exportTemplateId: template.exportTemplateId,
        protocolExportId: template.protocolExportId,
        newState: template.state,
        fileName: template.fileName,
      };
      this.protocolExportStateChanged(template.started, syntheticStateChange);
    }
  }

  private protocolExportStateChanged(timestamp: Date, details: ProtocolExportStateChangeEventDetails): void {
    const matchingTemplate = this.templates.data.find(t => t.exportTemplateId === details.exportTemplateId) as ProtocolExport;
    if (!matchingTemplate) {
      return;
    }

    matchingTemplate.protocolExportId = details.protocolExportId;
    matchingTemplate.state = details.newState;
    matchingTemplate.fileName = details.fileName;
    if (details.newState === ProtocolExportState.PROTOCOL_EXPORT_STATE_GENERATING) {
      matchingTemplate.started = timestamp;
    }
  }

  private updateAllTemplatesSelected(): void {
    this.allTemplatesSelected = this.selectedTemplates.selected.length === this.templates.data.length;
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbs = this.breadcrumbsService.forExports();
  }
}
