/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Highlightable } from '@angular/cdk/a11y';
import { Component, HostBinding, Input } from '@angular/core';
import { ProportionalElectionCandidate } from '../../../../models';

@Component({
  selector: 'vo-ausm-proportional-election-ballot-candidates-choose-entry',
  templateUrl: './proportional-election-ballot-candidates-choose-entry.component.html',
  styleUrls: ['./proportional-election-ballot-candidates-choose-entry.component.scss'],
  standalone: false,
})
export class ProportionalElectionBallotCandidatesChooseEntryComponent implements Highlightable {
  @Input()
  public candidate!: ProportionalElectionCandidate;

  @Input()
  public candidateCheckDigit: boolean = false;

  @HostBinding('class.active')
  public active: boolean = false;

  public setActiveStyles(): void {
    this.active = true;
  }

  public setInactiveStyles(): void {
    this.active = false;
  }
}
