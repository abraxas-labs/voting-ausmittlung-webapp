/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  AppHeaderBarIamModule,
  AppHeaderBarModule,
  AuthenticationModule,
  AuthorizationModule,
  BreadcrumbItemModule,
  BreadcrumbsModule,
  ButtonModule,
  CheckboxModule,
  DividerModule,
  DropdownModule,
  FORMFIELD_DEFAULT_OPTIONS,
  FormfieldModule,
  IconModule,
  LabelModule,
  NumberModule,
  RadioButtonModule,
  RoleModule,
  SegmentedControlGroupModule,
  SnackbarModule,
  SpinnerModule,
  StatusLabelModule,
  SwitchModule,
  TableModule,
  TabsModule,
  TenantModule,
  TextModule,
  TooltipModule,
  UserModule,
} from '@abraxas/base-components';
import { ENV_INJECTION_TOKEN, GRPC_INTERCEPTORS, VotingLibModule } from '@abraxas/voting-lib';
import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import localeDeCh from '@angular/common/locales/de-CH';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import {
  AusmittlungLibModule,
  BreadcrumbsService as BaseBreadcrumbsService,
  getCommonProviders,
  GRPC_ENV_INJECTION_TOKEN,
  REST_API_URL_INJECTION_TOKEN,
} from 'ausmittlung-lib';
import { GrpcLanguageInterceptor } from '../../../ausmittlung-lib/src/lib/services/interceptors/grpc-language.interceptor';
import { HttpLanguageInterceptor } from '../../../ausmittlung-lib/src/lib/services/interceptors/http-language.interceptor';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BallotEndResultCountOfVotersComponent } from './components/ballot-end-result/ballot-end-result-count-of-voters/ballot-end-result-count-of-voters.component';
import { BallotEndResultComponent } from './components/ballot-end-result/ballot-end-result.component';
import { QuestionCountingCircleAlgorithmEndResultComponent } from './components/ballot-end-result/question-counting-circle-algorithm-end-result/question-counting-circle-algorithm-end-result';
import { QuestionEndResultEntryComponent } from './components/ballot-end-result/question-end-result-entry/question-end-result-entry.component';
import { QuestionPopularMajorityAlgorithmEndResultComponent } from './components/ballot-end-result/question-popular-majority-algorithm-end-result/question-popular-majority-algorithm-end-result.component';
import { EndResultPageComponent } from './components/end-result-page/end-result-page.component';
import { ExportCockpitDialogComponent } from './components/export-cockpit-dialog/export-cockpit-dialog.component';
import { ImportFileSelectComponent } from './components/result-import-dialog/import-file-select/import-file-select.component';
import { MajorityElectionEndResultCandidatesListComponent } from './components/majority-election-end-result-candidates-list/majority-election-end-result-candidates-list.component';
import { MajorityElectionLotDecisionDialogComponent } from './components/majority-election-lot-decision-dialog/majority-election-lot-decision-dialog.component';
import { MajorityElectionLotDecisionListComponent } from './components/majority-election-lot-decision-dialog/majority-election-lot-decision-list/majority-election-lot-decision-list.component';
import { MonitoringCockpitGridEntryComponent } from './components/monitoring-cockpit-grid-entry/monitoring-cockpit-grid-entry.component';
import { MonitoringCockpitGridFooterButtonsComponent } from './components/monitoring-cockpit-grid-footer/monitoring-cockpit-grid-footer-buttons/monitoring-cockpit-grid-footer-buttons.component';
import { MonitoringCockpitGridFooterComponent } from './components/monitoring-cockpit-grid-footer/monitoring-cockpit-grid-footer.component';
import { MonitoringCockpitGridComponent } from './components/monitoring-cockpit-grid/monitoring-cockpit-grid.component';
import { ProportionalElectionLotDecisionDialogComponent } from './components/proportional-election-lot-decision-dialog/proportional-election-lot-decision-dialog.component';
import { ResultImportDialogComponent } from './components/result-import-dialog/result-import-dialog.component';
import { ResultImportListDialogComponent } from './components/result-import-list-dialog/result-import-list-dialog.component';
import { MajorityElectionEndResultComponent } from './pages/majority-election-end-result/majority-election-end-result.component';
import { MonitoringContestDetailComponent } from './pages/monitoring-contest-detail/monitoring-contest-detail.component';
import { MonitoringContestOverviewComponent } from './pages/monitoring-contest-overview/monitoring-contest-overview.component';
import { MonitoringOverviewComponent } from './pages/monitoring-overview/monitoring-overview.component';
import { ProportionalElectionEndResultComponent } from './pages/proportional-election-end-result/proportional-election-end-result.component';
import { VoteEndResultComponent } from './pages/vote-end-result/vote-end-result.component';
import { BreadcrumbsService } from './services/breadcrumbs.service';
import { TranslationLoader } from './services/translation-loader';
import { ExportCockpitPoliticalBusinessesComponent } from './components/export-cockpit-political-businesses/export-cockpit-political-businesses.component';
import { ProportionalElectionManualEndResultDialogComponent } from './components/proportional-election-manual-end-result-dialog/proportional-election-manual-end-result-dialog.component';
import { MonitoringPoliticalBusinessesOverviewComponent } from './components/monitoring-political-businesses-overview/monitoring-political-businesses-overview.component';
import { ProportionalElectionUnionEndResultComponent } from './pages/proportional-election-union-end-result/proportional-election-union-end-result.component';
import { ProportionalElectionUnionDoubleProportionalResultComponent } from './pages/proportional-election-union-double-proportional-result/proportional-election-union-double-proportional-result.component';
import { DoubleProportionalResultSubApportionmentComponent } from './components/double-proportional-result-sub-apportionment/double-proportional-result-sub-apportionment.component';
import { DoubleProportionalResultSuperApportionmentComponent } from './components/double-proportional-result-super-apportionment/double-proportional-result-super-apportionment.component';
import { ProportionalElectionDoubleProportionalResultComponent } from './pages/proportional-election-double-proportional-result/proportional-election-double-proportional-result.component';
import { MonitoringCockpitGridStatusBarComponent } from './components/monitoring-cockpit-grid-status-bar/monitoring-cockpit-grid-status-bar.component';
import { MatTooltip } from '@angular/material/tooltip';
import { DoubleProportionalResultSuperApportionmentLotDecisionComponent } from './components/double-proportional-result-super-apportionment-lot-decision/double-proportional-result-super-apportionment-lot-decision.component';
import { DoubleProportionalResultSubApportionmentLotDecisionComponent } from './components/double-proportional-result-sub-apportionment-lot-decision/double-proportional-result-sub-apportionment-lot-decision.component';
import { PoliticalBusinessTableComponent } from './components/political-business-table/political-business-table.component';
import { CountingCircleTableComponent } from './components/counting-circle-table/counting-circle-table.component';
import { EndResultStepActionBarComponent } from './components/end-result-step-action-bar/end-result-step-action-bar.component';
import { ProportionalElectionListLotDecisionsDialogComponent } from './components/proportional-election-list-lot-decisions-dialog/proportional-election-list-lot-decisions-dialog.component';
import { ProportionalElectionListLotDecisionEditDialogComponent } from './components/proportional-election-list-lot-decision-edit-dialog/proportional-election-list-lot-decision-edit-dialog.component';
import { ProportionalElectionListLotDecisionEditListsTableComponent } from './components/proportional-election-list-lot-decision-edit-dialog/proportional-election-list-lot-decision-edit-lists-table/proportional-election-list-lot-decision-edit-lists-table.component';
import { ProportionalElectionListLotDecisionEditListUnionsTableComponent } from './components/proportional-election-list-lot-decision-edit-dialog/proportional-election-list-lot-decision-edit-list-unions-table/proportional-election-list-lot-decision-edit-list-unions-table.component';
import { StorageService } from './services/storage.service';

