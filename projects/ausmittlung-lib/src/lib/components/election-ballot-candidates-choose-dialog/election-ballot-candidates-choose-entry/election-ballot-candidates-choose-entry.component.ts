/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Highlightable } from '@angular/cdk/a11y';
import { Component, HostBinding, Input } from '@angular/core';
import { MajorityElectionCandidate, ProportionalElectionCandidate } from '../../../models';
import { ElectionBallotCandidateChoice } from '../election-ballot-candidates-choose-dialog.component';

@Component({
  selector: 'vo-ausm-election-ballot-candidates-choose-entry',
  templateUrl: './election-ballot-candidates-choose-entry.component.html',
  styleUrls: ['./election-ballot-candidates-choose-entry.component.scss'],
  standalone: false,
})
export class ElectionBallotCandidatesChooseEntryComponent<
  T extends MajorityElectionCandidate | ProportionalElectionCandidate,
> implements Highlightable {
  @Input()
  public choice!: ElectionBallotCandidateChoice<T>;

  @HostBinding('class.active')
  public active: boolean = false;

  public setActiveStyles(): void {
    this.active = true;
  }

  public setInactiveStyles(): void {
    this.active = false;
  }
}
