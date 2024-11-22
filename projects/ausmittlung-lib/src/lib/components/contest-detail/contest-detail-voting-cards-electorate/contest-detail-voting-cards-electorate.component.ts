/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DomainOfInfluenceType } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/domain_of_influence_pb';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ElectorateVotingCardResultDetail, VotingCardResultDetail, VotingChannel } from '../../../models';
import { sum } from '../../../services/utils/array.utils';
import { TranslateService } from '@ngx-translate/core';
import { DomainOfInfluenceCanton } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/domain_of_influence_pb';

@Component({
  selector: 'vo-ausm-contest-detail-voting-cards-electorate',
  templateUrl: './contest-detail-voting-cards-electorate.component.html',
  styleUrls: ['./contest-detail-voting-cards-electorate.component.scss'],
})
export class ContestDetailVotingCardsElectorateComponent {
  public readonly votingChannels: typeof VotingChannel = VotingChannel;
  public readonly domainOfInfluenceCantons: typeof DomainOfInfluenceCanton = DomainOfInfluenceCanton;
  public expansionPanelHeaderTitle: string = '';

  @Input()
  public readonly: boolean = true;

  @Input()
  public set domainOfInfluenceTypes(v: DomainOfInfluenceType[]) {
    this.expansionPanelHeaderTitle = this.i18n.instant('DOMAIN_OF_INFLUENCE.TYPE', {
      type: v.map(d => this.i18n.instant(`DOMAIN_OF_INFLUENCE_TYPES.${d}`)).join(', '),
    });
  }

  constructor(private readonly i18n: TranslateService) {}

  @Input()
  public canton: DomainOfInfluenceCanton = DomainOfInfluenceCanton.DOMAIN_OF_INFLUENCE_CANTON_UNSPECIFIED;

  public total: number = 0;
  public totalValid: number = 0;
  public hasInvalidVotingCardChannel: boolean = false;
  public votingCardDetailsValue: ElectorateVotingCardResultDetail[] = [];

  @Input()
  public set votingCardDetails(votingCardDetails: ElectorateVotingCardResultDetail[]) {
    this.votingCardDetailsValue = votingCardDetails;
    this.hasInvalidVotingCardChannel = this.votingCardDetailsValue.some(x => !x.valid);
    this.updateTotals();
  }

  @Output()
  public votingCardDetailsChange: EventEmitter<ElectorateVotingCardResultDetail[]> = new EventEmitter<ElectorateVotingCardResultDetail[]>();

  public update(detail: VotingCardResultDetail, value?: number): void {
    detail.countOfReceivedVotingCards = value;
    this.updateTotals();
    this.votingCardDetailsChange.emit(this.votingCardDetailsValue);
  }

  private updateTotals(): void {
    this.total = sum(this.votingCardDetailsValue, x => x.countOfReceivedVotingCards ?? 0);
    this.totalValid = sum(
      this.votingCardDetailsValue.filter(x => x.valid),
      x => x.countOfReceivedVotingCards ?? 0,
    );
  }
}
