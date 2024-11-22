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
  FORMFIELD_DEFAULT_OPTIONS,
  RoleModule,
  SnackbarModule,
  SpinnerModule,
  TableModule,
  TenantModule,
  UserModule,
} from '@abraxas/base-components';
import { ENV_INJECTION_TOKEN, GRPC_INTERCEPTORS, VotingLibModule } from '@abraxas/voting-lib';
import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import localeDeCh from '@angular/common/locales/de-CH';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AusmittlungLibModule, getCommonProviders, GRPC_ENV_INJECTION_TOKEN, REST_API_URL_INJECTION_TOKEN } from 'ausmittlung-lib';
import { GrpcLanguageInterceptor } from '../../../ausmittlung-lib/src/lib/services/interceptors/grpc-language.interceptor';
import { HttpLanguageInterceptor } from '../../../ausmittlung-lib/src/lib/services/interceptors/http-language.interceptor';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ErfassungContestDetailComponent } from './pages/erfassung-contest-detail/erfassung-contest-detail.component';
import { ErfassungContestOverviewComponent } from './pages/erfassung-contest-overview/erfassung-contest-overview.component';
import { TranslationLoader } from './services/translation-loader';
import { ErfassungFinishSubmissionComponent } from './pages/erfassung-finish-submission/erfassung-finish-submission.component';

registerLocaleData(localeDeCh);

@NgModule({
  declarations: [AppComponent, ErfassungContestOverviewComponent, ErfassungContestDetailComponent, ErfassungFinishSubmissionComponent],
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
    SnackbarModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useClass: TranslationLoader,
      },
    }),
    VotingLibModule.forRoot(environment.restApiEndpoint),
    AusmittlungLibModule.forRoot(environment.votingBasisWebApp, environment.votingAusmittlungMonitoringWebApp),
    BreadcrumbItemModule,
    BreadcrumbsModule,
    AppHeaderBarIamModule,
    AppHeaderBarModule,
    ButtonModule,
    TableModule,
    CheckboxModule,
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
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
