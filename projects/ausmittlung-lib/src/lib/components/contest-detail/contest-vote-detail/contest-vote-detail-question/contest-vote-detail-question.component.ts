/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { BallotQuestionResult, TieBreakQuestionResult } from '../../../../models';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { BallotSubType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_pb';

@Component({
  selector: 'vo-ausm-contest-vote-detail-question',
  templateUrl: './contest-vote-detail-question.component.html',
  styleUrls: ['./contest-vote-detail-question.component.scss'],
})
export class ContestVoteDetailQuestionComponent implements OnDestroy {
  @Input()
  public isTieBreakQuestion: boolean = false;

  @Input()
  public ballotNumberOfQuestions: number = 1;

  @Input()
  public result!: BallotQuestionResult | TieBreakQuestionResult;

  @Input()
  public eVoting: boolean = false;

  @Input()
  public readonly: boolean = true;

  @Input()
  public ballotSubType?: BallotSubType;

  @Output()
  public countOfAnswersChanged: EventEmitter<void> = new EventEmitter<void>();

  public newZhFeaturesEnabled: boolean = false;

  private readonly routeSubscription: Subscription;

  constructor(route: ActivatedRoute) {
    this.routeSubscription = route.data.subscribe(async ({ contestCantonDefaults }) => {
      this.newZhFeaturesEnabled = contestCantonDefaults.newZhFeaturesEnabled;
    });
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  public updateTotal(): void {
    const conventionalSubTotal = this.result.conventionalSubTotal;
    const eVotingSubTotal = this.result.eVotingSubTotal;

    this.result.totalCountOfAnswer1 = +(conventionalSubTotal.totalCountOfAnswer1 ?? 0) + +eVotingSubTotal.totalCountOfAnswer1;
    this.result.totalCountOfAnswer2 = +(conventionalSubTotal.totalCountOfAnswer2 ?? 0) + +eVotingSubTotal.totalCountOfAnswer2;
    this.result.totalCountOfAnswerUnspecified =
      +(conventionalSubTotal.totalCountOfAnswerUnspecified ?? 0) + +eVotingSubTotal.totalCountOfAnswerUnspecified;

    this.countOfAnswersChanged.emit();
  }
}
