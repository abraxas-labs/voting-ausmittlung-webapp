/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CountingCircleElectorate, CountOfVotersInformationSubTotal, DomainOfInfluenceType, SexType, VoterType } from '../../../models';
import { groupBy, sum } from '../../../services/utils/array.utils';

@Component({
  selector: 'vo-ausm-contest-detail-count-of-voters',
  templateUrl: './contest-detail-count-of-voters.component.html',
  styleUrls: ['./contest-detail-count-of-voters.component.scss'],
  standalone: false,
})
export class ContestDetailCountOfVotersComponent {
  public electorateVoterTypeGroupsSummaries: ElectorateVoterTypeGroupsSummary[] = [];

  @Input()
  public readonly: boolean = true;

  @Input()
  public enabledVoterTypes: VoterType[] = [];

  @Input()
  public eVoting: boolean = false;

  private countOfVotersInformationSubTotalsValue: CountOfVotersInformationSubTotal[] = [];
  private domainOfInfluenceTypesValue: DomainOfInfluenceType[] = [];
  private voterTypeGroupsByDoiType: { -readonly [key in keyof typeof DomainOfInfluenceType]?: SimpleVoterTypeGroup[] } = {};
  private electoratesValue: CountingCircleElectorate[] = [];

  public get countOfVotersInformationSubTotals(): CountOfVotersInformationSubTotal[] {
    return this.countOfVotersInformationSubTotalsValue;
  }

  @Input()
  public set countOfVotersInformationSubTotals(v: CountOfVotersInformationSubTotal[]) {
    this.countOfVotersInformationSubTotalsValue = v;
    this.countOfVotersInformationSubTotalsValue = this.countOfVotersInformationSubTotals.filter(s =>
      this.enabledVoterTypes.includes(s.voterType),
    );

    this.updateVoterTypeGroups();
    this.updateTotal();
  }

  public get electorates(): CountingCircleElectorate[] {
    return this.electoratesValue;
  }

  @Input()
  public set electorates(v: CountingCircleElectorate[]) {
    if (v === this.electoratesValue) {
      return;
    }

    this.electoratesValue = v;
    this.updateVoterTypeGroups();
  }

  public get domainOfInfluenceTypes(): DomainOfInfluenceType[] {
    return this.domainOfInfluenceTypesValue;
  }

  @Input()
  public set domainOfInfluenceTypes(v: DomainOfInfluenceType[]) {
    if (v === this.domainOfInfluenceTypesValue) {
      return;
    }

    this.domainOfInfluenceTypesValue = v;
    this.updateVoterTypeGroups();
  }

  @Output()
  public countOfVotersInformationSubTotalChange: EventEmitter<CountOfVotersInformationSubTotal[]> = new EventEmitter<
    CountOfVotersInformationSubTotal[]
  >();

  private getDetail(voterType: VoterType, sex: SexType, domainOfInfluenceType: DomainOfInfluenceType): CountOfVotersInformationSubTotal {
    let result = this.countOfVotersInformationSubTotals.find(
      c => c.voterType === voterType && c.sex === sex && c.domainOfInfluenceType === domainOfInfluenceType,
    );
    if (result) {
      return result;
    }

    // don't set the numeric value => textfield should be empty as long as no input is provided
    result = {
      sex,
      voterType,
      domainOfInfluenceType,
    } as CountOfVotersInformationSubTotal;

    this.countOfVotersInformationSubTotals.push(result);
    return result;
  }

  public handleVoterTypeGroupsChange(electorateVoterTypeGroups: ElectorateSimpleVoterTypeGroup[]) {
    const electorateDoiTypes = electorateVoterTypeGroups[0].domainOfInfluenceTypes;

    for (const doiType of electorateDoiTypes) {
      const doiVoterTypeGroups = this.voterTypeGroupsByDoiType[doiType]!;

      for (const doiVoterTypeGroup of doiVoterTypeGroups) {
        const electorateVoterTypeGroup = electorateVoterTypeGroups.find(e => e.voterType === doiVoterTypeGroup.voterType);
        doiVoterTypeGroup.menSubTotal.countOfVoters = electorateVoterTypeGroup?.menSubTotal.countOfVoters;
        doiVoterTypeGroup.womenSubTotal.countOfVoters = electorateVoterTypeGroup?.womenSubTotal.countOfVoters;
      }
    }

    this.updateTotal();
  }

