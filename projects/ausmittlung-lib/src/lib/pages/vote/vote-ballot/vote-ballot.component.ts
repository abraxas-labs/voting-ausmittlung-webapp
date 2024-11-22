/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { BallotType } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/vote_pb';
import { DialogService, SnackbarService } from '@abraxas/voting-lib';
import { Component, HostListener, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ShortcutDialogComponent, ShortcutDialogData } from '../../../components/ballot-shortcut-dialog/shortcut-dialog.component';
import {
  BallotBundleState,
  BallotQuestionAnswer,
  BallotResult,
  PoliticalBusinessResultBundle,
  TieBreakQuestionAnswer,
  VoteResult,
  VoteResultBallot,
  VoteResultBallotQuestionAnswer,
  VoteResultBallotTieBreakQuestionAnswer,
} from '../../../models';
import { PermissionService } from '../../../services/permission.service';
import { UserService } from '../../../services/user.service';
import { VoteResultBundleService } from '../../../services/vote-result-bundle.service';
import { VoteResultService } from '../../../services/vote-result.service';
import { PoliticalBusinessBallotComponent } from '../../political-business-ballot/political-business-ballot.component';
import { BallotHeaderComponent } from '../../../components/ballot-header/ballot-header.component';

@Component({
  selector: 'vo-ausm-vote-ballot',
  templateUrl: './vote-ballot.component.html',
  styleUrls: ['./vote-ballot.component.scss'],
})
export class VoteBallotComponent extends PoliticalBusinessBallotComponent<VoteResult, PoliticalBusinessResultBundle, VoteResultBallot> {
  public BallotType: typeof BallotType = BallotType;

  @ViewChild(BallotHeaderComponent)
  public headerComponent!: BallotHeaderComponent;

  public ballotResult?: BallotResult;
  public activeAnswer?: VoteResultBallotQuestionAnswer | VoteResultBallotTieBreakQuestionAnswer;

  constructor(
    route: ActivatedRoute,
    router: Router,
    dialog: DialogService,
    toast: SnackbarService,
    i18n: TranslateService,
    userService: UserService,
    permissionService: PermissionService,
    private readonly resultBundleService: VoteResultBundleService,
    private readonly resultService: VoteResultService,
  ) {
    super(userService, route, dialog, i18n, router, toast, permissionService);
  }

  protected get deletedBallotLabel(): string {
    return 'VOTE.BALLOT_DETAIL.DELETED';
  }

  public contentChanged(): void {
    this.updateActiveAnswer();
    this.hasChanges = true;
  }

  @HostListener('document:keydown.control.alt.1', ['$event'])
  // control + alt + 1 (not on the numeric keypad) converts to the char '¦'
  @HostListener('document:keydown.control.alt.¦', ['$event'])
  public setAnswerYes(event?: KeyboardEvent): void {
    event?.preventDefault();
    const result = this.trySetQuestionAnswer(BallotQuestionAnswer.BALLOT_QUESTION_ANSWER_YES);
    if (!result) {
      this.trySetTieBreakQuestionAnswer(TieBreakQuestionAnswer.TIE_BREAK_QUESTION_ANSWER_Q1);
    }
  }

  @HostListener('document:keydown.control.alt.2', ['$event'])
  // control + alt + 2 (not on the numeric keypad) converts to the char '@'
  @HostListener('document:keydown.control.alt.@', ['$event'])
  public setAnswerNo(event?: KeyboardEvent): void {
    event?.preventDefault();
    const result = this.trySetQuestionAnswer(BallotQuestionAnswer.BALLOT_QUESTION_ANSWER_NO);
    if (!result) {
      this.trySetTieBreakQuestionAnswer(TieBreakQuestionAnswer.TIE_BREAK_QUESTION_ANSWER_Q2);
    }
  }

