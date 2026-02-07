/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnDestroy, inject } from '@angular/core';
import { Contest, CountOfVotersInformation, PoliticalBusiness, VoterType, VotingCardResultDetail } from 'ausmittlung-lib';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router, RouterLink, UrlTree } from '@angular/router';
import { ThemeService } from '@abraxas/voting-lib';

@Component({
  selector: 'app-end-result-page',
  templateUrl: './end-result-page.component.html',
  standalone: false,
})
export class EndResultPageComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly themeService = inject(ThemeService);

  public hasPoliticalBusinessUnionContext: boolean = false;
  public partialUnionResultRoute: RouterLink['routerLink'] = [];

  @Input()
  public loading: boolean = false;

  @Input()
  public contest?: Contest;

  @Input()
  public isPartialResult: boolean = false;

  @Input()
  public enabledVoterTypes?: VoterType[];

  @Input()
  public countOfVotersInformation?: CountOfVotersInformation;

  @Input()
  public votingCards?: VotingCardResultDetail[];

  @Input()
  public politicalBusiness?: PoliticalBusiness;

  @Input()
  public accessiblePoliticalBusinesses: PoliticalBusiness[] = [];

  @Input()
  public showExport = false;

  private readonly routeSubscription: Subscription;

  constructor() {
    this.routeSubscription = this.route.params.subscribe(({ politicalBusinessUnionId }) => {
      this.hasPoliticalBusinessUnionContext = !!politicalBusinessUnionId;
    });

    this.partialUnionResultRoute = this.router.createUrlTree(['../../'], {
      relativeTo: this.route,
      queryParams: {
        partialResult: true,
      },
    });
  }

  public async ngOnDestroy(): Promise<void> {
    this.routeSubscription.unsubscribe();
  }

  public async export(): Promise<void> {
    if (!this.contest) {
      return;
    }

    await this.router.navigate([this.themeService.theme$.value, 'contests', this.contest.id, 'exports']);
  }
}
