/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MajorityElectionResultBallot } from '../../../models';
import { MajorityElectionBallotContentComponent } from '../majority-election-ballot-content/majority-election-ballot-content.component';

@Component({
  selector: 'vo-ausm-majority-election-ballot-contents',
  templateUrl: './majority-election-ballot-contents.component.html',
  standalone: false,
})
export class MajorityElectionBallotContentsComponent {
  @Input()
  public disabled: boolean = true;

  @Input()
  public readonly: boolean = true;

  @Input()
  public automaticEmptyVoteCounting: boolean = true;

  @Input()
  public showInvalidVotes: boolean = false;

  @Input()
  public showEmptyVotes: boolean = true;

  @Input()
  public loadingBallot: boolean = true;

  @Input()
  public ballot?: MajorityElectionResultBallot;

  @Input()
  public candidateCheckDigit: boolean = false;

  @Output()
  public contentChanged: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public contentCompleted: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();

  @ViewChild('primaryElectionBallot')
  private majorityElectionBallotContentComponent?: MajorityElectionBallotContentComponent;

  public setFocus(): void {
    this.majorityElectionBallotContentComponent?.setFocus();
  }
}
