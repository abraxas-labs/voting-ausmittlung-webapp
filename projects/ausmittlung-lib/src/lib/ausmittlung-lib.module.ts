/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  BreadcrumbItemModule,
  BreadcrumbsModule,
  ButtonModule,
  CheckboxModule,
  DividerModule,
  DropdownModule,
  ExpansionPanelModule,
  FormfieldModule,
  IconModule,
  LabelModule,
  LoadingBarModule,
  NumberModule,
  RadioButtonModule,
  SpinnerModule,
  StatusLabelModule,
  TableModule,
  TabsModule,
  TextareaModule,
  TextModule,
  TooltipModule,
} from '@abraxas/base-components';
import { VotingLibModule } from '@abraxas/voting-lib';
import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { DndModule } from 'ngx-drag-drop';
import { BallotCountInputComponent } from './components/ballot-count-input/ballot-count-input.component';
import { BallotHeaderComponent } from './components/ballot-header/ballot-header.component';
import { BallotNavigationComponent } from './components/ballot-navigation/ballot-navigation.component';
import { BallotNumberGenerationSelectorComponent } from './components/ballot-number-generation-selector/ballot-number-generation-selector.component';
import { BallotReviewStepperComponent } from './components/ballot-review-stepper/ballot-review-stepper.component';
import { ShortcutDialogComponent } from './components/ballot-shortcut-dialog/shortcut-dialog.component';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { CommentsDialogComponent } from './components/comments-dialog/comments-dialog.component';
import { ConfirmCommentDialogComponent } from './components/confirm-comment-dialog/confirm-comment-dialog.component';
import { ContactPersonDataComponent } from './components/contact-person-data/contact-person-data.component';
import { ContactPersonDialogComponent } from './components/contact-person-dialog/contact-person-dialog.component';
import { ContactPersonEditComponent } from './components/contact-person-edit/contact-person-edit.component';
import { ContestDetailCountOfVotersComponent } from './components/contest-detail/contest-detail-count-of-voters/contest-detail-count-of-voters.component';
import { ContestDetailVotingCardsElectorateComponent } from './components/contest-detail/contest-detail-voting-cards-electorate/contest-detail-voting-cards-electorate.component';
import { ContestDetailVotingCardsExpansionPanelComponent } from './components/contest-detail/contest-detail-voting-cards-expansion-panel/contest-detail-voting-cards-expansion-panel.component';
import { ContestDetailVotingCardsComponent } from './components/contest-detail/contest-detail-voting-cards/contest-detail-voting-cards.component';
import { ContestMajorityElectionDetailDetailedComponent } from './components/contest-detail/contest-majority-election-detail/contest-majority-election-detail-detailed/contest-majority-election-detail-detailed.component';
import { ContestMajorityElectionDetailFinalResultsComponent } from './components/contest-detail/contest-majority-election-detail/contest-majority-election-detail-final-results/contest-majority-election-detail-final-results.component';
import { ContestMajorityElectionDetailHeaderComponent } from './components/contest-detail/contest-majority-election-detail/contest-majority-election-detail-header/contest-majority-election-detail-header.component';
import { ContestMajorityElectionDetailResultEntryComponent } from './components/contest-detail/contest-majority-election-detail/contest-majority-election-detail-result-entry/contest-majority-election-detail-result-entry.component';
import { ContestMajorityElectionDetailComponent } from './components/contest-detail/contest-majority-election-detail/contest-majority-election-detail.component';
import { ContestMajorityElectionResultInputComponent } from './components/contest-detail/contest-majority-election-detail/contest-majority-election-result-input/contest-majority-election-result-input.component';
import { ContestMajorityElectionResultComponent } from './components/contest-detail/contest-majority-election-detail/contest-majority-election-result/contest-majority-election-result.component';
import { ContestPoliticalBusinessDetailFooterComponent } from './components/contest-detail/contest-political-business-detail/contest-political-business-detail-footer/contest-political-business-detail-footer.component';
import { ContestPoliticalBusinessDetailComponent } from './components/contest-detail/contest-political-business-detail/contest-political-business-detail.component';
import { ContestProportionalElectionDetailHeaderComponent } from './components/contest-detail/contest-proportional-election-detail/contest-proportional-election-detail-header/contest-proportional-election-detail-header.component';
import { ContestProportionalElectionDetailResultEntryComponent } from './components/contest-detail/contest-proportional-election-detail/contest-proportional-election-detail-result-entry/contest-proportional-election-detail-result-entry.component';
import { ContestProportionalElectionDetailComponent } from './components/contest-detail/contest-proportional-election-detail/contest-proportional-election-detail.component';
import { ContestVoteDetailBallotComponent } from './components/contest-detail/contest-vote-detail/contest-vote-detail-ballot/contest-vote-detail-ballot.component';
import { ContestVoteDetailDetailedComponent } from './components/contest-detail/contest-vote-detail/contest-vote-detail-detailed/contest-vote-detail-detailed.component';
import { ContestVoteDetailQuestionComponent } from './components/contest-detail/contest-vote-detail/contest-vote-detail-question/contest-vote-detail-question.component';
import { ContestVoteDetailResultEntryParamsComponent } from './components/contest-detail/contest-vote-detail/contest-vote-detail-result-entry-params/contest-vote-detail-result-entry-params.component';
import { ContestVoteDetailResultEntryComponent } from './components/contest-detail/contest-vote-detail/contest-vote-detail-result-entry/contest-vote-detail-result-entry.component';
import { ContestVoteDetailComponent } from './components/contest-detail/contest-vote-detail/contest-vote-detail.component';
import { ContestHeaderComponent } from './components/contest-header/contest-header.component';
import { ContestListComponent } from './components/contest-list/contest-list.component';
import { ContestPastUnlockDialogComponent } from './components/contest-past-unlock-dialog/contest-past-unlock-dialog.component';
import { ResultBallotReviewButtonBarComponent } from './components/result-ballot-review-button-bar/result-ballot-review-button-bar.component';
import { ResultBundleStateChipComponent } from './components/result-bundle-state-chip/result-bundle-state-chip.component';
import { ElectionInfoComponent } from './components/election-info/election-info.component';
import { ElectionResultEntryParamsComponent } from './components/election-result-entry-params/election-result-entry-params.component';
import { InfoPanelEntryComponent } from './components/info-panel/info-panel-entry/info-panel-entry.component';
import { InfoPanelComponent } from './components/info-panel/info-panel.component';
import { MajorityElectionWriteInMappingDialogComponent } from './components/majority-election-write-in-mappings/majority-election-write-in-mapping-dialog/majority-election-write-in-mapping-dialog.component';
import { MajorityElectionWriteInMappingComponent } from './components/majority-election-write-in-mappings/majority-election-write-in-mapping/majority-election-write-in-mapping.component';
import { MajorityElectionBallotCandidatesComponent } from './components/majority-election/majority-election-ballot-candidates/majority-election-ballot-candidates.component';
import { MajorityElectionBallotContentComponent } from './components/majority-election/majority-election-ballot-content/majority-election-ballot-content.component';
import { MajorityElectionBallotContentsComponent } from './components/majority-election/majority-election-ballot-contents/majority-election-ballot-contents.component';
import { MajorityElectionBundleTableComponent } from './components/majority-election/majority-election-bundle-table/majority-election-bundle-table.component';
import { MajorityElectionInfoComponent } from './components/majority-election/majority-election-info/majority-election-info.component';
import { MajorityElectionSecondaryInfoComponent } from './components/majority-election/majority-election-secondary-info/majority-election-secondary-info.component';
import { PoliticalBusinessBallotButtonBarComponent } from './components/political-business-ballot-button-bar/political-business-ballot-button-bar.component';
import { PoliticalBusinessNewBundleNumberComponent } from './components/political-business-new-bundle-number/political-business-new-bundle-number.component';
import { ProportionalElectionBallotCandidateModifyComponent } from './components/proportional-election/proportional-election-ballot-candidate-modify/proportional-election-ballot-candidate-modify.component';
import { ProportionalElectionBallotCandidateRemoveRangeComponent } from './components/proportional-election/proportional-election-ballot-candidate-remove-range/proportional-election-ballot-candidate-remove-range.component';
import { ProportionalElectionBallotCandidatesChooseDialogComponent } from './components/proportional-election/proportional-election-ballot-candidates-choose-dialog/proportional-election-ballot-candidates-choose-dialog.component';
import { ProportionalElectionBallotCandidatesChooseEntryComponent } from './components/proportional-election/proportional-election-ballot-candidates-choose-dialog/proportional-election-ballot-candidates-choose-entry/proportional-election-ballot-candidates-choose-entry.component';
import { ProportionalElectionBallotCandidatesComponent } from './components/proportional-election/proportional-election-ballot-candidates/proportional-election-ballot-candidates.component';
import { ProportionalElectionBallotContentComponent } from './components/proportional-election/proportional-election-ballot-content/proportional-election-ballot-content.component';
import { ProportionalElectionBundleTableComponent } from './components/proportional-election/proportional-election-bundle-table/proportional-election-bundle-table.component';
import { ProportionalElectionInfoComponent } from './components/proportional-election/proportional-election-info/proportional-election-info.component';
import { ProportionalElectionNewBundleComponent } from './components/proportional-election/proportional-election-new-bundle/proportional-election-new-bundle.component';
import { ResultStateBoxComponent } from './components/result-state-box/result-state-box.component';
import { SelectCountingCircleDialogComponent } from './components/select-counting-circle-dialog/select-counting-circle-dialog.component';
import { SecondFactorTransactionDialogComponent } from './components/transaction-request-dialog/second-factor-transaction-dialog.component';
import { ValidationOverviewDialogComponent } from './components/validation-overview-dialog/validation-overview-dialog.component';
import { ValidationResultComponent } from './components/validation-result/validation-result.component';
import { VoteResultsGraphComponent } from './components/vote-results-graph/vote-results-graph.component';
import { VoteBallotContentComponent } from './components/vote/vote-ballot-content/vote-ballot-content.component';
import { VoteBallotQuestionAnswerButtonComponent } from './components/vote/vote-ballot-question-answer-button/vote-ballot-question-answer-button.component';
import { VoteBallotQuestionAnswerComponent } from './components/vote/vote-ballot-question-answer/vote-ballot-question-answer.component';
import { VoteBundleTableComponent } from './components/vote/vote-bundle-table/vote-bundle-table.component';
import { VoteInfoComponent } from './components/vote/vote-info/vote-info.component';
import { VotingDataSourceTabsComponent } from './components/voting-data-source-tabs/voting-data-source-tabs.component';
import { ContestDetailComponent } from './pages/contest-detail/contest-detail.component';
import { ContestOverviewComponent } from './pages/contest-overview/contest-overview.component';
import { MajorityElectionBallotGroupCandidatesPipe } from './pages/majority-election/majority-election-ballot-groups/majority-election-ballot-group-candidates.pipe';
import { MajorityElectionBallotGroupsComponent } from './pages/majority-election/majority-election-ballot-groups/majority-election-ballot-groups.component';
import { MajorityElectionBallotReviewComponent } from './pages/majority-election/majority-election-ballot-review/majority-election-ballot-review.component';
import { MajorityElectionBallotComponent } from './pages/majority-election/majority-election-ballot/majority-election-ballot.component';
import { MajorityElectionBundleOverviewComponent } from './pages/majority-election/majority-election-bundle-overview/majority-election-bundle-overview.component';
import { ProportionalElectionBallotReviewComponent } from './pages/proportional-election/proportional-election-ballot-review/proportional-election-ballot-review.component';
import { ProportionalElectionBallotComponent } from './pages/proportional-election/proportional-election-ballot/proportional-election-ballot.component';
import { ProportionalElectionBundleOverviewComponent } from './pages/proportional-election/proportional-election-bundle-overview/proportional-election-bundle-overview.component';
import { ProportionalElectionResultsComponent } from './pages/proportional-election/proportional-election-results/proportional-election-results.component';
import { ProportionalElectionUnmodifiedListsComponent } from './pages/proportional-election/proportional-election-unmodified-lists/proportional-election-unmodified-lists.component';
import { VoteBallotReviewComponent } from './pages/vote/vote-ballot-review/vote-ballot-review.component';
import { VoteBallotComponent } from './pages/vote/vote-ballot/vote-ballot.component';
import { VoteBundleOverviewComponent } from './pages/vote/vote-bundle-overview/vote-bundle-overview.component';
import { TranslateVoteQuestionPipe } from './pipes/translate-vote-question.pipe';
import { VOTING_AUSMITTLUNG_MONITORING_WEBAPP_URL, VOTING_BASIS_WEBAPP_URL } from './tokens';
import { AdmonitionComponent } from './components/admonition/admonition.component';
import { ResultExportComponent } from './pages/result-export/result-export.component';
import { ValidationSummaryComponent } from './components/validation-summary/validation-summary.component';
import { ValidationGroupPipe } from './pipes/validation-group.pipe';
import { PermissionDirective } from './directives/permission.directive';
import { ContestStateChangeButtonComponent } from './components/contest-detail/contest-state-change-button/contest-state-change-button.component';
import { ContestDetailInfoComponent } from './components/contest-detail/contest-detail-info/contest-detail-info.component';
import { ContestDetailInfoDialogComponent } from './components/contest-detail/contest-detail-info-dialog/contest-detail-info-dialog.component';
import { ContestVoteDetailResultsGraphComponent } from './components/contest-detail/contest-vote-detail/contest-vote-detail-results-graph/contest-vote-detail-results-graph.component';
import { ContactDialogComponent } from './components/contact-dialog/contact-dialog.component';
import { ContestDetailSubmissionTileComponent } from './components/contest-detail/contest-detail-submission-tile/contest-detail-submission-tile.component';
import { ContestCountingCircleElectoratesUpdateDialogComponent } from './components/contest-counting-circle-electorates-update-dialog/contest-counting-circle-electorates-update-dialog.component';
import { ContestCountingCircleElectorateAssignDialogComponent } from './components/contest-counting-circle-electorate-assign-dialog/contest-counting-circle-electorate-assign-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { BooleanStatusLabelComponent } from './components/boolean-status-label/boolean-status-label.component';
import { ValidValidationPipe } from './pipes/valid-validation.pipe';
import { ButtonBarComponent } from './components/button-bar/button-bar.component';

