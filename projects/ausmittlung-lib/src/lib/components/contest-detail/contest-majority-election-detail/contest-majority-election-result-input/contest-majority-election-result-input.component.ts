/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, ElementRef, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { MajorityElectionCandidateResult, MajorityElectionResult, SecondaryMajorityElectionResult } from '../../../../models';

@Component({
  selector: 'vo-ausm-contest-majority-election-result-input',
  templateUrl: './contest-majority-election-result-input.component.html',
  styleUrls: ['./contest-majority-election-result-input.component.scss'],
})
export class ContestMajorityElectionResultInputComponent {
  public eVotingValue: boolean = false;

  @Input()
  public showElectionHeader: boolean = false;

  @Input()
  public result!: MajorityElectionResult | SecondaryMajorityElectionResult;

  @Input()
  public showInvalidVotes: boolean = false;

  @Input()
  public showIndividualVotes: boolean = false;

  @Input()
  public showEmptyVotes: boolean = true;

  @Input()
  public readonly: boolean = true;

  @Input()
  public buttonsTemplate?: TemplateRef<HTMLElement>;

  @Output()
  public contentChanged: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('candidateResultsContainer', { static: true })
  public candidateResultsContainer!: ElementRef;

  @Input()
  public set eVoting(v: boolean) {
    this.eVotingValue = v;

    // variable workaround due to angular bug https://github.com/angular/angular/issues/28897
    this.candidateResultsContainer.nativeElement.style.setProperty('--candidate-results-column-count', v ? 5 : 3);
  }

  public setConventionalEmptyVoteCount(v?: number): void {
    this.result.conventionalSubTotal.emptyVoteCountExclWriteIns = v;
    this.result.emptyVoteCount = (v ?? 0) + this.result.eVotingSubTotal.emptyVoteCountInclWriteIns;
  }

  public setConventionalInvalidVoteCount(v?: number): void {
    this.result.conventionalSubTotal.invalidVoteCount = v;
    this.result.invalidVoteCount = (v ?? 0) + this.result.eVotingSubTotal.invalidVoteCount;
  }

  public setConventionalIndividualVoteCount(v?: number): void {
    this.result.conventionalSubTotal.individualVoteCount = v;
    this.result.individualVoteCount = (v ?? 0) + this.result.eVotingSubTotal.individualVoteCount;
  }

  public setConventionalVoteCount(candidate: MajorityElectionCandidateResult, v?: number): void {
    candidate.conventionalVoteCount = v;
    candidate.voteCount = (v ?? 0) + candidate.eVotingInclWriteInsVoteCount;
  }
}
