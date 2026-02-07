/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, NgModule } from '@angular/core';
import { ActivatedRouteSnapshot, RouterModule, Routes } from '@angular/router';
import {
  ContestCantonDefaultsResolver,
  majorityElectionResultRoute,
  proportionalElectionResultRoute,
  ResultExportComponent,
  voteResultRoute,
  PoliticalBusinessCantonDefaultsResolver,
  HasDeactivateGuard,
} from 'ausmittlung-lib';
import { MajorityElectionEndResultComponent } from './pages/majority-election-end-result/majority-election-end-result.component';
import { MonitoringContestDetailComponent } from './pages/monitoring-contest-detail/monitoring-contest-detail.component';
import { MonitoringContestOverviewComponent } from './pages/monitoring-contest-overview/monitoring-contest-overview.component';
import { MonitoringOverviewComponent } from './pages/monitoring-overview/monitoring-overview.component';
import { ProportionalElectionEndResultComponent } from './pages/proportional-election-end-result/proportional-election-end-result.component';
import { VoteEndResultComponent } from './pages/vote-end-result/vote-end-result.component';
import { AuthThemeGuard, ThemeService } from '@abraxas/voting-lib';
import { ProportionalElectionUnionEndResultComponent } from './pages/proportional-election-union-end-result/proportional-election-union-end-result.component';
import { ProportionalElectionUnionDoubleProportionalResultComponent } from './pages/proportional-election-union-double-proportional-result/proportional-election-union-double-proportional-result.component';
import { ProportionalElectionDoubleProportionalResultComponent } from './pages/proportional-election-double-proportional-result/proportional-election-double-proportional-result.component';
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
            component: MonitoringContestOverviewComponent,
            canActivate: [(currentRoute: ActivatedRouteSnapshot) => inject(ContestDateGuard).canActivate(currentRoute)],
          },
          {
            path: ':contestId',
            pathMatch: 'full',
            component: MonitoringOverviewComponent,
            resolve: {
              contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ContestCantonDefaultsResolver).resolve(route),
            },
          },
          {
            path: ':contestId/exports',
            component: ResultExportComponent,
            resolve: {
              contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ContestCantonDefaultsResolver).resolve(route),
              linkBaseUrl: () => '/',
              isMonitoring: () => true,
            },
          },
          {
            path: ':contestId/:countingCircleId',
            component: MonitoringContestDetailComponent,
            resolve: {
              contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ContestCantonDefaultsResolver).resolve(route),
            },
          },
          {
            path: ':contestId/:countingCircleId/exports',
            component: ResultExportComponent,
            resolve: {
              contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ContestCantonDefaultsResolver).resolve(route),
              linkBaseUrl: () => '/',
              isMonitoring: () => true,
            },
          },
        ],
      },
      {
        path: 'vote-end-results/:politicalBusinessId',
        component: VoteEndResultComponent,
        resolve: {
          contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(PoliticalBusinessCantonDefaultsResolver).resolve(route),
        },
      },
      {
        path: 'majority-election-end-results/:politicalBusinessId',
        component: MajorityElectionEndResultComponent,
        resolve: {
          contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(PoliticalBusinessCantonDefaultsResolver).resolve(route),
        },
      },
      {
        path: 'proportional-election-end-results/:politicalBusinessId',
        component: ProportionalElectionEndResultComponent,
        resolve: {
          contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(PoliticalBusinessCantonDefaultsResolver).resolve(route),
        },
      },
      {
        path: 'proportional-election-end-results/:politicalBusinessId/double-proportional-results',
        component: ProportionalElectionDoubleProportionalResultComponent,
        canDeactivate: [HasDeactivateGuard],
      },
      {
        path: 'proportional-election-union-end-results/:politicalBusinessUnionId',
        component: ProportionalElectionUnionEndResultComponent,
      },
      {
        path: 'proportional-election-union-end-results/:politicalBusinessUnionId/proportional-election-end-results/:politicalBusinessId',
        component: ProportionalElectionEndResultComponent,
        resolve: {
          contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(PoliticalBusinessCantonDefaultsResolver).resolve(route),
        },
      },
      {
        path: 'proportional-election-union-end-results/:politicalBusinessUnionId/double-proportional-results',
        component: ProportionalElectionUnionDoubleProportionalResultComponent,
        canDeactivate: [HasDeactivateGuard],
      },
      {
        path: 'proportional-election-union-end-results/:politicalBusinessUnionId/proportional-election-end-results/:politicalBusinessId/double-proportional-results',
        component: ProportionalElectionDoubleProportionalResultComponent,
        resolve: {
          contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(PoliticalBusinessCantonDefaultsResolver).resolve(route),
        },
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
