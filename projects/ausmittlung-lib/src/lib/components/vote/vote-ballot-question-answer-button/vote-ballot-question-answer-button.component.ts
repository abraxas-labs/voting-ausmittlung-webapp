/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'vo-ausm-vote-ballot-question-answer-button',
  templateUrl: './vote-ballot-question-answer-button.component.html',
  styleUrls: ['./vote-ballot-question-answer-button.component.scss'],
  standalone: false,
})
export class VoteBallotQuestionAnswerButtonComponent {
  @Input()
  public selected: boolean = false;

  @Input()
  public text: string = '';

  @Input()
  public readonly: boolean = false;

  @Input()
  public disabled: boolean = false;

  @Output()
  public clicked: EventEmitter<void> = new EventEmitter<void>();
}
