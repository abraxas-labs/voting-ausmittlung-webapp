/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ActivatedRouteSnapshot, Route } from '@angular/router';
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
import { ResultCantonDefaultsResolver } from './services/resolvers/result-canton-defaults.resolver';
import { HasUnsavedChangesGuard } from './services/guards/has-unsaved-changes.guard';
import { inject } from '@angular/core';
import { SystemBusyComponent } from './pages/system-busy/system-busy.component';

export const proportionalElectionResultRoute: Route = {
  path: 'proportional-election-result/:resultId',
  children: [
    {
      path: 'unmodified',
      component: ProportionalElectionUnmodifiedListsComponent,
      resolve: {
        contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ResultCantonDefaultsResolver).resolve(route),
      },
      canDeactivate: [HasUnsavedChangesGuard],
    },
    {
      path: 'bundles',
      children: [
        {
          path: '',
          pathMatch: 'full',
          component: ProportionalElectionBundleOverviewComponent,
          resolve: {
            contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ResultCantonDefaultsResolver).resolve(route),
          },
        },
        {
          path: ':bundleId/review',
          component: ProportionalElectionBallotReviewComponent,
          resolve: {
            contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ResultCantonDefaultsResolver).resolve(route),
          },
        },
        {
          path: ':bundleId/:ballotNumber',
          component: ProportionalElectionBallotComponent,
          resolve: {
            contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ResultCantonDefaultsResolver).resolve(route),
          },
          canDeactivate: [HasUnsavedChangesGuard],
        },
      ],
    },
    {
      path: 'results',
      component: ProportionalElectionResultsComponent,
      resolve: {
        contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ResultCantonDefaultsResolver).resolve(route),
      },
    },
  ],
};

export const majorityElectionResultRoute: Route = {
  path: 'majority-election-result/:resultId',
  children: [
    {
      path: 'ballot-groups',
      component: MajorityElectionBallotGroupsComponent,
      resolve: {
        contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ResultCantonDefaultsResolver).resolve(route),
      },
      canDeactivate: [HasUnsavedChangesGuard],
    },
    {
      path: 'bundles',
      children: [
        {
          path: '',
          pathMatch: 'full',
          component: MajorityElectionBundleOverviewComponent,
          resolve: {
            contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ResultCantonDefaultsResolver).resolve(route),
          },
        },
        {
          path: ':bundleId/review',
          component: MajorityElectionBallotReviewComponent,
          resolve: {
            contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ResultCantonDefaultsResolver).resolve(route),
          },
        },
        {
          path: ':bundleId/:ballotNumber',
          component: MajorityElectionBallotComponent,
          resolve: {
            contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ResultCantonDefaultsResolver).resolve(route),
          },
          canDeactivate: [HasUnsavedChangesGuard],
        },
      ],
    },
  ],
};

export const voteResultRoute: Route = {
  path: 'vote-result/:resultId/ballot-result/:ballotResultId',
  children: [
    {
      path: 'bundles',
      children: [
        {
          path: '',
          pathMatch: 'full',
          component: VoteBundleOverviewComponent,
          resolve: {
            contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ResultCantonDefaultsResolver).resolve(route),
          },
        },
        {
          path: ':bundleId/review',
          component: VoteBallotReviewComponent,
          resolve: {
            contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ResultCantonDefaultsResolver).resolve(route),
          },
        },
        {
          path: ':bundleId/:ballotNumber',
          component: VoteBallotComponent,
          resolve: {
            contestCantonDefaults: (route: ActivatedRouteSnapshot) => inject(ResultCantonDefaultsResolver).resolve(route),
          },
          canDeactivate: [HasUnsavedChangesGuard],
        },
      ],
    },
  ],
};

export const systemBusyRoute: Route = {
  path: 'system-busy',
  component: SystemBusyComponent,
};