  @HostListener('document:keydown.control.alt.3', ['$event'])
  // control + alt + 3 (not on the numeric keypad) converts to the char '#'
  @HostListener('document:keydown.control.alt.#', ['$event'])
  public setAnswerUnspecified(event?: KeyboardEvent): void {
    if (!this.ballotResult || this.ballotResult.ballot.ballotType === BallotType.BALLOT_TYPE_STANDARD_BALLOT) {
      return;
    }

    event?.preventDefault();
    const result = this.trySetQuestionAnswer(BallotQuestionAnswer.BALLOT_QUESTION_ANSWER_UNSPECIFIED);
    if (!result) {
      this.trySetTieBreakQuestionAnswer(TieBreakQuestionAnswer.TIE_BREAK_QUESTION_ANSWER_UNSPECIFIED);
    }
  }

  public showShortcutDialog(): void {
    const data: ShortcutDialogData = {
      shortcuts: [
        {
          text: 'VOTE.BALLOT_DETAIL.SHORTCUT.SET_YES.TEXT',
          combination: 'VOTE.BALLOT_DETAIL.SHORTCUT.SET_YES.COMBINATION',
        },
        {
          text: 'VOTE.BALLOT_DETAIL.SHORTCUT.SET_NO.TEXT',
          combination: 'VOTE.BALLOT_DETAIL.SHORTCUT.SET_NO.COMBINATION',
        },
        {
          text: 'VOTE.BALLOT_DETAIL.SHORTCUT.SET_ANSWER_UNSPECIFIED.TEXT',
          combination: 'VOTE.BALLOT_DETAIL.SHORTCUT.SET_ANSWER_UNSPECIFIED.COMBINATION',
        },
        {
          text: 'VOTE.BALLOT_DETAIL.SHORTCUT.BALLOT_DELETE.TEXT',
          combination: 'VOTE.BALLOT_DETAIL.SHORTCUT.BALLOT_DELETE.COMBINATION',
        },
        {
          text: 'VOTE.BALLOT_DETAIL.SHORTCUT.BALLOT_NEW.TEXT',
          combination: 'VOTE.BALLOT_DETAIL.SHORTCUT.BALLOT_NEW.COMBINATION',
        },
        {
          text: 'POLITICAL_BUSINESS.SHORTCUT.SUBMIT_BUNDLE.TEXT',
          combination: 'POLITICAL_BUSINESS.SHORTCUT.SUBMIT_BUNDLE.COMBINATION',
        },
      ],
    };
    this.dialog.open(ShortcutDialogComponent, data);
  }

  public async createBallot(): Promise<void> {
    await super.createBallot();
    this.updateActiveAnswer();
  }

  protected async createNewBallot(): Promise<VoteResultBallot> {
    this.ballot = {
      isNew: true,
      number: this.currentMaxBallotNumber,
      questionAnswers: [],
      tieBreakQuestionAnswers: [],
    };

    if (this.ballotResult) {
      this.ballot.questionAnswers = this.ballotResult.ballot.ballotQuestionsList.map(x => ({ question: x }));
      this.ballot.tieBreakQuestionAnswers = this.ballotResult.ballot.tieBreakQuestionsList.map(x => ({ question: x }));
    }

    return this.ballot;
  }

  protected async loadBundleData(bundleId: string): Promise<void> {
    const response = await this.resultBundleService.getBundle(bundleId);
    this.politicalBusinessResult = response.politicalBusinessResult;
    this.ballotResult = response.ballotResult;
    this.bundle = response.bundle;
    this.computeBundleData();
  }

  protected async loadBallotData(bundleId: string, ballotNumber: number, ballotResultId?: string): Promise<void> {
    this.ballot = await this.resultBundleService.getBallot(bundleId, ballotNumber);

    if (this.ballot?.questionAnswers.length === 0 && this.ballotResult) {
      this.ballot.questionAnswers = this.ballotResult.ballot.ballotQuestionsList.map(x => ({ question: x }));
    }

    if (this.ballot?.tieBreakQuestionAnswers.length === 0 && this.ballotResult) {
      this.ballot.tieBreakQuestionAnswers = this.ballotResult.ballot.tieBreakQuestionsList.map(x => ({ question: x }));
    }
  }