registerLocaleData(localeDeCh);

@NgModule({
  declarations: [
    AppComponent,
    MonitoringCockpitGridComponent,
    MonitoringCockpitGridEntryComponent,
    MonitoringContestDetailComponent,
    MonitoringContestOverviewComponent,
    MonitoringOverviewComponent,
    MonitoringCockpitGridFooterComponent,
    EndResultPageComponent,
    VoteEndResultComponent,
    BallotEndResultComponent,
    BallotEndResultCountOfVotersComponent,
    QuestionPopularMajorityAlgorithmEndResultComponent,
    QuestionEndResultEntryComponent,
    QuestionCountingCircleAlgorithmEndResultComponent,
    MajorityElectionEndResultComponent,
    MajorityElectionEndResultCandidatesListComponent,
    MajorityElectionLotDecisionDialogComponent,
    MajorityElectionLotDecisionListComponent,
    ProportionalElectionEndResultComponent,
    ProportionalElectionLotDecisionDialogComponent,
    ProportionalElectionManualEndResultDialogComponent,
    MonitoringCockpitGridFooterButtonsComponent,
    ImportFileSelectComponent,
    ResultImportDialogComponent,
    ResultImportListDialogComponent,
    ExportCockpitDialogComponent,
    ExportCockpitPoliticalBusinessesComponent,
    MonitoringPoliticalBusinessesOverviewComponent,
    ProportionalElectionUnionEndResultComponent,
    ProportionalElectionUnionDoubleProportionalResultComponent,
    DoubleProportionalResultSuperApportionmentComponent,
    DoubleProportionalResultSuperApportionmentLotDecisionComponent,
    DoubleProportionalResultSubApportionmentLotDecisionComponent,
    DoubleProportionalResultSubApportionmentComponent,
    MonitoringCockpitGridStatusBarComponent,
    ProportionalElectionDoubleProportionalResultComponent,
    PoliticalBusinessTableComponent,
    CountingCircleTableComponent,
    EndResultStepActionBarComponent,
    ProportionalElectionListLotDecisionEditDialogComponent,
    ProportionalElectionListLotDecisionsDialogComponent,
    ProportionalElectionListLotDecisionEditListsTableComponent,
    ProportionalElectionListLotDecisionEditListUnionsTableComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AuthenticationModule.forAuthentication(environment.authenticationConfig),
    AuthorizationModule.forAuthorization(environment),
    RoleModule.forRoot(environment),
    UserModule.forRoot(environment),
    TenantModule.forRoot(environment),
    SpinnerModule,
    ButtonModule,
    CheckboxModule,
    TableModule,
    SnackbarModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useClass: TranslationLoader,
      },
    }),
    BreadcrumbItemModule,
    BreadcrumbsModule,
    VotingLibModule.forRoot(environment.restApiEndpoint),
    AusmittlungLibModule.forRoot(environment.votingBasisWebApp),
    DropdownModule,
    IconModule,
    RadioButtonModule,
    MatStepperModule,
    MatIconModule,
    FormfieldModule,
    FormsModule,
    TextModule,
    NumberModule,
    LabelModule,
    TabsModule,
    AppHeaderBarIamModule,
    AppHeaderBarModule,
    TooltipModule,
    SegmentedControlGroupModule,
    MatTooltip,
    SwitchModule,
    StatusLabelModule,
    DividerModule,
  ],
  providers: [
    ...getCommonProviders(),
    {
      provide: GRPC_ENV_INJECTION_TOKEN,
      useValue: environment,
    },
    {
      provide: ENV_INJECTION_TOKEN,
      useValue: environment.env,
    },
    {
      provide: REST_API_URL_INJECTION_TOKEN,
      useValue: environment.restApiEndpoint,
    },
    {
      provide: BaseBreadcrumbsService,
      useClass: BreadcrumbsService,
    },
    {
      provide: GRPC_INTERCEPTORS,
      multi: true,
      useClass: GrpcLanguageInterceptor,
    },
    {
      provide: HTTP_INTERCEPTORS,
      multi: true,
      useClass: HttpLanguageInterceptor,
    },
    {
      provide: FORMFIELD_DEFAULT_OPTIONS,
      useValue: { optionalText: 'optional' },
    },
    StorageService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
