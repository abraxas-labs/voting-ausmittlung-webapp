/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Inject } from '@angular/core';
import { CountingCircleElectorate } from '../../models';
import { TranslateService } from '@ngx-translate/core';
import { flatten } from '../../../public-api';
import {
  ContestCountingCircleElectorateAssignDialogComponent,
  ContestCountingCircleElectorateAssignDialogData,
  ContestCountingCircleElectorateAssignDialogResult,
} from '../contest-counting-circle-electorate-assign-dialog/contest-counting-circle-electorate-assign-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogResult, DialogService, SnackbarService } from '@abraxas/voting-lib';
import { ContestCountingCircleElectorateService } from '../../services/contest-counting-circle-electorate.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-contest-counting-circle-electorates-update-dialog',
  templateUrl: './contest-counting-circle-electorates-update-dialog.component.html',
  styleUrls: ['./contest-counting-circle-electorates-update-dialog.component.scss'],
  standalone: false,
})
export class ContestCountingCircleElectoratesUpdateDialogComponent {
  private readonly contestId: string;
  private readonly countingCircleId: string;

  public electorates: CountingCircleElectorate[] = [];
  public electorateLabelByIndex: Map<number, string> = new Map<number, string>();
  public readonly = false;
  public saving = false;

  constructor(
    private readonly i18n: TranslateService,
    private readonly dialogService: DialogService,
    private readonly toast: SnackbarService,
    private readonly contestCountingCircleElectorateService: ContestCountingCircleElectorateService,
    private readonly dialogRef: MatDialogRef<ContestCountingCircleElectoratesUpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) dialogData: ContestCountingCircleElectoratesUpdateDialogData,
  ) {
    this.contestId = dialogData.contestId;
    this.countingCircleId = dialogData.countingCircleId;

    this.electorates = dialogData.electorates.map(e => ({ domainOfInfluenceTypesList: [...e.domainOfInfluenceTypesList] }));
    this.readonly = dialogData.readonly;
    this.updateElectorateLabels();
  }

  public async assign(electorate: CountingCircleElectorate): Promise<void> {
    const alreadyAssignedDoiTypes = flatten(this.electorates.filter(e => e !== electorate).map(e => e.domainOfInfluenceTypesList));

    const data: ContestCountingCircleElectorateAssignDialogData = {
      assignedDomainOfInfluenceTypes: electorate.domainOfInfluenceTypesList,
      disabledDomainOfInfluenceTypes: alreadyAssignedDoiTypes,
    };
    const result = await this.dialogService.openForResult<
      ContestCountingCircleElectorateAssignDialogComponent,
      ContestCountingCircleElectorateAssignDialogResult
    >(ContestCountingCircleElectorateAssignDialogComponent, data);

    if (!result) {
      return;
    }

    electorate.domainOfInfluenceTypesList = result.assignedDomainOfInfluenceTypes;
    this.updateElectorateLabels();
  }

  public get canSave(): boolean {
    return this.electorates.length > 0 && this.electorates.every(e => e.domainOfInfluenceTypesList.length > 0);
  }

  public remove(index: number): void {
    const updatedElectorates = [...this.electorates];
    updatedElectorates.splice(index, 1);
    this.electorates = updatedElectorates;
    this.updateElectorateLabels();
  }

  public add(): void {
    this.electorates = [
      ...this.electorates,
      {
        domainOfInfluenceTypesList: [],
      },
    ];
    this.updateElectorateLabels();
  }

  public async save(): Promise<void> {
    if (!(await this.confirmDetailsReset())) {
      return;
    }

    this.saving = true;

    try {
      this.contestCountingCircleElectorateService.updateElectorates(this.electorates, this.contestId, this.countingCircleId);
      this.toast.success(this.i18n.instant('APP.SAVED'));

      const result: ContestCountingCircleElectoratesUpdateDialogResult = {
        electorates: this.electorates,
      };

      this.dialogRef.close(result);
    } finally {
      this.saving = false;
    }
  }

  private async confirmDetailsReset(): Promise<boolean> {
    const data: ConfirmDialogData = {
      title: 'CONTEST.DETAIL.ELECTORATE.CONFIRM_DETAILS_RESET.TITLE',
      message: this.i18n.instant('CONTEST.DETAIL.ELECTORATE.CONFIRM_DETAILS_RESET.MESSAGE'),
      showCancel: true,
    };

    const result = await this.dialogService.openForResult<ConfirmDialogComponent, ConfirmDialogResult | undefined>(
      ConfirmDialogComponent,
      data,
    );

    return !!result && result.confirmed;
  }

  public cancel(): void {
    this.dialogRef.close();
  }

  private updateElectorateLabels(): void {
    this.electorateLabelByIndex = new Map<number, string>();

    for (let i = 0; i < this.electorates.length; i++) {
      const electorateLabel = this.electorates[i].domainOfInfluenceTypesList
        .map(t => this.i18n.instant('DOMAIN_OF_INFLUENCE_TYPES.' + t))
        .join(', ');
      this.electorateLabelByIndex.set(i, electorateLabel);
    }
  }
}

export interface ContestCountingCircleElectoratesUpdateDialogData {
  contestId: string;
  countingCircleId: string;
  electorates: CountingCircleElectorate[];
  readonly: boolean;
}

export interface ContestCountingCircleElectoratesUpdateDialogResult {
  electorates: CountingCircleElectorate[];
}