  private updateVoterTypeGroups(): void {
    if (this.domainOfInfluenceTypes.length === 0 || this.countOfVotersInformationSubTotals.length === 0) {
      return;
    }

    const subTotalsByDoiType = groupBy(
      this.countOfVotersInformationSubTotalsValue,
      x => x.domainOfInfluenceType,
      x => x,
    );

    this.voterTypeGroupsByDoiType = {};

    for (const doiType of this.domainOfInfluenceTypesValue) {
      const subTotals = subTotalsByDoiType[doiType];
      const voterTypeGroups = [];

      const swissInfos = subTotals.filter(x => x.voterType === VoterType.VOTER_TYPE_SWISS);
      const swissAbroadInfos = subTotals.filter(x => x.voterType === VoterType.VOTER_TYPE_SWISS_ABROAD);
      const foreignerInfos = subTotals.filter(x => x.voterType === VoterType.VOTER_TYPE_FOREIGNER);
      const minorInfos = subTotals.filter(x => x.voterType === VoterType.VOTER_TYPE_MINOR);

      voterTypeGroups.push({
        label: 'CONTEST.DETAIL.SWISS',
        voterType: VoterType.VOTER_TYPE_SWISS,
        menSubTotal: this.getDetail(VoterType.VOTER_TYPE_SWISS, SexType.SEX_TYPE_MALE, doiType),
        womenSubTotal: this.getDetail(VoterType.VOTER_TYPE_SWISS, SexType.SEX_TYPE_FEMALE, doiType),
        total: sum(Object.values(swissInfos), x => x.countOfVoters),
        domainOfInfluenceType: doiType,
      });

      if (this.enabledVoterTypes.includes(VoterType.VOTER_TYPE_SWISS_ABROAD)) {
        voterTypeGroups.push({
          label: 'CONTEST.DETAIL.SWISS_ABROAD',
          voterType: VoterType.VOTER_TYPE_SWISS_ABROAD,
          menSubTotal: this.getDetail(VoterType.VOTER_TYPE_SWISS_ABROAD, SexType.SEX_TYPE_MALE, doiType),
          womenSubTotal: this.getDetail(VoterType.VOTER_TYPE_SWISS_ABROAD, SexType.SEX_TYPE_FEMALE, doiType),
          total: sum(Object.values(swissAbroadInfos), x => x.countOfVoters),
          domainOfInfluenceType: doiType,
        });
      }

      if (this.enabledVoterTypes.includes(VoterType.VOTER_TYPE_FOREIGNER)) {
        voterTypeGroups.push({
          label: 'CONTEST.DETAIL.FOREIGNER',
          voterType: VoterType.VOTER_TYPE_FOREIGNER,
          menSubTotal: this.getDetail(VoterType.VOTER_TYPE_FOREIGNER, SexType.SEX_TYPE_MALE, doiType),
          womenSubTotal: this.getDetail(VoterType.VOTER_TYPE_FOREIGNER, SexType.SEX_TYPE_FEMALE, doiType),
          total: sum(Object.values(foreignerInfos), x => x.countOfVoters),
          domainOfInfluenceType: doiType,
        });
      }

      if (this.enabledVoterTypes.includes(VoterType.VOTER_TYPE_MINOR)) {
        voterTypeGroups.push({
          label: 'CONTEST.DETAIL.MINOR',
          voterType: VoterType.VOTER_TYPE_MINOR,
          menSubTotal: this.getDetail(VoterType.VOTER_TYPE_MINOR, SexType.SEX_TYPE_MALE, doiType),
          womenSubTotal: this.getDetail(VoterType.VOTER_TYPE_MINOR, SexType.SEX_TYPE_FEMALE, doiType),
          total: sum(Object.values(minorInfos), x => x.countOfVoters),
          domainOfInfluenceType: doiType,
        });
      }

      this.voterTypeGroupsByDoiType[doiType] = voterTypeGroups;
    }

    this.buildElectorateVoterTypeGroups();
  }

  public updateTotal(): void {
    for (const summary of this.electorateVoterTypeGroupsSummaries) {
      for (const voterTypeGroup of summary.voterTypeGroups) {
        voterTypeGroup.total = (voterTypeGroup.menSubTotal.countOfVoters ?? 0) + (voterTypeGroup.womenSubTotal.countOfVoters ?? 0);
      }
    }

    if (!this.readonly) {
      this.countOfVotersInformationSubTotalChange.emit(this.countOfVotersInformationSubTotals);
    }
  }

  private buildElectorateVoterTypeGroups(): void {
    this.electorateVoterTypeGroupsSummaries = [];

    if (!this.electorates || this.electorates.length == 0) {
      for (const doiType of this.domainOfInfluenceTypes) {
        this.buildElectorateSummariesByDoiSubTotals(this.voterTypeGroupsByDoiType[doiType]!, [doiType]);
      }
      return;
    }

    for (const electorate of this.electorates) {
      this.buildElectorateSummariesByDoiSubTotals(
        this.voterTypeGroupsByDoiType[electorate.domainOfInfluenceTypesList[0]]!,
        electorate.domainOfInfluenceTypesList,
      );
    }
  }

  private buildElectorateSummariesByDoiSubTotals(voterTypeGroups: SimpleVoterTypeGroup[], domainOfInfluenceTypes: DomainOfInfluenceType[]) {
    const electorateVoterTypeGroups: ElectorateSimpleVoterTypeGroup[] = voterTypeGroups.map(g => ({
      ...g,
      domainOfInfluenceType: undefined,
      domainOfInfluenceTypes,
    }));

    this.electorateVoterTypeGroupsSummaries.push({
      voterTypeGroups: electorateVoterTypeGroups,
      domainOfInfluenceTypes,
    });
  }
}

export interface SimpleVoterTypeGroup {
  label: string;
  voterType: VoterType;
  menSubTotal: CountOfVotersInformationSubTotal;
  womenSubTotal: CountOfVotersInformationSubTotal;
  total: number;
  domainOfInfluenceType: DomainOfInfluenceType;
}

interface ElectorateSimpleVoterTypeGroup {
  label: string;
  voterType: VoterType;
  menSubTotal: CountOfVotersInformationSubTotal;
  womenSubTotal: CountOfVotersInformationSubTotal;
  total: number;
  domainOfInfluenceTypes: DomainOfInfluenceType[];
}

interface ElectorateVoterTypeGroupsSummary {
  voterTypeGroups: ElectorateSimpleVoterTypeGroup[];
  domainOfInfluenceTypes: DomainOfInfluenceType[];
}
