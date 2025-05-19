/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CountOfVotersInformation, CountOfVotersInformationSubTotal, SexType, VoterType } from '../../../models';
import { sum } from '../../../services/utils/array.utils';

@Component({
  selector: 'vo-ausm-contest-detail-count-of-voters',
  templateUrl: './contest-detail-count-of-voters.component.html',
  styleUrls: ['./contest-detail-count-of-voters.component.scss'],
  standalone: false,
})
export class ContestDetailCountOfVotersComponent {
  @Input()
  public readonly: boolean = true;

  @Input()
  public enabledVoterTypes: VoterType[] = [];

  @Input()
  public eVoting: boolean = false;

  public countOfVotersInformation!: CountOfVotersInformation;
  public voterTypeGroups: SimpleVoterTypeGroup[] = [];

  @Input()
  public set countOfVoters(v: CountOfVotersInformation) {
    this.countOfVotersInformation = v;
    this.countOfVotersInformation.subTotalInfoList = this.countOfVotersInformation.subTotalInfoList.filter(s =>
      this.enabledVoterTypes.includes(s.voterType),
    );

    const swissInfos = v.subTotalInfoList.filter(x => x.voterType === VoterType.VOTER_TYPE_SWISS);
    const swissAbroadInfos = v.subTotalInfoList.filter(x => x.voterType === VoterType.VOTER_TYPE_SWISS_ABROAD);
    const foreignerInfos = v.subTotalInfoList.filter(x => x.voterType === VoterType.VOTER_TYPE_FOREIGNER);
    const minorInfos = v.subTotalInfoList.filter(x => x.voterType === VoterType.VOTER_TYPE_MINOR);

    this.voterTypeGroups.push({
      label: 'CONTEST.DETAIL.SWISS',
      voterType: VoterType.VOTER_TYPE_SWISS,
      menSubTotal: this.getDetail(VoterType.VOTER_TYPE_SWISS, SexType.SEX_TYPE_MALE),
      womenSubTotal: this.getDetail(VoterType.VOTER_TYPE_SWISS, SexType.SEX_TYPE_FEMALE),
      total: sum(Object.values(swissInfos), x => x.countOfVoters),
    });

    if (this.enabledVoterTypes.includes(VoterType.VOTER_TYPE_SWISS_ABROAD)) {
      this.voterTypeGroups.push({
        label: 'CONTEST.DETAIL.SWISS_ABROAD',
        voterType: VoterType.VOTER_TYPE_SWISS_ABROAD,
        menSubTotal: this.getDetail(VoterType.VOTER_TYPE_SWISS_ABROAD, SexType.SEX_TYPE_MALE),
        womenSubTotal: this.getDetail(VoterType.VOTER_TYPE_SWISS_ABROAD, SexType.SEX_TYPE_FEMALE),
        total: sum(Object.values(swissAbroadInfos), x => x.countOfVoters),
      });
    }

    if (this.enabledVoterTypes.includes(VoterType.VOTER_TYPE_FOREIGNER)) {
      this.voterTypeGroups.push({
        label: 'CONTEST.DETAIL.FOREIGNER',
        voterType: VoterType.VOTER_TYPE_FOREIGNER,
        menSubTotal: this.getDetail(VoterType.VOTER_TYPE_FOREIGNER, SexType.SEX_TYPE_MALE),
        womenSubTotal: this.getDetail(VoterType.VOTER_TYPE_FOREIGNER, SexType.SEX_TYPE_FEMALE),
        total: sum(Object.values(foreignerInfos), x => x.countOfVoters),
      });
    }

    if (this.enabledVoterTypes.includes(VoterType.VOTER_TYPE_MINOR)) {
      this.voterTypeGroups.push({
        label: 'CONTEST.DETAIL.MINOR',
        voterType: VoterType.VOTER_TYPE_MINOR,
        menSubTotal: this.getDetail(VoterType.VOTER_TYPE_MINOR, SexType.SEX_TYPE_MALE),
        womenSubTotal: this.getDetail(VoterType.VOTER_TYPE_MINOR, SexType.SEX_TYPE_FEMALE),
        total: sum(Object.values(minorInfos), x => x.countOfVoters),
      });
    }

    this.updateTotal();
  }

  @Output()
  public countOfVotersChange: EventEmitter<CountOfVotersInformation> = new EventEmitter<CountOfVotersInformation>();

  private getDetail(voterType: VoterType, sex: SexType): CountOfVotersInformationSubTotal {
    let result = this.countOfVotersInformation.subTotalInfoList.find(c => c.voterType === voterType && c.sex === sex);
    if (result) {
      return result;
    }

    // don't set the numeric value => textfield should be empty as long as no input is provided
    result = {
      sex,
      voterType,
    } as CountOfVotersInformationSubTotal;

    this.countOfVotersInformation.subTotalInfoList.push(result);
    return result;
  }

  public updateTotal(): void {
    for (let voterTypeGroup of this.voterTypeGroups) {
      voterTypeGroup.total = (voterTypeGroup.menSubTotal.countOfVoters ?? 0) + (voterTypeGroup.womenSubTotal.countOfVoters ?? 0);
    }

    this.countOfVotersInformation.totalCountOfVoters = sum(this.voterTypeGroups, x => x.total);

    if (!this.readonly) {
      this.countOfVotersChange.emit(this.countOfVotersInformation);
    }
  }
}

interface SimpleVoterTypeGroup {
  label: string;
  voterType: VoterType;
  menSubTotal: CountOfVotersInformationSubTotal;
  womenSubTotal: CountOfVotersInformationSubTotal;
  total: number;
}
