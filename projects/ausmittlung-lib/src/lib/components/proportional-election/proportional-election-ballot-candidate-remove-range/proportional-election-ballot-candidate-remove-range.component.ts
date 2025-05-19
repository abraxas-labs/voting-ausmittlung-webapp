/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { TextComponent } from '@abraxas/base-components';
import { Component, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';

export interface RemoveCandidateRangeData {
  start: string;
  end: string;
}

@Component({
  selector: 'vo-ausm-proportional-election-ballot-candidate-remove-range',
  templateUrl: './proportional-election-ballot-candidate-remove-range.component.html',
  standalone: false,
})
export class ProportionalElectionBallotCandidateRemoveRangeComponent {
  @Input()
  public readonly: boolean = false;

  @ViewChild('startInput', { static: true })
  public startInput?: TextComponent;

  @Output()
  public removeRange: EventEmitter<RemoveCandidateRangeData> = new EventEmitter<RemoveCandidateRangeData>();

  public start: string = '';
  public end: string = '';

  @HostListener('document:keydown.control.alt.g', ['$event'])
  public setStartFocus(event: KeyboardEvent): void {
    event.preventDefault();
    this.startInput?.setFocus();
  }

  @HostListener('keydown.enter')
  public emit(): void {
    if (!this.start || !this.end) {
      return;
    }

    this.removeRange.emit({ start: this.start, end: this.end });
    this.start = '';
    this.end = '';
  }
}
