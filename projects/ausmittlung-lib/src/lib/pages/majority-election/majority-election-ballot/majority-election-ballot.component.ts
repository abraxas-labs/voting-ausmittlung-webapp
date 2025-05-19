/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';
import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ShortcutDialogComponent, ShortcutDialogData } from '../../../components/ballot-shortcut-dialog/shortcut-dialog.component';
import { MajorityElectionBallotContentsComponent } from '../../../components/majority-election/majority-election-ballot-contents/majority-election-ballot-contents.component';
import {
  BallotNumberGeneration,
  MajorityElectionBase,
  MajorityElectionCandidates,
  MajorityElectionResult,
  MajorityElectionResultBallot,
  PoliticalBusinessResultBundle,
} from '../../../models';
import { MajorityElectionResultBundleService } from '../../../services/majority-election-result-bundle.service';
import { MajorityElectionResultService } from '../../../services/majority-election-result.service';
import { MajorityElectionService } from '../../../services/majority-election.service';
import { PermissionService } from '../../../services/permission.service';
import { UserService } from '../../../services/user.service';
import { ElectionBallotComponent } from '../../election-ballot/election-ballot.component';

@Component({
  selector: 'vo-ausm-majority-election-ballot',
  templateUrl: './majority-election-ballot.component.html',
  styleUrls: ['./majority-election-ballot.component.scss'],
  standalone: false,
})
export class MajorityElectionBallotComponent extends ElectionBallotComponent<
  MajorityElectionResult,
  PoliticalBusinessResultBundle,
  MajorityElectionResultBallot
