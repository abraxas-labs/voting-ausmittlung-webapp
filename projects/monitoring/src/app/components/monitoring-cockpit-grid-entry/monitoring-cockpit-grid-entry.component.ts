/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ResultOverviewCountingCircleResult } from 'ausmittlung-lib';
import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';

@Component({
  selector: 'app-monitoring-cockpit-grid-entry',
  templateUrl: './monitoring-cockpit-grid-entry.component.html',
  styleUrls: ['./monitoring-cockpit-grid-entry.component.scss'],
})
export class MonitoringCockpitGridEntryComponent {
  public readonly states: typeof CountingCircleResultState = CountingCircleResultState;

  @Input()
  public set results(results: ResultOverviewCountingCircleResult[]) {
    if (results.length == 0) {
      return;
    }

    if (results.length == 1) {
      this.result = results[0];
      return;
    }

    this.result = results.reduce((x, y) => (x.state < y.state ? x : y));
  }

  @Input()
  public showDetails: boolean = false;

  @Output()
  public openDetail: EventEmitter<void> = new EventEmitter<void>();

  @Input()
  public stateDescriptionsByState: Record<number, string> = {};

  @Input()
  public disabled: boolean = false;

  @Input()
  public showPublishSwitch: boolean = false;

  @Input()
  public publishResultsBeforeAuditedTentatively: boolean = false;

  @Output()
  public publishedChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  public result?: ResultOverviewCountingCircleResult;
}
