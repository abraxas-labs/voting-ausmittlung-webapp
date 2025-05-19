/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'vo-ausm-political-business-ballot-button-bar',
  templateUrl: './political-business-ballot-button-bar.component.html',
  styleUrls: ['./political-business-ballot-button-bar.component.scss'],
  standalone: false,
})
export class PoliticalBusinessBallotButtonBarComponent {
  @Input()
  public actionExecuting: boolean = false;

  @Input()
  public readonly: boolean = true;

  @Input()
  public disabled: boolean = true;

  @Input()
  public canSubmitBundle: boolean = false;

  @Input()
  public nextBallotEnabled: boolean = false;

  @Input()
  public labelNext: string = 'ELECTION.BALLOT_DETAIL.NEW';

  @Output()
  public back: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public submitBundle: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public nextBallot: EventEmitter<void> = new EventEmitter<void>();

  @HostListener('document:keydown.control.alt.d', ['$event'])
  public emitCreateBallot(event: KeyboardEvent): void {
    if (this.disabled || this.actionExecuting || !this.nextBallotEnabled) {
      return;
    }

    event.preventDefault();
    this.nextBallot.emit();
  }

  @HostListener('document:keydown.control.alt.w', ['$event'])
  public emitSubmitBundle(event: KeyboardEvent): void {
    if (this.readonly || this.disabled || this.actionExecuting || !this.canSubmitBundle) {
      return;
    }

    event.preventDefault();
    this.submitBundle.emit();
  }
}
