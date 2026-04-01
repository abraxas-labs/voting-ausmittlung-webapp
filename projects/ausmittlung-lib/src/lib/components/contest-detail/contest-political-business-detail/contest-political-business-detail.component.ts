/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ExpansionPanelComponent } from '@abraxas/base-components';
import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';
import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { ChangeDetectorRef, Component, Input, ViewChild, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ContestCantonDefaults, ContestCountingCircleDetails, PoliticalBusinessType, ResultListResult } from '../../../models';
import { CommentsDialogComponent, CommentsDialogComponentData } from '../../comments-dialog/comments-dialog.component';
import {
  ContactPersonDialogComponent,
  ContactPersonDialogComponentData,
} from '../../contact-person-dialog/contact-person-dialog.component';
import { ResultImportService } from '../../../services/result-import.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'vo-ausm-contest-political-business-detail',
  templateUrl: './contest-political-business-detail.component.html',
  styleUrls: ['./contest-political-business-detail.component.scss'],
  standalone: false,
})
export class ContestPoliticalBusinessDetailComponent {
  private readonly dialog = inject(DialogService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly resultImportService = inject(ResultImportService);
  private readonly toast = inject(SnackbarService);
  private readonly i18n = inject(TranslateService);

  public readonly politicalBusinessType: typeof PoliticalBusinessType = PoliticalBusinessType;
  public isDeletingECountingImportData: boolean = false;

  @Input()
  public result!: ResultListResult;

  @Input()
  public contentReadonly: boolean = true;

  @Input()
  public contestLocked: boolean = true;

  @Input()
  public isResponsibleMonitorAuthority: boolean = false;

  @Input()
  public contestCountingCircleDetails!: ContestCountingCircleDetails;

  @Input()
  public contestCantonDefaults?: ContestCantonDefaults;

  @ViewChild(ExpansionPanelComponent, { static: true })
  public expansionPanel!: ExpansionPanelComponent;

  public readonly states: typeof CountingCircleResultState = CountingCircleResultState;

  private readonly countingCircleDetailsUpdatedSubject: Subject<ContestCountingCircleDetails> = new Subject<ContestCountingCircleDetails>();

  private readonly expandedSubject: Subject<boolean> = new Subject<boolean>();
  private readonly eCountingImportDeletedSubject: Subject<void> = new Subject<void>();

  public set expanded(x: boolean) {
    this.expansionPanel.expanded = x;
    this.expandedSubject.next(x);
  }

  public get expanded(): boolean {
    return this.expansionPanel.expanded;
  }

  public get expanded$(): Observable<boolean> {
    return this.expandedSubject.asObservable();
  }

  public get eCountingImportDeleted$(): Observable<void> {
    return this.eCountingImportDeletedSubject.asObservable();
  }

  public get countingCircleDetailsUpdated$(): Observable<ContestCountingCircleDetails> {
    return this.countingCircleDetailsUpdatedSubject.asObservable();
  }

  public expandedChanged(expanded: boolean): void {
    // bc does not update its internal state after a click on the nested panel
    this.expansionPanel.expanded = expanded;

    // detect changes to make sure that all components are visible
    this.cd.detectChanges();
    this.expandedSubject.next(expanded);
  }

  public countingCircleDetailsUpdated(values: ContestCountingCircleDetails): void {
    this.countingCircleDetailsUpdatedSubject.next(values);
  }

  public openComments(): void {
    const data: CommentsDialogComponentData = {
      resultId: this.result.id,
    };
    this.dialog.open(CommentsDialogComponent, data);
  }

  public openContactPerson(): void {
    if (!this.result.politicalBusiness.domainOfInfluence?.contactPerson) {
      return;
    }

    const data: ContactPersonDialogComponentData = {
      domainOfInfluences: [this.result.politicalBusiness.domainOfInfluence],
    };
    this.dialog.open(ContactPersonDialogComponent, data);
  }

  public async deleteECountingImportData(): Promise<void> {
    this.isDeletingECountingImportData = true;

    try {
      await this.resultImportService.deleteECountingPoliticalBusinessResultImportData(
        this.contestCountingCircleDetails.contestId,
        this.contestCountingCircleDetails.countingCircleId,
        this.result.politicalBusiness.id,
      );
      this.toast.success(this.i18n.instant('APP.DELETED'));
      this.result.eCountingImported = false;
      this.eCountingImportDeletedSubject.next();
    } finally {
      this.isDeletingECountingImportData = false;
    }
  }
}
