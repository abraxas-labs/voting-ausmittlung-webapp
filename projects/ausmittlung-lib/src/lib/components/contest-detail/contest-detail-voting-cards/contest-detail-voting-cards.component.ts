/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  CountingCircleElectorate,
  DomainOfInfluenceType,
  ElectorateVotingCardResultDetail,
  VotingCardChannel,
  VotingCardResultDetail,
} from '../../../models';
import { groupBy } from '../../../services/utils/array.utils';
import { DomainOfInfluenceCanton } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/domain_of_influence_pb';

@Component({
  selector: 'vo-ausm-contest-detail-voting-cards',
  templateUrl: './contest-detail-voting-cards.component.html',
  standalone: false,
})
export class ContestDetailVotingCardsComponent implements OnInit {
  public electorateVotingCardsList: { votingCards: ElectorateVotingCardResultDetail[]; domainOfInfluenceTypes: DomainOfInfluenceType[] }[] =
    [];

  private _votingCardsByDoiType: { -readonly [key in keyof typeof DomainOfInfluenceType]?: VotingCardResultDetail[] } = {};
  private _domainOfInfluenceTypes?: DomainOfInfluenceType[];
  private _enabledVotingCardChannels: VotingCardChannel[] = [];
  private _votingCards?: VotingCardResultDetail[];
  private _readonly: boolean = true;
  private _electorates: CountingCircleElectorate[] = [];
  private initialized: boolean = false;

  @Input()
  public set readonly(v: boolean) {
    if (this._readonly === v) {
      return;
    }

    this._readonly = v;
    this.updateVotingCards();
  }

  public get readonly(): boolean {
    return this._readonly;
  }

  @Input()
  public set electorates(v: CountingCircleElectorate[]) {
    if (v === this._electorates) {
      return;
    }

    this._electorates = v;
    this.updateVotingCards();
  }

  @Output()
  public votingCardsChange: EventEmitter<VotingCardResultDetail[]> = new EventEmitter<VotingCardResultDetail[]>();

  @Input()
  public set domainOfInfluenceTypes(v: DomainOfInfluenceType[]) {
    if (v === this._domainOfInfluenceTypes) {
      return;
    }

    this._domainOfInfluenceTypes = v;
    this.updateVotingCards();
  }

  public get domainOfInfluenceTypes(): DomainOfInfluenceType[] {
    return this._domainOfInfluenceTypes ?? [];
  }

  @Input()
  public set enabledVotingCardChannels(v: VotingCardChannel[]) {
    if (v === this._enabledVotingCardChannels) {
      return;
    }

    this._enabledVotingCardChannels = v;
    this.updateVotingCards();
  }

  @Input()
  public set votingCards(v: VotingCardResultDetail[]) {
    if (v === this._votingCards) {
      return;
    }

    this._votingCards = v;
    this.updateVotingCards();
  }

  @Input()
  public canton: DomainOfInfluenceCanton = DomainOfInfluenceCanton.DOMAIN_OF_INFLUENCE_CANTON_UNSPECIFIED;

  public ngOnInit(): void {
    this.initialized = true;
    this.updateVotingCards();
  }

  public updateVotingCards(): void {
    if (!this.initialized || !this._votingCards || !this._domainOfInfluenceTypes) return;

    const vcByDoiType = groupBy(
      this._votingCards,
      x => x.domainOfInfluenceType,
      x => x,
    );

    const allVotingCards: VotingCardResultDetail[] = [];
    this._votingCardsByDoiType = {};
    for (const doiType of this._domainOfInfluenceTypes) {
      const votingCardsForDoiType = vcByDoiType[doiType] ?? [];
      const byChannel = groupBy(
        votingCardsForDoiType,
        x => x.channel,
        x => x,
      );
      const vcDetails =
        this._enabledVotingCardChannels.length === 0
          ? votingCardsForDoiType
          : this._enabledVotingCardChannels.map(c => ({
              countOfReceivedVotingCards: byChannel[c.votingChannel]?.find(x => x.valid === c.valid)?.countOfReceivedVotingCards,
              domainOfInfluenceType: doiType,
              valid: c.valid,
              channel: c.votingChannel,
            }));
      allVotingCards.push(...vcDetails);
      this._votingCardsByDoiType[doiType] = vcDetails;
    }

    this.buildElectorateVotingCards();

    if (!this.readonly) {
      this._votingCards = allVotingCards;
      this.votingCardsChange.emit(allVotingCards);
    }
  }

  public handleElectorateVotingCardsChange(electorateVotingCards: ElectorateVotingCardResultDetail[]) {
    const electorateDoiTypes = electorateVotingCards[0].domainOfInfluenceTypes;

    for (const doiType of electorateDoiTypes) {
      const doiVotingCards = this._votingCardsByDoiType[doiType]!;

      for (const doiVc of doiVotingCards) {
        const electorateVc = electorateVotingCards.find(e => e.channel === doiVc.channel && e.valid === doiVc.valid)!;
        doiVc.countOfReceivedVotingCards = electorateVc.countOfReceivedVotingCards;
      }
    }

    this.votingCardsChange.emit(this._votingCards);
  }

  private buildElectorateVotingCards(): void {
    this.electorateVotingCardsList = [];

    if (!this._electorates || this._electorates.length == 0) {
      for (const doiType of this.domainOfInfluenceTypes) {
        this.buildElectorateVotingCardsByDoiVotingCards(this._votingCardsByDoiType[doiType]!, [doiType]);
      }
      return;
    }

    for (const electorate of this._electorates) {
      this.buildElectorateVotingCardsByDoiVotingCards(
        this._votingCardsByDoiType[electorate.domainOfInfluenceTypesList[0]]!,
        electorate.domainOfInfluenceTypesList,
      );
    }
  }

  private buildElectorateVotingCardsByDoiVotingCards(
    votingCards: VotingCardResultDetail[],
    domainOfInfluenceTypes: DomainOfInfluenceType[],
  ) {
    let electorateVotingCards: ElectorateVotingCardResultDetail[] = votingCards.map(vc => ({
      channel: vc.channel,
      valid: vc.valid,
      countOfReceivedVotingCards: vc.countOfReceivedVotingCards,
      domainOfInfluenceTypes,
    }));

    this.electorateVotingCardsList.push({
      votingCards: electorateVotingCards,
      domainOfInfluenceTypes,
    });
  }
}
