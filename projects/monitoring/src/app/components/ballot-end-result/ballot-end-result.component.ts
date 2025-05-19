/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { BallotType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_pb';
import { Component, Input, OnInit } from '@angular/core';
import { BallotEndResult, VoteResultAlgorithm } from 'ausmittlung-lib';

@Component({
  selector: 'app-ballot-end-result',
  templateUrl: './ballot-end-result.component.html',
  styleUrls: ['./ballot-end-result.component.scss'],
  standalone: false,
})
export class BallotEndResultComponent implements OnInit {
  public BallotType: typeof BallotType = BallotType;

  @Input()
  public endResult!: BallotEndResult;

  @Input()
  public eVoting: boolean = false;

  @Input()
  public eCounting: boolean = false;

  @Input()
  public voteResultAlgorithm!: VoteResultAlgorithm;

  public isPopularMajorityAlgorithm: boolean = false;
  public isCountingCircleAlgorithmAlgorithm: boolean = false;

  public ngOnInit(): void {
    this.isPopularMajorityAlgorithm =
      this.voteResultAlgorithm === VoteResultAlgorithm.VOTE_RESULT_ALGORITHM_POPULAR_MAJORITY ||
      this.voteResultAlgorithm === VoteResultAlgorithm.VOTE_RESULT_ALGORITHM_POPULAR_AND_COUNTING_CIRCLE_MAJORITY;

    this.isCountingCircleAlgorithmAlgorithm =
      this.voteResultAlgorithm === VoteResultAlgorithm.VOTE_RESULT_ALGORITHM_COUNTING_CIRCLE_MAJORITY ||
      this.voteResultAlgorithm === VoteResultAlgorithm.VOTE_RESULT_ALGORITHM_COUNTING_CIRCLE_UNANIMITY ||
      this.voteResultAlgorithm === VoteResultAlgorithm.VOTE_RESULT_ALGORITHM_POPULAR_AND_COUNTING_CIRCLE_MAJORITY;
  }
}
