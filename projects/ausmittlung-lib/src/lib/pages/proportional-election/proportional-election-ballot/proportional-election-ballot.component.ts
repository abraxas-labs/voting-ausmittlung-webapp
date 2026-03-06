/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';
import { Component, HostListener, inject, ViewChild } from '@angular/core';
import { ShortcutDialogComponent, ShortcutDialogData } from '../../../components/ballot-shortcut-dialog/shortcut-dialog.component';
import { ProportionalElectionBallotContentComponent } from '../../../components/proportional-election/proportional-election-ballot-content/proportional-election-ballot-content.component';
import {
  BallotNumberGeneration,
  ProportionalElectionCandidate,
  ProportionalElectionResult,
  ProportionalElectionResultBallot,
  ProportionalElectionResultBundle,
} from '../../../models';
import {
  ProportionalElectionBallotUiData,
  ProportionalElectionBallotUiService,
} from '../../../services/proportional-election-ballot-ui.service';
import { ProportionalElectionResultBundleService } from '../../../services/proportional-election-result-bundle.service';
import { ProportionalElectionResultService } from '../../../services/proportional-election-result.service';
import { ProportionalElectionService } from '../../../services/proportional-election.service';
import { ElectionBallotComponent } from '../../election-ballot/election-ballot.component';
import { BallotHeaderComponent } from '../../../components/ballot-header/ballot-header.component';

@Component({
  selector: 'vo-ausm-proportional-election-ballot',
  templateUrl: './proportional-election-ballot.component.html',
  styleUrls: ['./proportional-election-ballot.component.scss'],
  standalone: false,
})
export class ProportionalElectionBallotComponent extends ElectionBallotComponent<
  ProportionalElectionResult,
  ProportionalElectionResultBundle,
  ProportionalElectionResultBallot
