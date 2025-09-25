/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DomainOfInfluenceType } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/domain_of_influence_pb';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SimpleVoterTypeGroup } from '../contest-detail-count-of-voters/contest-detail-count-of-voters.component';

@Component({
  selector: 'vo-ausm-contest-detail-count-of-voters-electorate',
  templateUrl: './contest-detail-count-of-voters-electorate.component.html',
  styleUrls: ['./contest-detail-count-of-voters-electorate.component.scss'],
  standalone: false,
})
export class ContestDetailCountOfVotersElectorateComponent {
  public expansionPanelHeaderTitle: string = '';
  public voterTypeGroupsValue: SimpleVoterTypeGroup[] = [];

  @Input()
  public readonly: boolean = true;

  @Input()
  public set domainOfInfluenceTypes(v: DomainOfInfluenceType[]) {
    this.expansionPanelHeaderTitle = this.i18n.instant('DOMAIN_OF_INFLUENCE.TYPE', {
      type: v.map(d => this.i18n.instant(`DOMAIN_OF_INFLUENCE_TYPES.${d}`)).join(', '),
    });
  }

  constructor(private readonly i18n: TranslateService) {}

  public get voterTypeGroups(): SimpleVoterTypeGroup[] {
    return this.voterTypeGroupsValue;
  }

  @Input()
  public set voterTypeGroups(voterTypeGroups: SimpleVoterTypeGroup[]) {
    this.voterTypeGroupsValue = voterTypeGroups;
    this.updateTotal();
  }

  @Input()
  public eVoting: boolean = false;

  @Output()
  public voterTypeGroupsChange: EventEmitter<SimpleVoterTypeGroup[]> = new EventEmitter<SimpleVoterTypeGroup[]>();

  public updateTotal(): void {
    for (let voterTypeGroup of this.voterTypeGroups) {
      voterTypeGroup.total = (voterTypeGroup.menSubTotal.countOfVoters ?? 0) + (voterTypeGroup.womenSubTotal.countOfVoters ?? 0);
    }

    if (!this.readonly) {
      this.voterTypeGroupsChange.emit(this.voterTypeGroups);
    }
  }
}
