/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ExpansionPanelComponent } from '@abraxas/base-components';
import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';
import { DialogService } from '@abraxas/voting-lib';
import { ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ContestCantonDefaults, ContestCountingCircleDetails, PoliticalBusinessType, ResultListResult } from '../../../models';
import { CommentsDialogComponent, CommentsDialogComponentData } from '../../comments-dialog/comments-dialog.component';
import {
  ContactPersonDialogComponent,
  ContactPersonDialogComponentData,
} from '../../contact-person-dialog/contact-person-dialog.component';

@Component({
  selector: 'vo-ausm-contest-political-business-detail',
  templateUrl: './contest-political-business-detail.component.html',
  styleUrls: ['./contest-political-business-detail.component.scss'],
  standalone: false,
})
export class ContestPoliticalBusinessDetailComponent {
  public readonly politicalBusinessType: typeof PoliticalBusinessType = PoliticalBusinessType;

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

  constructor(
    private readonly dialog: DialogService,
    private readonly cd: ChangeDetectorRef,
  ) {}

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
}