@NgModule({
  declarations: [
    ContactPersonDataComponent,
    ContestDetailCountOfVotersComponent,
    ContestDetailVotingCardsComponent,
    ContestVoteDetailComponent,
    ContestListComponent,
    SelectCountingCircleDialogComponent,
    ContestDetailComponent,
    ContestOverviewComponent,
    ContestVoteDetailResultEntryComponent,
    ContestPoliticalBusinessDetailComponent,
    BallotCountInputComponent,
    ContestVoteDetailBallotComponent,
    VoteResultsGraphComponent,
    ContestMajorityElectionDetailComponent,
    ContestVoteDetailQuestionComponent,
    ContestProportionalElectionDetailComponent,
    ContestPoliticalBusinessDetailFooterComponent,
    ConfirmCommentDialogComponent,
    ContestProportionalElectionDetailResultEntryComponent,
    ProportionalElectionUnmodifiedListsComponent,
    InfoPanelComponent,
    ResultStateBoxComponent,
    InfoPanelEntryComponent,
    ProportionalElectionInfoComponent,
    ProportionalElectionBundleOverviewComponent,
    ProportionalElectionBundleTableComponent,
    ProportionalElectionNewBundleComponent,
    BallotNavigationComponent,
    ProportionalElectionBallotComponent,
    ProportionalElectionBallotCandidatesComponent,
    ProportionalElectionBallotCandidateModifyComponent,
    ProportionalElectionBallotReviewComponent,
    BallotReviewStepperComponent,
    ProportionalElectionBallotContentComponent,
    ContestMajorityElectionDetailResultEntryComponent,
    ElectionResultEntryParamsComponent,
    BallotNumberGenerationSelectorComponent,
    MajorityElectionBallotGroupsComponent,
    MajorityElectionBallotGroupCandidatesPipe,
    MajorityElectionBallotComponent,
    MajorityElectionBallotReviewComponent,
    MajorityElectionBundleOverviewComponent,
    ElectionInfoComponent,
    MajorityElectionInfoComponent,
    PoliticalBusinessBallotButtonBarComponent,
    MajorityElectionBallotContentComponent,
    MajorityElectionBallotCandidatesComponent,
    ResultBallotReviewButtonBarComponent,
    MajorityElectionBallotContentsComponent,
    ContestMajorityElectionResultComponent,
    MajorityElectionSecondaryInfoComponent,
    ContestMajorityElectionResultInputComponent,
    MajorityElectionBundleTableComponent,
    ContestMajorityElectionDetailDetailedComponent,
    ContestMajorityElectionDetailFinalResultsComponent,
    ContestHeaderComponent,
    CommentsDialogComponent,
    ProportionalElectionResultsComponent,
    ContestMajorityElectionDetailHeaderComponent,
    ContestProportionalElectionDetailHeaderComponent,
    BreadcrumbsComponent,
    ContactPersonEditComponent,
    ContactPersonDialogComponent,
    ProportionalElectionBallotCandidatesChooseDialogComponent,
    ProportionalElectionBallotCandidatesChooseEntryComponent,
    ResultBundleStateChipComponent,
    ContestVoteDetailResultEntryParamsComponent,
    ContestVoteDetailDetailedComponent,
    VoteBundleOverviewComponent,
    VoteInfoComponent,
    VoteBundleTableComponent,
    VoteBallotComponent,
    VoteBallotContentComponent,
    VoteBallotQuestionAnswerComponent,
    VoteBallotQuestionAnswerButtonComponent,
    VoteBallotReviewComponent,
    PoliticalBusinessNewBundleNumberComponent,
    ContestDetailVotingCardsExpansionPanelComponent,
    VotingDataSourceTabsComponent,
    ValidationOverviewDialogComponent,
    ValidationResultComponent,
    ValidationSummaryComponent,
    BallotHeaderComponent,
    ProportionalElectionBallotCandidateRemoveRangeComponent,
    MajorityElectionWriteInMappingComponent,
    MajorityElectionWriteInMappingDialogComponent,
    ContestDetailVotingCardsElectorateComponent,
    TranslateVoteQuestionPipe,
    ContestPastUnlockDialogComponent,
    SecondFactorTransactionDialogComponent,
    ShortcutDialogComponent,
    AdmonitionComponent,
    ResultExportComponent,
    ValidationGroupPipe,
    PermissionDirective,
    ContestStateChangeButtonComponent,
    ContestDetailInfoComponent,
    ContestDetailInfoDialogComponent,
    ContestVoteDetailResultsGraphComponent,
    ContactDialogComponent,
    ContestDetailSubmissionTileComponent,
    ContestCountingCircleElectoratesUpdateDialogComponent,
    ContestCountingCircleElectorateAssignDialogComponent,
    BooleanStatusLabelComponent,
    ValidValidationPipe,
    ButtonBarComponent,
  ],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    VotingLibModule,
    BreadcrumbsModule,
    BreadcrumbItemModule,
    TranslateModule,
    FormfieldModule,
    FormsModule,
    ButtonModule,
    ExpansionPanelModule,
    DropdownModule,
    SpinnerModule,
    MatDialogModule,
    RadioButtonModule,
    CheckboxModule,
    TextareaModule,
    IconModule,
    MatStepperModule,
    MatIconModule,
    DndModule,
    LabelModule,
    NumberModule,
    TextModule,
    StatusLabelModule,
    TabsModule,
    TableModule,
    LoadingBarModule,
    MatMenuModule,
    MatButtonModule,
    DividerModule,
    TooltipModule,
  ],
  exports: [
    ContestDetailComponent,
    ContestOverviewComponent,
    SelectCountingCircleDialogComponent,
    ProportionalElectionUnmodifiedListsComponent,
    ProportionalElectionBundleOverviewComponent,
    ProportionalElectionBallotComponent,
    MajorityElectionBallotGroupsComponent,
    MajorityElectionBallotComponent,
    MajorityElectionBallotReviewComponent,
    MajorityElectionBundleOverviewComponent,
    ContestHeaderComponent,
    ContestDetailCountOfVotersComponent,
    ContestDetailVotingCardsComponent,
    InfoPanelComponent,
    InfoPanelEntryComponent,
    VoteResultsGraphComponent,
    BreadcrumbsComponent,
    VoteBundleOverviewComponent,
    VotingDataSourceTabsComponent,
    TranslateVoteQuestionPipe,
    ResultStateBoxComponent,
    ValidationOverviewDialogComponent,
    ContestDetailInfoComponent,
    BooleanStatusLabelComponent,
    AdmonitionComponent,
  ],
})
export class AusmittlungLibModule {
  public static forRoot(
    votingBasisWebAppUrl?: string,
    votingAusmittlungMonitoringWebApp?: string,
  ): ModuleWithProviders<AusmittlungLibModule> {
    return {
      ngModule: AusmittlungLibModule,
      providers: [
        {
          provide: VOTING_BASIS_WEBAPP_URL,
          useValue: votingBasisWebAppUrl,
        },
        {
          provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
          useValue: { subscriptSizing: 'dynamic' },
        },
        {
          provide: VOTING_AUSMITTLUNG_MONITORING_WEBAPP_URL,
          useValue: votingAusmittlungMonitoringWebApp,
        },
      ],
    };
  }
}
