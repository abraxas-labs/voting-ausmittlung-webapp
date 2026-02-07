/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { NumberComponent } from '@abraxas/base-components';

@Component({
  selector: 'vo-ausm-ballot-navigation',
  templateUrl: './ballot-navigation.component.html',
  styleUrls: ['./ballot-navigation.component.scss'],
  standalone: false,
})
export class BallotNavigationComponent {
  @Input()
  public minBallotNumber: number = 1;

  private _maxBallotNumber: number | undefined;

  @Input()
  public set maxBallotNumber(v: number | undefined) {
    if (v === undefined) {
      this._maxBallotNumber = undefined;
      return;
    }

    // New ballots shorty set this to 0, as no ballots exist for a short amount of time (until the first ballot is created)
    // Setting this to 0 in turn sets the ballot number to 0, which we do not want
    this._maxBallotNumber = Math.max(1, v);
  }

  public get maxBallotNumber(): number | undefined {
    return this._maxBallotNumber;
  }

  @Input({ required: true })
  public canGoPrevious: boolean = false;

  @Input({ required: true })
  public canGoNext: boolean = false;

  @Input()
  public readonly: boolean = true;

  @Input()
  public labelBallotNumber: string = 'ELECTION.BALLOT_DETAIL.BALLOT_NR';

  @Output()
  public ballotNumberEntered: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  public previousBallotRequest: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public nextBallotRequest: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('navigationComponent')
  private navigationComponent!: NumberComponent;

  public ballotNumberValue: number | undefined;
  public ballotNumberOriginalValue: number | undefined;

  // Allow undefined under certain conditions, such as when setting the ballot number manually for the first time
  public allowUndefined = true;

  @Input({ required: true })
  public set ballotNumber(v: number | undefined) {
    v = !v ? undefined : v;
    this.allowUndefined = v === undefined;
    this.ballotNumberValue = v;
    this.ballotNumberOriginalValue = v;
  }

  public enterBallotNumber(): void {
    this.allowUndefined = false;
    if (this.readonly || this.ballotNumberValue === this.ballotNumberOriginalValue) {
      return;
    }

    if ((this.maxBallotNumber && this.ballotNumberValue! <= this.maxBallotNumber) || this.ballotNumberValue! >= this.minBallotNumber) {
      this.ballotNumberEntered.emit(this.ballotNumberValue);
    }
  }

  public setFocus(): void {
    this.navigationComponent.setFocus();
  }

  public changeBallotNumber(v: any): void {
    if (v === this.ballotNumberValue) {
      return;
    }

    this.ballotNumberValue = v === null ? undefined : v;
    this.allowUndefined = !!v;
  }
}
