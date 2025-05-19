/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-question-end-result-entry',
  templateUrl: './question-end-result-entry.component.html',
  styleUrls: ['./question-end-result-entry.component.scss'],
  standalone: false,
})
export class QuestionEndResultEntryComponent {
  @Input()
  public titleText: string = '';

  @Input()
  public labelLeft: string = '';

  @Input()
  public voteCountLeft: number = 0;

  @Input()
  public labelRight: string = '';

  @Input()
  public voteCountRight: number = 0;

  @Input()
  public voteCountUnspecified: number = 0;

  @Input()
  public hasUnspecifiedVoteCount: boolean = false;
}
