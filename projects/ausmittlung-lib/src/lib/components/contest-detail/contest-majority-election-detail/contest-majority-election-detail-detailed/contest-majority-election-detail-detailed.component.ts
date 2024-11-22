/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MajorityElectionResult } from '../../../../models';
import { BallotCountInputComponent } from '../../../ballot-count-input/ballot-count-input.component';
import { DialogService, ThemeService } from '@abraxas/voting-lib';
import {
  MajorityElectionWriteInMappingDialogComponent,
  ResultImportWriteInMappingDialogData,
} from '../../../majority-election-write-in-mappings/majority-election-write-in-mapping-dialog/majority-election-write-in-mapping-dialog.component';
import { PermissionService } from '../../../../services/permission.service';
import { Permissions } from '../../../../models/permissions.model';

@Component({
  selector: 'vo-ausm-contest-majority-election-detail-detailed',
  templateUrl: './contest-majority-election-detail-detailed.component.html',
  styleUrls: ['./contest-majority-election-detail-detailed.component.scss'],
})
export class ContestMajorityElectionDetailDetailedComponent implements OnInit {
  @Input()
  public readonly: boolean = true;

  @Input()
  public eVoting: boolean = true;

  @Input()
  public resultDetail!: MajorityElectionResult;

  @Input()
  public showDetailsLink: boolean = false;

  @Output()
  public countOfVotersChange: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild(BallotCountInputComponent)
  private ballotCountInputComponent!: BallotCountInputComponent;

  public canReadBallotGroups: boolean = false;
  public canEnterResults: boolean = false;

  constructor(
    private readonly router: Router,
    private readonly themeService: ThemeService,
    private readonly dialogService: DialogService,
    private readonly permissionService: PermissionService,
  ) {}

  public async ngOnInit(): Promise<void> {
    this.canEnterResults = await this.permissionService.hasPermission(Permissions.PoliticalBusinessResult.EnterResults);
    this.canReadBallotGroups = await this.permissionService.hasPermission(Permissions.MajorityElectionBallotGroupResult.Read);
  }

  public async openBallotGroups(): Promise<void> {
    if (!this.resultDetail || !this.canReadBallotGroups) {
      return;
    }

    await this.router.navigate([this.themeService.theme$.value, 'majority-election-result', this.resultDetail.id, 'ballot-groups']);
  }

  public async openBundles(): Promise<void> {
    if (!this.resultDetail) {
      return;
    }

    await this.router.navigate([this.themeService.theme$.value, 'majority-election-result', this.resultDetail.id, 'bundles']);
  }

  public async openWriteIns(electionId: string): Promise<void> {
    if (!this.resultDetail || !this.resultDetail.election.contest) {
      return;
    }

    const data: ResultImportWriteInMappingDialogData = {
      contestId: this.resultDetail.election.contest.id,
      countingCircleId: this.resultDetail.countingCircle.id,
      electionId: electionId,
    };

    this.dialogService.open(MajorityElectionWriteInMappingDialogComponent, data);
  }

  public setFocus(): void {
    this.ballotCountInputComponent.setFocus();
  }
}
