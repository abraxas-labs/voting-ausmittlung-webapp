/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'vo-ausm-result-ballot-review-button-bar',
  templateUrl: './result-ballot-review-button-bar.component.html',
  styleUrls: ['./result-ballot-review-button-bar.component.scss'],
  standalone: false,
})
export class ResultBallotReviewButtonBarComponent {
  @Input()
  public disabled: boolean = true;

  @Input()
  public actionExecuting: boolean = false;

  @Input()
  public canSucceed: boolean = false;

  @Output()
  public back: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public succeedBundleReview: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public rejectBundleReview: EventEmitter<void> = new EventEmitter<void>();
}