  protected async reconstructData(resultId: string, bundleId: string, params: Params): Promise<void> {
    this.politicalBusinessResult = await this.resultService.getByResultId(resultId);
    this.ballotResult = await this.resultService.getBallotResult(params.ballotResultId);
    this.bundle = {
      countOfBallots: 0,
      id: bundleId,
      state: BallotBundleState.BALLOT_BUNDLE_STATE_IN_PROCESS,
      number: this.route.snapshot.queryParams.bundleNumber,
      createdBy: await this.userService.getUser(),
      ballotNumbersToReview: [],
    };
    this.computeBundleData();
  }

  protected saveNewBallot(bundle: PoliticalBusinessResultBundle, ballot: VoteResultBallot): Promise<number> {
    return this.resultBundleService.createBallot(bundle.id, ballot);
  }

  protected updateBallot(bundle: PoliticalBusinessResultBundle, ballot: VoteResultBallot): Promise<void> {
    return this.resultBundleService.updateBallot(bundle.id, ballot);
  }

  protected deleteBallot(bundleId: string, ballotNumber: number): Promise<void> {
    return this.resultBundleService.deleteBallot(bundleId, ballotNumber);
  }

  protected submitBundle(bundleId: string, state: BallotBundleState): Promise<void> {
    return state === BallotBundleState.BALLOT_BUNDLE_STATE_IN_PROCESS
      ? this.resultBundleService.bundleSubmissionFinished(bundleId)
      : this.resultBundleService.bundleCorrectionFinished(bundleId);
  }

  protected computeBundleData(): void {
    this.minBallotNumber = 1;
    super.computeBundleData();
  }

  protected async validateBallot(): Promise<boolean> {
    if (!this.ballot) {
      return false;
    }

    if (
      this.ballot.questionAnswers.every(
        qa => qa.answer === BallotQuestionAnswer.BALLOT_QUESTION_ANSWER_UNSPECIFIED || qa.answer === undefined,
      ) &&
      this.ballot.tieBreakQuestionAnswers.every(
        qa => qa.answer === TieBreakQuestionAnswer.TIE_BREAK_QUESTION_ANSWER_UNSPECIFIED || qa.answer === undefined,
      )
    ) {
      await this.dialog.alert(
        this.i18n.instant('VOTE.BALLOT_DETAIL.UNCHANGED_BALLOT.TITLE'),
        this.i18n.instant('VOTE.BALLOT_DETAIL.UNCHANGED_BALLOT.MSG'),
      );
      return false;
    }

    return true;
  }

  protected setFocus(): void {
    this.headerComponent.setFocus();
  }

  private trySetQuestionAnswer(answer: BallotQuestionAnswer): boolean {
    if (!this.ballot) {
      return false;
    }

    const questionAnswer = this.ballot.questionAnswers.find(a => a.answer === undefined);
    if (questionAnswer) {
      questionAnswer.answer = answer;
      this.contentChanged();
      return true;
    }

    return false;
  }

  private trySetTieBreakQuestionAnswer(answer: TieBreakQuestionAnswer): void {
    if (!this.ballot) {
      return;
    }

    const tieBreakQuestionAnswer = this.ballot.tieBreakQuestionAnswers.find(a => a.answer === undefined);
    if (tieBreakQuestionAnswer) {
      tieBreakQuestionAnswer.answer = answer;
      this.contentChanged();
    }
  }

  private updateActiveAnswer(): void {
    if (!this.ballot) {
      return;
    }

    const questionAnswer = this.ballot.questionAnswers.find(a => a.answer === undefined);
    if (questionAnswer) {
      this.activeAnswer = questionAnswer;
      return;
    }

    const tieBreakQuestionAnswer = this.ballot.tieBreakQuestionAnswers.find(a => a.answer === undefined);
    if (tieBreakQuestionAnswer) {
      this.activeAnswer = tieBreakQuestionAnswer;
      return;
    }

    delete this.activeAnswer;
  }
}
