/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnDestroy } from '@angular/core';
import { Contest, CountOfVotersInformation, DomainOfInfluenceType, VoterType, VotingCardResultDetail } from 'ausmittlung-lib';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { DomainOfInfluenceCanton } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/domain_of_influence_pb';

@Component({
  selector: 'app-end-result-page',
  templateUrl: './end-result-page.component.html',
  standalone: false,
})
export class EndResultPageComponent implements OnDestroy {
  public hasPoliticalBusinessUnionContext: boolean = false;

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
  public domainOfInfluenceType?: DomainOfInfluenceType;

  @Input()
  public canton?: DomainOfInfluenceCanton;

  private readonly routeSubscription: Subscription;

  constructor(route: ActivatedRoute) {
    this.routeSubscription = route.params.subscribe(({ politicalBusinessUnionId }) => {
      this.hasPoliticalBusinessUnionContext = !!politicalBusinessUnionId;
    });
  }

  public async ngOnDestroy(): Promise<void> {
    this.routeSubscription.unsubscribe();
  }
}