> {
  private readonly resultBundleService = inject(ProportionalElectionResultBundleService);
  private readonly resultService = inject(ProportionalElectionResultService);
  private readonly electionService = inject(ProportionalElectionService);
  private readonly ballotUiService = inject(ProportionalElectionBallotUiService);

  public ballotUiData: ProportionalElectionBallotUiData = ProportionalElectionBallotUiService.newEmptyUiData();

  @ViewChild(ProportionalElectionBallotContentComponent)
  private proportionalElectionBallotContentComponent?: ProportionalElectionBallotContentComponent;

  @ViewChild(BallotHeaderComponent)
  private ballotHeaderComponent?: BallotHeaderComponent;

  private electionCandidates: ProportionalElectionCandidate[] = [];
  private listCandidates: ProportionalElectionCandidate[] = [];

  constructor() {
    super();
  }

  public get ballotBundleSize(): number | undefined {
    return this.politicalBusinessResult?.entryParams.ballotBundleSize;
  }

  protected get ballotNumberGeneration(): BallotNumberGeneration | undefined {
    return this.politicalBusinessResult?.entryParams.ballotNumberGeneration;
  }

  @HostListener('document:keydown.control.alt.t', ['$event'])
  public async resetBallot(event?: KeyboardEvent): Promise<void> {
    if (!this.ballot) {
      return;
    }

    event?.preventDefault();
    this.ballot = this.ballot.isNew
      ? this.ballotUiService.newBallot(this.ballot.number, this.listCandidates)
      : await this.resultBundleService.getBallot(this.bundle!.id, this.ballot.number);
    this.ballotUiData = this.ballotUiService.buildUiData(
      this.electionCandidates,
      this.politicalBusinessResult!.entryParams.automaticBallotNumberGeneration,
      this.politicalBusinessResult!.entryParams.automaticEmptyVoteCounting,
      this.politicalBusinessResult!.election.numberOfMandates,
      this.politicalBusinessResult!.entryParams.candidateCheckDigit,
      this.ballot,
    );
    this.contentChanged();

    if (this.ballot!.isNew) {
      return;
    }

    this.hasChanges = false;
  }

  @HostListener('document:keydown.control.alt.a', ['$event'])
  public removeAllCandidates(event?: KeyboardEvent): void {
    event?.preventDefault();
    this.ballotUiService.removeAllCandidates(this.ballotUiData);
    this.contentChanged();
    this.setFocus();
  }

  public contentChanged(): void {
    this.hasChanges = true;
    this.emptyVoteCountValid = this.ballotUiData.emptyVoteCountValid;
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
          text: 'PROPORTIONAL_ELECTION.BALLOT_DETAIL.SHORTCUT.REMOVE_ALL_CANDIDATES.TEXT',
          combination: 'PROPORTIONAL_ELECTION.BALLOT_DETAIL.SHORTCUT.REMOVE_ALL_CANDIDATES.COMBINATION',
        },
        {
          text: 'PROPORTIONAL_ELECTION.BALLOT_DETAIL.SHORTCUT.RESET.TEXT',
          combination: 'PROPORTIONAL_ELECTION.BALLOT_DETAIL.SHORTCUT.RESET.COMBINATION',
        },
        {
          text: 'PROPORTIONAL_ELECTION.BALLOT_DETAIL.SHORTCUT.ADD_CANDIDATE.TEXT',
          combination: 'PROPORTIONAL_ELECTION.BALLOT_DETAIL.SHORTCUT.ADD_CANDIDATE.COMBINATION',
        },
        {
          text: 'PROPORTIONAL_ELECTION.BALLOT_DETAIL.SHORTCUT.REMOVE_CANDIDATE.TEXT',
          combination: 'PROPORTIONAL_ELECTION.BALLOT_DETAIL.SHORTCUT.REMOVE_CANDIDATE.COMBINATION',
        },
        {
          text: 'PROPORTIONAL_ELECTION.BALLOT_DETAIL.SHORTCUT.REMOVE_RANGE_CANDIDATE.TEXT',
          combination: 'PROPORTIONAL_ELECTION.BALLOT_DETAIL.SHORTCUT.REMOVE_RANGE_CANDIDATE.COMBINATION',
        },
        {
          text: 'POLITICAL_BUSINESS.SHORTCUT.SUBMIT_BUNDLE.TEXT',
          combination: 'POLITICAL_BUSINESS.SHORTCUT.SUBMIT_BUNDLE.COMBINATION',
        },
      ],
    };
    this.dialog.open(ShortcutDialogComponent, data);
  }

  protected newBallot(): ProportionalElectionResultBallot {
    const ballotNumber = this.politicalBusinessResult!.entryParams.automaticBallotNumberGeneration ? this.currentMaxBallotNumber : 0;
    this.ballot = this.ballotUiService.newBallot(ballotNumber, this.listCandidates);
    this.ballotUiData = this.ballotUiService.buildUiData(
      this.electionCandidates,
      this.politicalBusinessResult!.entryParams.automaticBallotNumberGeneration,
      this.politicalBusinessResult!.entryParams.automaticEmptyVoteCounting,
      this.politicalBusinessResult!.election.numberOfMandates,
      this.politicalBusinessResult!.entryParams.candidateCheckDigit,
      this.ballot,
    );
    return this.ballot;
  }

  protected async loadBundleData(bundleId: string): Promise<void> {
    const oldElectionId = this.politicalBusinessResult?.election.id;
    const response = await this.resultBundleService.getBundle(bundleId);
    this.politicalBusinessResult = response.electionResult;
    this.bundle = response.bundle;
    this.computeBundleData();

    if (
      this.bundleInProcessOrCorrection &&
      (this.electionCandidates.length === 0 || oldElectionId !== response.electionResult.election.id)
    ) {
      await this.loadCandidates(response.electionResult.election.id, response.bundle.list?.id);
    }
  }

  protected async loadBallotData(bundleId: string, ballotNumber: number, cachedBallot?: ProportionalElectionResultBallot): Promise<void> {
    this.ballot = cachedBallot ?? (await this.resultBundleService.getBallot(bundleId, ballotNumber));

    this.ballotUiData = this.ballotUiService.buildUiData(
      this.electionCandidates,
      this.politicalBusinessResult!.entryParams.automaticBallotNumberGeneration,
      this.politicalBusinessResult!.entryParams.automaticEmptyVoteCounting,
      this.politicalBusinessResult!.election.numberOfMandates,
      this.politicalBusinessResult!.entryParams.candidateCheckDigit,
      this.ballot,
    );
  }

  protected saveNewBallot(bundle: ProportionalElectionResultBundle, ballot: ProportionalElectionResultBallot): Promise<number> {
    return this.resultBundleService.createBallot(bundle.id, ballot.number, this.ballotUiData);
  }

  protected updateBallot(bundle: ProportionalElectionResultBundle, ballot: ProportionalElectionResultBallot): Promise<void> {
    return this.resultBundleService.updateBallot(bundle.id, ballot.number, this.ballotUiData);
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
    return this.ballotUiService.isUnchanged(this.ballotUiData);
  }

  protected setFocus(): void {
    if (this.ballotUiData.automaticBallotNumberGeneration) {
      this.proportionalElectionBallotContentComponent?.setFocus();
    } else {
      this.ballotHeaderComponent?.setFocus();
    }
  }

  protected async validateBallot(): Promise<boolean> {
    if (!(await this.validateBallotWithoutPartyTooHaveOneCandidate())) {
      return false;
    }

    if (!(await this.validateBallotWithPartyNotEmpty())) {
      return false;
    }

    return super.validateBallot();
  }

  private async loadCandidates(electionId: string, listId: string | undefined): Promise<void> {
    this.electionCandidates = await this.electionService.listCandidates(electionId);
    this.listCandidates = !listId ? [] : this.electionCandidates.filter(x => x.listId === listId);
  }

  private async validateBallotWithoutPartyTooHaveOneCandidate(): Promise<boolean> {
    if (!this.ballot || this.ballotUiData.candidateCountValid) {
      return true;
    }

    await this.dialog.alert(
      this.i18n.instant('PROPORTIONAL_ELECTION.BALLOT_DETAIL.INVALID_EMPTY_BALLOT_WITHOUT_PARTY.TITLE'),
      this.i18n.instant('PROPORTIONAL_ELECTION.BALLOT_DETAIL.INVALID_EMPTY_BALLOT_WITHOUT_PARTY.MSG'),
    );

    return false;
  }

  private async validateBallotWithPartyNotEmpty(): Promise<boolean> {
    if (!this.ballot || this.ballotUiData.numberOfMandates !== this.ballotUiData.emptyVoteCount) {
      return true;
    }

    await this.dialog.alert(
      this.i18n.instant('PROPORTIONAL_ELECTION.BALLOT_DETAIL.INVALID_EMPTY_BALLOT_WITH_PARTY.TITLE'),
      this.i18n.instant('PROPORTIONAL_ELECTION.BALLOT_DETAIL.INVALID_EMPTY_BALLOT_WITH_PARTY.MSG'),
    );

    return false;
  }
}
