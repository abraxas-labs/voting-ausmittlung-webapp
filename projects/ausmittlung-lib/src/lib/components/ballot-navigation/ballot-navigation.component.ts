/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { TextComponent } from '@abraxas/base-components';

@Component({
  selector: 'vo-ausm-ballot-navigation',
  templateUrl: './ballot-navigation.component.html',
  styleUrls: ['./ballot-navigation.component.scss'],
})
export class BallotNavigationComponent {
  @Input()
  public minBallotNumber: number = 0;

  @Input()
  public maxBallotNumber: number = 0;

  @Input()
  public readonly: boolean = true;

  @Input()
  public labelBallotNumber: string = 'ELECTION.BALLOT_DETAIL.BALLOT_NR';

  @Output()
  public ballotNumberChange: EventEmitter<number> = new EventEmitter<number>();

  @ViewChild('navigationComponent')
  private navigationComponent!: TextComponent;

  public ballotNumberValue: number = 1;
  public ballotNumberOriginalValue: number = 1;

  @Input()
  public set ballotNumber(v: number) {
    this.ballotNumberValue = v;
    this.ballotNumberOriginalValue = v;
  }

  public emitNewBallotNumber(delta: number = 0): void {
    if (this.readonly) {
      return;
    }

    this.ballotNumberValue += delta;

    if (
      this.ballotNumberValue !== this.ballotNumberOriginalValue &&
      this.ballotNumberValue <= this.maxBallotNumber &&
      this.ballotNumberValue >= this.minBallotNumber
    ) {
      this.ballotNumberChange.emit(this.ballotNumberValue);
    }
  }

  public setFocus(): void {
    this.navigationComponent.setFocus();
  }
}
