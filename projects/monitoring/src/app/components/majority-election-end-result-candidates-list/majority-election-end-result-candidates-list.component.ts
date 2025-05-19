/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MajorityElectionCandidateEndResult, MajorityElectionEndResult, SecondaryMajorityElectionEndResult } from 'ausmittlung-lib';

@Component({
  selector: 'app-majority-election-end-result-candidates-list',
  templateUrl: './majority-election-end-result-candidates-list.component.html',
  standalone: false,
})
export class MajorityElectionEndResultCandidatesListComponent {
  public endResultValue?: MajorityElectionEndResult | SecondaryMajorityElectionEndResult;
  public candidateResults: MajorityElectionCandidateEndResult[] = [];
  public columns: string[] = [];

  @Input()
  public showTitle: boolean = false;

  @Input()
  public set showLotDecision(value: boolean) {
    this.showLotDecisionColumn = value;
    this.refreshTableColumns();
  }

  @Input()
  public set eVoting(value: boolean) {
    this.showEVotingColumn = value;
    this.refreshTableColumns();
  }

  @Input()
  public set eCounting(value: boolean) {
    this.showECountingColumn = value;
    this.refreshTableColumns();
  }

  private showLotDecisionColumn: boolean = false;
  private showEVotingColumn: boolean = false;
  private showECountingColumn: boolean = false;

  constructor(private readonly i18n: TranslateService) {
    this.refreshTableColumns();
  }

  @Input()
  public set endResult(v: MajorityElectionEndResult | SecondaryMajorityElectionEndResult) {
    this.endResultValue = v;

    if (this.endResultValue.election.individualCandidatesDisabled) {
      this.candidateResults = v.candidateEndResults;
      return;
    }

    this.candidateResults = [
      ...v.candidateEndResults,
      {
        candidate: {
          politicalLastName: this.i18n.instant('MAJORITY_ELECTION.INDIVIDUAL'),
        },
        voteCount: v.individualVoteCount,
        eVotingVoteCount: v.eVotingSubTotal.individualVoteCount,
        eCountingVoteCount: v.eCountingSubTotal.individualVoteCount,
        conventionalVoteCount: v.conventionalSubTotal.individualVoteCount,
      } as unknown as MajorityElectionCandidateEndResult,
    ];
  }

  private refreshTableColumns() {
    this.columns = ['rank', 'number', 'candidacy', 'party'];

    if (this.showECountingColumn || this.showEVotingColumn) {
      this.columns.push('conventionalVoteCount');
    }

    if (this.showEVotingColumn) {
      this.columns.push('eVotingVoteCount');
    }

    if (this.showECountingColumn) {
      this.columns.push('eCountingVoteCount');
    }

    this.columns.push('voteCount', 'state');

    if (this.showLotDecisionColumn) {
      this.columns.push('lotDecision');
    }
  }
}
