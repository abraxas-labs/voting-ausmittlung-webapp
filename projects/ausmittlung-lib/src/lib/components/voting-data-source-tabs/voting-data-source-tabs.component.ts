/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VotingDataSource } from '../../models';

@Component({
  selector: 'vo-ausm-voting-data-source-tabs',
  templateUrl: './voting-data-source-tabs.component.html',
  styleUrls: ['./voting-data-source-tabs.component.scss'],
  standalone: false,
})
export class VotingDataSourceTabsComponent {
  @Input()
  public eVoting: boolean = false;

  @Input()
  public eCounting: boolean = false;

  @Output()
  public dataSourceChange: EventEmitter<VotingDataSource> = new EventEmitter<VotingDataSource>();

  private get dataSources(): VotingDataSource[] {
    const dataSources: VotingDataSource[] = [VotingDataSource.Total, VotingDataSource.Conventional];

    if (this.eVoting) {
      dataSources.push(VotingDataSource.EVoting);
    }

    if (this.eCounting) {
      dataSources.push(VotingDataSource.ECounting);
    }

    return dataSources;
  }

  public changeDataSource(index: number): void {
    this.dataSourceChange.emit(this.dataSources[index]);
  }
}
