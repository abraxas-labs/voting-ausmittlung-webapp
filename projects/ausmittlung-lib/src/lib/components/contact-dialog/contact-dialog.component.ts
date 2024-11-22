/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, HostListener, Inject, OnDestroy } from '@angular/core';
import { ContactPerson, CountingCircle, DomainOfInfluence, ResultList } from '../../models';
import { cloneDeep, isEqual } from 'lodash';
import { ContestCountingCircleContactPersonService } from '../../services/contest-counting-circle-contact-person.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { DialogService } from '@abraxas/voting-lib';
import { TranslateService } from '@ngx-translate/core';
import { distinct } from '../../services/utils/array.utils';

@Component({
  selector: 'vo-ausm-contact-dialog',
  templateUrl: './contact-dialog.component.html',
  styleUrls: ['./contact-dialog.component.scss'],
})
export class ContactDialogComponent implements OnDestroy {
  @HostListener('window:beforeunload')
  public beforeUnload(): boolean {
    return !this.hasChanges;
  }

  @HostListener('window:keyup.esc')
  public async keyUpEscape(): Promise<void> {
    if (this.showCancel) {
      await this.closeWithUnsavedChangesCheck();
    }
  }

  public readonly resultList: ResultList;
  public readonly countingCircle: CountingCircle;
  public readonly readonly: boolean;
  public readonly showCancel: boolean;
  public readonly tenantId: string;
  public saving: boolean = false;
  public hasChanges: boolean = false;
  public originalCountingCircle: CountingCircle;
  public domainOfInfluences: DomainOfInfluence[];

  public readonly backdropClickSubscription: Subscription;

  constructor(
    private readonly dialogRef: MatDialogRef<ContactDialogResult>,
    private readonly contactPersonService: ContestCountingCircleContactPersonService,
    private readonly dialogService: DialogService,
    private readonly i18n: TranslateService,
    @Inject(MAT_DIALOG_DATA) dialogData: ContactDialogComponentData,
  ) {
    this.domainOfInfluences = dialogData.domainOfInfluences;
    this.resultList = cloneDeep(dialogData.resultList);
    this.countingCircle = this.resultList.countingCircle;
    this.readonly = dialogData.readonly;
    this.showCancel = dialogData.showCancel;
    this.originalCountingCircle = cloneDeep(this.resultList.countingCircle);
    this.tenantId = dialogData.tenantId;

    this.filterDomainOfInfluences();

    this.dialogRef.disableClose = true;
    this.backdropClickSubscription = this.dialogRef.backdropClick().subscribe(async () => {
      if (this.showCancel) {
        await this.closeWithUnsavedChangesCheck();
      }
    });
  }

  public ngOnDestroy(): void {
    this.backdropClickSubscription.unsubscribe();
  }

  public async save(): Promise<void> {
    this.saving = true;

    try {
      if (!this.resultList.contestCountingCircleContactPersonId) {
        await this.createContactPerson();
      } else {
        await this.updateContactPerson();
      }

      this.resultList.mustUpdateContactPersons = false;
      const dialogResult: ContactDialogResult = {
        resultList: this.resultList,
      };
      this.dialogRef.close(dialogResult);
    } finally {
      this.saving = false;
    }
  }

  public cancel(): void {
    this.dialogRef.close();
  }

  public contentChanged(): void {
    this.hasChanges = !isEqual(this.countingCircle, this.originalCountingCircle);
  }

  public async closeWithUnsavedChangesCheck(): Promise<void> {
    if (await this.leaveDialogOpen()) {
      return;
    }

    this.dialogRef.close();
  }

  public setContactPersonSameDuringEventAsAfter(value: boolean): void {
    this.countingCircle.contactPersonSameDuringEventAsAfter = value;
    if (!value) {
      this.countingCircle.contactPersonAfterEvent = {} as ContactPerson;
    }

    this.contentChanged();
  }

  private async leaveDialogOpen(): Promise<boolean> {
    return this.hasChanges && !(await this.dialogService.confirm('APP.CHANGES.TITLE', this.i18n.instant('APP.CHANGES.MSG'), 'APP.YES'));
  }

  private async createContactPerson(): Promise<void> {
    this.resultList.contestCountingCircleContactPersonId = await this.contactPersonService.create(
      this.resultList.contest.id,
      this.resultList.countingCircle.id,
      this.countingCircle.contactPersonDuringEvent!,
      this.countingCircle.contactPersonSameDuringEventAsAfter,
      this.countingCircle.contactPersonSameDuringEventAsAfter ? undefined : this.countingCircle.contactPersonAfterEvent,
    );
  }

  private updateContactPerson(): Promise<void> {
    return this.contactPersonService.update(
      this.resultList.contestCountingCircleContactPersonId,
      this.countingCircle.contactPersonDuringEvent!,
      this.countingCircle.contactPersonSameDuringEventAsAfter,
      this.countingCircle.contactPersonSameDuringEventAsAfter ? undefined : this.countingCircle.contactPersonAfterEvent,
    );
  }

  private filterDomainOfInfluences(): void {
    this.domainOfInfluences = this.domainOfInfluences.filter(
      x =>
        x.secureConnectId !== this.tenantId &&
        (!!x.contactPerson?.firstName ||
          !!x.contactPerson?.familyName ||
          !!x.contactPerson?.phone ||
          !!x.contactPerson?.mobilePhone ||
          !!x.contactPerson?.email),
    );

    this.domainOfInfluences = distinct(this.domainOfInfluences, x => x.secureConnectId);
  }
}

export interface ContactDialogComponentData {
  domainOfInfluences: DomainOfInfluence[];
  resultList: ResultList;
  readonly: boolean;
  showCancel: boolean;
  tenantId: string;
}

export interface ContactDialogResult {
  resultList: ResultList;
}
