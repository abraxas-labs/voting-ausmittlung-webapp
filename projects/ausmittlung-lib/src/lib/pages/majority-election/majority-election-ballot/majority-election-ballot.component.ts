/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { BallotBundleState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/ballot_bundle_pb';
import { Component, HostListener, inject, ViewChild } from '@angular/core';
import { ShortcutDialogComponent, ShortcutDialogData } from '../../../components/ballot-shortcut-dialog/shortcut-dialog.component';
import { MajorityElectionBallotContentsComponent } from '../../../components/majority-election/majority-election-ballot-contents/majority-election-ballot-contents.component';
import {
  BallotNumberGeneration,
  MajorityElectionBallotCandidate,
  MajorityElectionBase,
  MajorityElectionCandidates,
  MajorityElectionResult,
  MajorityElectionResultBallot,
  MajorityElectionResultBallotBase,
  MajorityElectionResultBundle,
} from '../../../models';
import { MajorityElectionResultBundleService } from '../../../services/majority-election-result-bundle.service';
import { MajorityElectionService } from '../../../services/majority-election.service';
import { ElectionBallotComponent } from '../../election-ballot/election-ballot.component';
import { BallotHeaderComponent } from '../../../components/ballot-header/ballot-header.component';

@Component({
  selector: 'vo-ausm-majority-election-ballot',
  templateUrl: './majority-election-ballot.component.html',
  styleUrls: ['./majority-election-ballot.component.scss'],
  standalone: false,
})
export class MajorityElectionBallotComponent extends ElectionBallotComponent<
  MajorityElectionResult,
  MajorityElectionResultBundle,
  MajorityElectionResultBallot
> {
  private readonly resultBundleService = inject(MajorityElectionResultBundleService);
  private readonly electionService = inject(MajorityElectionService);

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

  @ViewChild(BallotHeaderComponent)
  private ballotHeaderComponent?: BallotHeaderComponent;

  constructor() {
    super();
  }

  public get ballotBundleSize(): number | undefined {
    return this.politicalBusinessResult?.entryParams?.ballotBundleSize;
  }

  protected get ballotNumberGeneration(): BallotNumberGeneration | undefined {
    return this.politicalBusinessResult?.entryParams?.ballotNumberGeneration;
  }

  protected get canEditBallot(): boolean {
    return (
      !!this.bundle &&
      !!this.politicalBusinessResult?.entryParams &&
      this.bundleInProcessOrCorrection &&
      this.canUpdateBallot &&
      !this.politicalBusinessResult.election.contest?.locked &&
      !this.loadingBallot &&
      !this.actionExecuting &&
      !this.isDestroyed
    );
  }

  @HostListener('document:keydown.control.alt.t', ['$event'])
  public async resetBallot(event?: KeyboardEvent): Promise<void> {
    if (
      !this.ballot ||
      !this.canEditBallot ||
      !this.hasChanges ||
      !this.politicalBusinessResult!.entryParams!.bundlesWithBallotGroupEnabled
    ) {
      return;
    }

    event?.preventDefault();
    const ballot = this.ballot;
    this.actionExecuting = true;
    try {
      if (ballot.isNew) {
        this.ballot = this.newBallot();
        this.ballot.number = ballot.number;
      } else {
        const restoredBallot = await this.resultBundleService.getBallot(this.bundle!.id, ballot.number, this.electionByIds!);
        if (this.isDestroyed || this.ballot !== ballot) {
          return;
        }
        this.ballot = restoredBallot;
        this.ballotCacheByNumber[ballot.number] = restoredBallot;
      }

      for (const electionBallot of [this.ballot, ...this.ballot.secondaryMajorityElectionBallots]) {
        this.updateEmptyVoteCount(electionBallot);
      }
      this.contentChanged();
      this.hasChanges = this.ballot.isNew;
    } finally {
      this.actionExecuting = false;
    }
  }

  @HostListener('document:keydown.control.alt.a', ['$event'])
  public removeAllCandidates(event?: KeyboardEvent): void {
    if (!this.ballot || !this.canEditBallot || !this.politicalBusinessResult!.entryParams!.bundlesWithBallotGroupEnabled) {
      return;
    }

    event?.preventDefault();
    this.ballot = {
      ...this.removeCandidates(this.ballot),
      secondaryMajorityElectionBallots: this.ballot.secondaryMajorityElectionBallots.map(x => this.removeCandidates(x)),
    };
    this.updateEmptyVoteCount(this.ballot);
    if (!this.ballot.isNew) {
      this.ballotCacheByNumber[this.ballot.number] = this.ballot;
    }
    this.contentChanged();
    this.setFocus();
  }

  private removeCandidates<T extends MajorityElectionResultBallotBase>(ballot: T): T {
    return {
      ...ballot,
      candidates: ballot.candidates.filter(candidate => candidate.onBallotGroup).map(candidate => ({ ...candidate, selected: false })),
    };
  }

  private updateEmptyVoteCount(ballot: MajorityElectionResultBallotBase): void {
    ballot.computedEmptyVoteCount =
      ballot.election.numberOfMandates -
      ballot.individualVoteCount -
      ballot.invalidVoteCount -
      ballot.candidates.filter(candidate => candidate.selected).length;
    if (this.politicalBusinessResult!.entryParams!.automaticEmptyVoteCounting) {
      ballot.emptyVoteCount = ballot.computedEmptyVoteCount;
    }
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

  protected newBallot(): MajorityElectionResultBallot {
    const showEmptyVoteCount =
      this.politicalBusinessResult!.election.numberOfMandates !== 1 ||
      this.politicalBusinessResult!.secondaryMajorityElectionResults.length > 0;

    const isManualEmptyVoteCounting = !this.politicalBusinessResult!.entryParams?.automaticEmptyVoteCounting;
    this.emptyVoteCountValid = !showEmptyVoteCount || !isManualEmptyVoteCounting;

    this.ballot = {
      isNew: true,
      number: this.politicalBusinessResult!.entryParams?.automaticBallotNumberGeneration ? this.currentMaxBallotNumber : 0,
      computedEmptyVoteCount: !showEmptyVoteCount ? 0 : this.politicalBusinessResult!.election.numberOfMandates,
      emptyVoteCount: !showEmptyVoteCount || isManualEmptyVoteCounting ? 0 : this.politicalBusinessResult!.election.numberOfMandates,
      individualVoteCount: 0,
      invalidVoteCount: 0,
      election: this.politicalBusinessResult!.election,
      candidates: this.buildCandidates(this.politicalBusinessResult!.election.id),
      secondaryMajorityElectionBallots: this.electionCandidates.secondaryElectionCandidates.map(sme => ({
        candidates: this.buildSecondaryElectionCandidates(sme.secondaryMajorityElectionId),
        election: this.electionByIds![sme.secondaryMajorityElectionId],
        emptyVoteCount: isManualEmptyVoteCounting ? 0 : this.electionByIds![sme.secondaryMajorityElectionId].numberOfMandates,
        individualVoteCount: 0,
        invalidVoteCount: 0,
        computedEmptyVoteCount: this.electionByIds![sme.secondaryMajorityElectionId].numberOfMandates,
      })),
      logs: [],
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

  protected async loadBallotData(bundleId: string, ballotNumber: number, cachedBallot?: MajorityElectionResultBallot): Promise<void> {
    this.ballot = cachedBallot ?? (await this.resultBundleService.getBallot(bundleId, ballotNumber, this.electionByIds!));
  }

  protected saveNewBallot(bundle: MajorityElectionResultBundle, ballot: MajorityElectionResultBallot): Promise<number> {
    return this.resultBundleService.createBallot(
      bundle.id,
      ballot,
      this.politicalBusinessResult!.entryParams!.automaticEmptyVoteCounting,
      this.politicalBusinessResult!.entryParams!.automaticBallotNumberGeneration,
    );
  }

  protected updateBallot(bundle: MajorityElectionResultBundle, ballot: MajorityElectionResultBallot): Promise<void> {
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
      !!this.ballot &&
      [this.ballot, ...this.ballot.secondaryMajorityElectionBallots].every(ballot => {
        const ballotGroupEntry = this.bundle?.ballotGroup?.entries.find(entry => entry.election.id === ballot.election.id);
        return (
          ballot.candidates.every(candidate => candidate.selected === candidate.onBallotGroup) &&
          ballot.individualVoteCount === (ballotGroupEntry?.individualCandidatesVoteCount ?? 0) &&
          ballot.invalidVoteCount === 0
        );
      })
    );
  }

  protected setFocus(): void {
    if (this.politicalBusinessResult!.entryParams?.automaticBallotNumberGeneration) {
      this.majorityElectionBallotContentsComponent?.setFocus();
    } else {
      this.ballotHeaderComponent?.setFocus();
    }
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

  private buildCandidates(electionId: string): MajorityElectionBallotCandidate[] {
    if (!this.bundle?.ballotGroup) {
      return this.electionCandidates.candidates.map(c => ({
        ...c,
        selected: false,
        onBallotGroup: false,
      }));
    }

    const ballotGroupEntry = this.bundle!.ballotGroup!.entries.find(x => x.election.id === electionId);
    if (!ballotGroupEntry) {
      return [];
    }

    return ballotGroupEntry.candidates.map((c, index) => ({
      ...c,
      selected: true,
      onBallotGroup: true,
      position: index + 1,
    }));
  }

  private buildSecondaryElectionCandidates(electionId: string): MajorityElectionBallotCandidate[] {
    if (!this.bundle?.ballotGroup) {
      const secondaryElectionCandidates = this.electionCandidates.secondaryElectionCandidates.find(
        x => x.secondaryMajorityElectionId === electionId,
      );
      if (!secondaryElectionCandidates) {
        return [];
      }

      return secondaryElectionCandidates.candidates.map(c => ({
        ...c,
        selected: false,
        onBallotGroup: false,
      }));
    }

    const ballotGroupEntry = this.bundle!.ballotGroup!.entries.find(x => x.election.id === electionId);
    if (!ballotGroupEntry) {
      return [];
    }

    return ballotGroupEntry.candidates.map((c, index) => ({
      ...c,
      selected: true,
      onBallotGroup: true,
      position: index + 1,
    }));
  }
}
