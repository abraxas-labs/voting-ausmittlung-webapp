/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { AfterViewInit, ChangeDetectorRef, Directive, HostListener, QueryList, ViewChildren, inject } from '@angular/core';
import { ElectionBallotCandidatesChooseEntryComponent } from './election-ballot-candidates-choose-entry/election-ballot-candidates-choose-entry.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MajorityElectionCandidate, ProportionalElectionCandidate } from '../../models';

@Directive()
export abstract class ElectionBallotCandidatesChooseDialogComponent<
  T extends MajorityElectionCandidate | ProportionalElectionCandidate,
> implements AfterViewInit {
  private readonly dialogRef = inject<MatDialogRef<ElectionBallotCandidatesChooseDialogComponent<T>, T>>(MatDialogRef);
  private readonly cd = inject(ChangeDetectorRef);

  public readonly allCandidates: ElectionBallotCandidateChoice<T>[];
  public candidates: ElectionBallotCandidateChoice<T>[];

  @ViewChildren(ElectionBallotCandidatesChooseEntryComponent)
  public candidateEntries!: QueryList<ElectionBallotCandidatesChooseEntryComponent<T>>;

  private keyManager?: ActiveDescendantKeyManager<ElectionBallotCandidatesChooseEntryComponent<T>>;

  constructor() {
    const dialogData = inject<ElectionBallotCandidatesChooseDialogData<T>>(MAT_DIALOG_DATA);

    this.allCandidates = dialogData.candidates.map(candidate => this.buildCandidateChoice(candidate, dialogData.candidateCheckDigit));
    this.candidates = this.allCandidates;
  }

  public ngAfterViewInit(): void {
    this.keyManager = new ActiveDescendantKeyManager(this.candidateEntries).withWrap().withVerticalOrientation();
  }

  @HostListener('document:keydown', ['$event'])
  public async keyDown(event: KeyboardEvent): Promise<void> {
    if (!this.keyManager) {
      return;
    }

    if (event.key === 'Enter' && this.keyManager.activeItem) {
      this.done(this.keyManager.activeItem.choice.candidate);
      event.preventDefault();
      return;
    }

    this.keyManager.onKeydown(event);
  }

  public done(candidate?: T): void {
    this.dialogRef.close(candidate);
  }

  public search(query: string): void {
    const upperQuery = query.toUpperCase();
    this.candidates = this.allCandidates.filter(c => c.queryable.includes(upperQuery));
    // Update the entries before selecting a result, including when the search is empty.
    this.cd.detectChanges();
    this.keyManager?.setActiveItem(-1);
    if (this.candidates.length > 0) {
      this.keyManager?.setFirstItemActive();
    }
  }

  protected abstract buildCandidateChoice(candidate: T, candidateCheckDigit: boolean): ElectionBallotCandidateChoice<T>;

  protected abstract noReplacementLabel: string;
}

export interface ElectionBallotCandidateChoice<T extends MajorityElectionCandidate | ProportionalElectionCandidate> {
  candidate: T;
  number: string;
  name: string;
  partyOrList: string;
  queryable: string;
}

export interface ElectionBallotCandidatesChooseDialogData<T extends MajorityElectionCandidate | ProportionalElectionCandidate> {
  candidates: T[];
  candidateCheckDigit: boolean;
}