> {
  private electionCandidates: MajorityElectionCandidates = {
    secondaryElectionCandidates: [],
    candidates: [],
  };
  private electionByIds?: {
    primaryElection: MajorityElectionBase;
    [id: string]: MajorityElectionBase;
  };

  @ViewChild(MajorityElectionBallotContentsComponent)
  private majorityElectionBallotContentsComponent?: MajorityElectionBallotContentsComponent;

  constructor(
    route: ActivatedRoute,
    router: Router,
    dialog: DialogService,
    toast: SnackbarService,
    i18n: TranslateService,
    userService: UserService,
    permissionService: PermissionService,
    private readonly resultBundleService: MajorityElectionResultBundleService,
    private readonly resultService: MajorityElectionResultService,
    private readonly electionService: MajorityElectionService,
  ) {
    super(userService, route, dialog, i18n, router, toast, permissionService);
  }

  public get ballotBundleSize(): number | undefined {
    return this.politicalBusinessResult?.entryParams?.ballotBundleSize;
  }

  protected get ballotNumberGeneration(): BallotNumberGeneration | undefined {
    return this.politicalBusinessResult?.entryParams?.ballotNumberGeneration;
  }

  public contentChanged(): void {
    this.hasChanges = true;
    this.emptyVoteCountValid = !!this.ballot && this.resultBundleService.hasValidEmptyVoteCount(this.ballot);
  }

  public showShortcutDialog(): void {
    const data: ShortcutDialogData = {
      shortcuts: [
        {
          text: 'ELECTION.BALLOT_DETAIL.SHORTCUT.BALLOT_NEW.TEXT',
          combination: 'ELECTION.BALLOT_DETAIL.SHORTCUT.BALLOT_NEW.COMBINATION',
        },
        {
          text: 'ELECTION.BALLOT_DETAIL.SHORTCUT.BALLOT_DELETE.TEXT',
          combination: 'ELECTION.BALLOT_DETAIL.SHORTCUT.BALLOT_DELETE.COMBINATION',
        },
        {
          text: 'MAJORITY_ELECTION.BALLOT_DETAIL.SHORTCUT.ADD_CANDIDATE.TEXT',
          combination: 'MAJORITY_ELECTION.BALLOT_DETAIL.SHORTCUT.ADD_CANDIDATE.COMBINATION',
        },
        {
          text: 'POLITICAL_BUSINESS.SHORTCUT.SUBMIT_BUNDLE.TEXT',
          combination: 'POLITICAL_BUSINESS.SHORTCUT.SUBMIT_BUNDLE.COMBINATION',
        },
      ],
    };
    this.dialog.open(ShortcutDialogComponent, data);
  }

  protected async createNewBallot(): Promise<MajorityElectionResultBallot> {
    const showEmptyVoteCount =
      this.politicalBusinessResult!.election.numberOfMandates !== 1 ||
      this.politicalBusinessResult!.secondaryMajorityElectionResults.length > 0;

    this.ballot = {
      isNew: true,
      number: this.currentMaxBallotNumber,
      computedEmptyVoteCount: !showEmptyVoteCount ? 0 : this.politicalBusinessResult!.election.numberOfMandates,
      emptyVoteCount: !showEmptyVoteCount ? 0 : this.politicalBusinessResult!.election.numberOfMandates,
      individualVoteCount: 0,
      invalidVoteCount: 0,
      election: this.politicalBusinessResult!.election,
      candidates: this.electionCandidates.candidates.map(c => ({
        ...c,
        selected: false,
      })),
      secondaryMajorityElectionBallots: this.electionCandidates.secondaryElectionCandidates.map(sme => ({
        candidates: sme.candidates.map(c => ({
          ...c,
          selected: false,
        })),
        election: this.electionByIds![sme.secondaryMajorityElectionId],
        emptyVoteCount: this.electionByIds![sme.secondaryMajorityElectionId].numberOfMandates,
        individualVoteCount: 0,
        invalidVoteCount: 0,
        computedEmptyVoteCount: this.electionByIds![sme.secondaryMajorityElectionId].numberOfMandates,
      })),
    };
    return this.ballot;
  }

  protected async loadBundleData(bundleId: string): Promise<void> {
    const oldElectionId = this.politicalBusinessResult?.election.id;
    const response = await this.resultBundleService.getBundle(bundleId);
    this.politicalBusinessResult = response.electionResult;
    this.bundle = response.bundle;
    this.buildElectionData(this.politicalBusinessResult);
    this.computeBundleData();

    if (
      this.bundleInProcessOrCorrection &&
      (this.electionCandidates.candidates.length === 0 || oldElectionId !== response.electionResult.election.id)
    ) {
      await this.loadCandidates(response.electionResult.election.id);
    }
  }

  protected async loadBallotData(bundleId: string, ballotNumber: number): Promise<void> {
    this.ballot = await this.resultBundleService.getBallot(bundleId, ballotNumber, this.electionByIds!);
  }

  protected async reconstructData(resultId: string, bundleId: string): Promise<void> {
    this.politicalBusinessResult = await this.resultService.getByResultId(resultId);
    this.buildElectionData(this.politicalBusinessResult);
    this.bundle = {
      countOfBallots: 0,
      id: bundleId,
      state: BallotBundleState.BALLOT_BUNDLE_STATE_IN_PROCESS,
      number: this.route.snapshot.queryParams.bundleNumber,
      createdBy: await this.userService.getUser(),
      ballotNumbersToReview: [],
      logs: [],
    };
    this.computeBundleData();
    await this.loadCandidates(this.politicalBusinessResult.election.id);
  }

  protected saveNewBallot(bundle: PoliticalBusinessResultBundle, ballot: MajorityElectionResultBallot): Promise<number> {
    return this.resultBundleService.createBallot(bundle.id, ballot, this.politicalBusinessResult!.entryParams!.automaticEmptyVoteCounting);
  }

  protected updateBallot(bundle: PoliticalBusinessResultBundle, ballot: MajorityElectionResultBallot): Promise<void> {
    return this.resultBundleService.updateBallot(bundle.id, ballot, this.politicalBusinessResult!.entryParams!.automaticEmptyVoteCounting);
  }

  protected deleteBallot(bundleId: string, ballotNumber: number): Promise<void> {
    return this.resultBundleService.deleteBallot(bundleId, ballotNumber);
  }

  protected submitBundle(bundleId: string, state: BallotBundleState): Promise<void> {
    return state === BallotBundleState.BALLOT_BUNDLE_STATE_IN_PROCESS
      ? this.resultBundleService.bundleSubmissionFinished(bundleId)
      : this.resultBundleService.bundleCorrectionFinished(bundleId);
  }

  protected isBallotUnchanged(): boolean {
    return (
      this.ballot !== undefined &&
      this.ballot.computedEmptyVoteCount === this.politicalBusinessResult!.election.numberOfMandates &&
      this.ballot.individualVoteCount === 0 &&
      this.ballot.invalidVoteCount === 0 &&
      this.ballot.secondaryMajorityElectionBallots.every(
        b => b.computedEmptyVoteCount === b.election.numberOfMandates && b.individualVoteCount === 0 && b.invalidVoteCount === 0,
      )
    );
  }

  protected setFocus(): void {
    this.majorityElectionBallotContentsComponent?.setFocus();
  }

  private async loadCandidates(electionId: string): Promise<void> {
    this.electionCandidates = await this.electionService.listCandidatesInclSecondary(electionId);
  }

  private buildElectionData(electionResult: MajorityElectionResult): void {
    this.electionByIds = {
      primaryElection: electionResult.election,
    };

    for (const secondaryElectionResult of electionResult.secondaryMajorityElectionResults) {
      this.electionByIds[secondaryElectionResult.election.id] = secondaryElectionResult.election;
    }
  }
}
