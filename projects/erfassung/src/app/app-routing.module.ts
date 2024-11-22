/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, NgModule } from '@angular/core';
import { ActivatedRouteSnapshot, RouterModule, Routes } from '@angular/router';
import {
  ContestCantonDefaultsResolver,
  HasUnsavedChangesGuard,
  majorityElectionResultRoute,
  proportionalElectionResultRoute,
  ResultExportComponent,
  voteResultRoute,
} from 'ausmittlung-lib';
import { ErfassungContestDetailComponent } from './pages/erfassung-contest-detail/erfassung-contest-detail.component';
import { ErfassungContestOverviewComponent } from './pages/erfassung-contest-overview/erfassung-contest-overview.component';
import { AuthThemeGuard, ThemeService } from '@abraxas/voting-lib';
import { ErfassungFinishSubmissionComponent } from './pages/erfassung-finish-submission/erfassung-finish-submission.component';
import { ContestDateGuard } from './services/contest-date.guard';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ThemeService.NoTheme,
  },
  {
    path: ':theme',
    canActivate: [AuthThemeGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'contests',
      },
      {
        path: 'contests',
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: ErfassungContestOverviewComponent,
            canActivate: [(currentRoute: ActivatedRouteSnapshot) => inject(ContestDateGuard).canActivate(currentRoute)],
          },
          {
            path: ':contestId/:countingCircleId',
            component: ErfassungContestDetailComponent,
            resolve: {
              contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ContestCantonDefaultsResolver).resolve(route),
            },
            canDeactivate: [HasUnsavedChangesGuard],
          },
          {
            path: ':contestId/:countingCircleId/exports',
            component: ResultExportComponent,
            resolve: {
              contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ContestCantonDefaultsResolver).resolve(route),
            },
          },
          {
            path: ':contestId/:countingCircleId/finish-submission',
            component: ErfassungFinishSubmissionComponent,
          },
        ],
      },
      proportionalElectionResultRoute,
      majorityElectionResultRoute,
      voteResultRoute,
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
