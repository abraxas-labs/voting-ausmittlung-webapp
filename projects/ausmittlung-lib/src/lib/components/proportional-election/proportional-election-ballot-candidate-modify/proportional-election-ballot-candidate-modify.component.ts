/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { TextComponent } from '@abraxas/base-components';
import { Component, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { ProportionalElectionBallotCandidate, ProportionalElectionCandidate } from '../../../models';
import { RemoveCandidateRangeData } from '../proportional-election-ballot-candidate-remove-range/proportional-election-ballot-candidate-remove-range.component';

@Component({
  selector: 'vo-ausm-proportional-election-ballot-candidate-modify',
  templateUrl: './proportional-election-ballot-candidate-modify.component.html',
  styleUrls: ['./proportional-election-ballot-candidate-modify.component.scss'],
  standalone: false,
})
export class ProportionalElectionBallotCandidateModifyComponent {
  @ViewChild('addCandidateInput', { static: true })
  public addCandidateInput!: TextComponent;

  @ViewChild('removeCandidateInput', { static: true })
  public removeCandidateInput!: TextComponent;

  @Input()
  public addableCandidatesByNumber: Record<string, ProportionalElectionCandidate> = {};

  @Input()
  public removableCandidatesByNumber: Record<string, ProportionalElectionBallotCandidate> = {};

  @Input()
  public canAddCandidate: boolean = false;

  @Input()
  public readonly: boolean = true;

  @Input()
  public showRemoveRange: boolean = false;

  @Input()
  public candidateCheckDigit: boolean = false;

  @Output()
  public addCandidate: EventEmitter<ProportionalElectionBallotCandidate> = new EventEmitter<ProportionalElectionBallotCandidate>();

  @Output()
  public removeCandidateRange: EventEmitter<RemoveCandidateRangeData> = new EventEmitter<RemoveCandidateRangeData>();

  @Output()
  public removeCandidate: EventEmitter<ProportionalElectionBallotCandidate> = new EventEmitter<ProportionalElectionBallotCandidate>();

  @Output()
  public contentCompleted: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();

  public removeCandidateValue: string = '';
  public addCandidateValue: string = '';

  @HostListener('document:keydown.control.alt.r', ['$event'])
  public focusAddCandidate(event: KeyboardEvent): void {
    event.preventDefault();
    this.addCandidateInput.setFocus();
  }

  @HostListener('document:keydown.control.alt.f', ['$event'])
  public focusRemoveCandidate(event: KeyboardEvent): void {
    event.preventDefault();
    this.removeCandidateInput.setFocus();
  }

  public tryRemoveCandidate(candidateNumber: string): void {
    const candidateToRemove = this.removableCandidatesByNumber[this.removeDots(candidateNumber)];
    if (!candidateToRemove) {
      return;
    }

    this.removeCandidate.emit(candidateToRemove);
    this.removeCandidateValue = '';
  }

  public tryAddCandidate(candidateNumber: string): void {
    const candidateToAdd = this.addableCandidatesByNumber[this.removeDots(candidateNumber)];
    if (!candidateToAdd) {
      return;
    }

    this.addCandidate.emit({ ...candidateToAdd, onList: false, removedFromList: false });
    this.addCandidateValue = '';
  }

  public setFocus(focusAddCandidate: boolean): void {
    if (focusAddCandidate) {
      this.addCandidateInput.setFocus();
    } else {
      this.removeCandidateInput.setFocus();
    }
  }

  private removeDots(str: string): string {
    return str.replace(/\./g, '');
  }
}
