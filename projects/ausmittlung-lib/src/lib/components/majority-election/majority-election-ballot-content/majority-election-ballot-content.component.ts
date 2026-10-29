/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { TextComponent } from '@abraxas/base-components';
import { Component, EventEmitter, HostListener, inject, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { MajorityElectionBallotCandidate, MajorityElectionCandidate, MajorityElectionResultBallotBase } from '../../../models';
import { DialogService } from '@abraxas/voting-lib';
import { MajorityElectionBallotCandidatesChooseDialogComponent } from '../majority-election-ballot-candidates-choose-dialog/majority-election-ballot-candidates-choose-dialog.component';
import { ElectionBallotCandidatesChooseDialogData } from '../../election-ballot-candidates-choose-dialog/election-ballot-candidates-choose-dialog.component';
import { MajorityElectionService } from '../../../services/majority-election.service';
import { MajorityElectionBallotPosition } from '../majority-election-ballot-candidates/majority-election-ballot-candidates.component';
import { groupBySingle } from '../../../services/utils/array.utils';

@Component({
  selector: 'vo-ausm-majority-election-ballot-content',
  templateUrl: './majority-election-ballot-content.component.html',
  styleUrls: ['./majority-election-ballot-content.component.scss'],
  standalone: false,
})
export class MajorityElectionBallotContentComponent implements OnChanges {
  private readonly electionService = inject(MajorityElectionService);
  private readonly dialogService = inject(DialogService);

  @Input()
  public readonly: boolean = false;

  @Input()
  public bundlesWithBallotGroupEnabled: boolean = false;

  @Input()
  public isNew: boolean = false;

  @Input()
  public disabled: boolean = false;

  @Input()
  public isSecondaryElection: boolean = false;

  @Input()
  public automaticEmptyVoteCounting: boolean = true;

  @Input()
  public showInvalidVotes: boolean = false;

  @Input()
  public showIndividualVotes: boolean = false;

  @Input()
  public showEmptyVotes: boolean = true;

  @Input()
  public ballot!: MajorityElectionResultBallotBase;

  @Input()
  public candidateCheckDigit: boolean = false;

  @Output()
  public contentChanged: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('toggleCandidateInput')
  public toggleCandidateInput!: TextComponent;

  @ViewChild('removeCandidateInput')
  public removeCandidateInput?: TextComponent;

  public removeCandidateValue: string = '';
  public toggleCandidateValue: string = '';
  public positions: MajorityElectionBallotPosition[] = [];
  public addableCandidates: MajorityElectionCandidate[] = [];

  private electionCandidates: MajorityElectionCandidate[] = [];
  private selectableCandidatesByNumber: Record<string, MajorityElectionBallotCandidate> = {};

  @HostListener('document:keydown.control.alt.f', ['$event'])
  public focusRemoveCandidate(event: KeyboardEvent): void {
    if (this.isSecondaryElection || this.readonly || this.disabled) {
      return;
    }
    event.preventDefault();
    this.removeCandidateInput?.setFocus();
  }

  @HostListener('document:keydown.control.alt.r', ['$event'])
  public focusToggleCandidate(event: KeyboardEvent): void {
    if (this.isSecondaryElection || this.readonly || this.disabled) {
      return;
    }

    event.preventDefault();
    this.toggleCandidateInput?.setFocus();
  }

  public async ngOnChanges(): Promise<void> {
    this.electionCandidates = [];
    this.updateEmptyVoteCount();
    this.updatePositions();
    this.updateSelectableCandidates();
    if (this.bundlesWithBallotGroupEnabled && !this.readonly) {
      this.electionCandidates = await (this.isSecondaryElection
        ? this.electionService.listCandidatesOfSecondaryElection(this.ballot.election.id)
        : this.electionService.listCandidates(this.ballot.election.id));
      this.updateSelectableCandidates();
    }
  }

  public tryRemoveCandidate(candidateNumber: string): void {
    const candidate = this.ballot.candidates.find(
      c => (this.candidateCheckDigit ? `${c.number}${c.checkDigit}` : c.number) === candidateNumber && c.selected,
    );
    if (!candidate || this.readonly || this.disabled) {
      return;
    }
    this.toggleCandidate(candidate);

    // setTimeout is needed so that the value is set after the ngModel binding updates the value.
    setTimeout(() => (this.removeCandidateValue = ''));
  }

  public async chooseCandidate(position: MajorityElectionBallotPosition): Promise<void> {
    if (this.readonly || this.disabled || this.ballot.computedEmptyVoteCount <= 0) {
      return;
    }
    const ballot = this.ballot;
    const data: ElectionBallotCandidatesChooseDialogData<MajorityElectionCandidate> = {
      candidates: this.addableCandidates,
      candidateCheckDigit: this.candidateCheckDigit,
    };
    const candidate = await this.dialogService.openForResult<
      MajorityElectionBallotCandidatesChooseDialogComponent,
      MajorityElectionCandidate
    >(MajorityElectionBallotCandidatesChooseDialogComponent, data, { autoFocus: false });
    if (candidate && this.ballot === ballot) {
      this.addCandidate(candidate.id, position);
    }
  }

  public addCandidate(id?: string, position?: MajorityElectionBallotPosition): void {
    const candidate = this.electionCandidates.find(c => c.id === id) ?? this.ballot.candidates.find(c => c.id === id);
    if (
      !candidate ||
      this.readonly ||
      this.disabled ||
      this.ballot.computedEmptyVoteCount <= 0 ||
      this.ballot.candidates.some(c => c.id === id && c.selected)
    ) {
      return;
    }
    position = position
      ? this.positions.find(p => p.position === position!.position)
      : this.positions.find(p => !p.ballotGroupCandidate?.selected && !p.replacementCandidate);
    if (!position || position.ballotGroupCandidate?.selected || position.replacementCandidate) {
      return;
    }
    this.ballot.candidates.push({ ...candidate, selected: true, onBallotGroup: false, position: position.position });
    this.candidatesChanged();

    // setTimeout is needed so that the value is set after the ngModel binding updates the value.
    setTimeout(() => (this.toggleCandidateValue = ''));
  }

  public restoreCandidate(position: MajorityElectionBallotPosition): void {
    const candidate = position.ballotGroupCandidate;
    if (
      !candidate ||
      candidate.selected ||
      this.readonly ||
      this.disabled ||
      this.ballot.candidates.some(c => c.id === candidate.id && c.selected) ||
      (!position.replacementCandidate && this.ballot.computedEmptyVoteCount <= 0)
    ) {
      return;
    }
    if (position.replacementCandidate) {
      this.ballot.candidates = this.ballot.candidates.filter(c => c !== position.replacementCandidate);
    }
    candidate.selected = true;
    this.candidatesChanged();
  }

  public tryToggleCandidate(candidateNumber: string): void {
    if (this.bundlesWithBallotGroupEnabled) {
      const candidate = [...this.electionCandidates, ...this.ballot.candidates].find(
        c => (this.candidateCheckDigit ? `${c.number}${c.checkDigit}` : c.number) === candidateNumber,
      );
      this.addCandidate(candidate?.id);
      return;
    }
    this.toggleCandidate(this.selectableCandidatesByNumber[candidateNumber]);
  }

  public toggleCandidate(candidate?: MajorityElectionBallotCandidate): void {
    if (!candidate || this.readonly || this.disabled || (!candidate.selected && this.ballot.computedEmptyVoteCount <= 0)) {
      return;
    }

    candidate.selected = !candidate.selected;
    if (this.bundlesWithBallotGroupEnabled && !candidate.onBallotGroup && !candidate.selected) {
      this.ballot.candidates = this.ballot.candidates.filter(c => c !== candidate);
    }
    this.candidatesChanged();

    // setTimeout is needed so that the value is set after the ngModel binding updates the value.
    setTimeout(() => (this.toggleCandidateValue = ''));
  }

  public updateEmptyVoteCount(): void {
    this.ballot.computedEmptyVoteCount =
      this.ballot.election.numberOfMandates -
      this.ballot.individualVoteCount -
      this.ballot.invalidVoteCount -
      this.ballot.candidates.filter(c => c.selected).length;
    this.setEmptyVoteCountIfAuto();
  }

  public updateManualEmptyVoteCount(emptyVoteCount: number): void {
    if (this.ballot.emptyVoteCount === emptyVoteCount) {
      return;
    }

    this.ballot.emptyVoteCount = emptyVoteCount;
    this.contentChanged.emit();
  }

  public setFocus(): void {
    if (this.bundlesWithBallotGroupEnabled) {
      this.removeCandidateInput?.setFocus();
    } else {
      this.toggleCandidateInput?.setFocus();
    }
  }

  public setInvalidVoteCount(count: number): void {
    if (this.ballot.invalidVoteCount === count) {
      return;
    }

    this.ballot.invalidVoteCount = count;
    this.updateEmptyVoteCount();
    this.updateSelectableCandidates();
    this.contentChanged.emit();
  }

  public setIndividualVoteCount(count: number): void {
    if (this.ballot.individualVoteCount === count) {
      return;
    }

    this.ballot.individualVoteCount = count;
    this.updateEmptyVoteCount();
    this.updateSelectableCandidates();
    this.contentChanged.emit();
  }

  private candidatesChanged(): void {
    this.updateEmptyVoteCount();
    this.updatePositions();
    this.updateSelectableCandidates();
    this.contentChanged.emit();
  }

  private updatePositions(): void {
    this.positions = Array.from({ length: this.ballot.election.numberOfMandates }, (_, index) => ({ position: index + 1 }));
    if (!this.bundlesWithBallotGroupEnabled) {
      return;
    }
    for (const candidate of this.ballot.candidates) {
      const position = this.positions[candidate.position - 1];
      if (!position) {
        continue;
      }
      if (candidate.onBallotGroup) {
        position.ballotGroupCandidate = candidate;
      } else if (candidate.selected) {
        position.replacementCandidate = candidate;
      }
    }
  }

  private setEmptyVoteCountIfAuto(): void {
    if (this.automaticEmptyVoteCounting) {
      this.ballot.emptyVoteCount = this.ballot.computedEmptyVoteCount;
    }
  }

  private updateSelectableCandidates(): void {
    this.addableCandidates = this.electionCandidates.filter(c => !this.ballot.candidates.some(b => b.id === c.id && b.selected));
    const candidates = this.ballot.computedEmptyVoteCount > 0 ? this.ballot.candidates : this.ballot.candidates.filter(c => c.selected);
    this.selectableCandidatesByNumber = groupBySingle(
      candidates,
      x => (this.candidateCheckDigit ? `${x.number}${x.checkDigit}` : x.number),
      x => x,
    );
  }
}
