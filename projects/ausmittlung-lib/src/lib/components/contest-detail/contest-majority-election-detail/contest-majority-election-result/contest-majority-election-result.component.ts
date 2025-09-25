/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, ElementRef, Input, TemplateRef, ViewChild } from '@angular/core';
import { MajorityElectionResult, SecondaryMajorityElectionResult } from '../../../../models';

@Component({
  selector: 'vo-ausm-contest-majority-election-result',
  templateUrl: './contest-majority-election-result.component.html',
  styleUrls: ['./contest-majority-election-result.component.scss'],
  standalone: false,
})
export class ContestMajorityElectionResultComponent {
  private resultValue!: MajorityElectionResult | SecondaryMajorityElectionResult;
  public eVotingValue: boolean = false;
  public eCountingValue: boolean = false;

  public maxCandidateVoteCount: number = 0;

  @Input()
  public showElectionHeader: boolean = false;

  public get result(): MajorityElectionResult | SecondaryMajorityElectionResult {
    return this.resultValue;
  }

  @Input()
  public set result(v: MajorityElectionResult | SecondaryMajorityElectionResult) {
    this.resultValue = v;
    this.maxCandidateVoteCount = v.candidateResults.length > 0 ? Math.max(...v.candidateResults.map(r => r.voteCount)) : 0;
  }

  @Input()
  public buttonsTemplate?: TemplateRef<HTMLElement>;

  @Input()
  public candidateCheckDigit: boolean = false;

  @Input()
  public showInvalidVotes: boolean = false;

  @Input()
  public showIndividualVotes: boolean = false;

  @Input()
  public showEmptyVotes: boolean = true;

  @ViewChild('candidateResultsContainer', { static: true })
  public candidateResultsContainer!: ElementRef;

  @Input()
  public set eVoting(v: boolean) {
    this.eVotingValue = v;
    this.updateCandidateResultsColumnCount();
  }

  @Input()
  public set eCounting(v: boolean) {
    this.eCountingValue = v;
    this.updateCandidateResultsColumnCount();
  }

  private updateCandidateResultsColumnCount(): void {
    let count = 4;
    if (this.eVotingValue) {
      count++;
    }

    if (this.eCountingValue) {
      count++;
    }

    if (this.eCountingValue || this.eVotingValue) {
      count++;
    }

    // variable workaround due to angular bug https://github.com/angular/angular/issues/28897
    this.candidateResultsContainer.nativeElement.style.setProperty('--candidate-results-column-count', count);
  }
}
