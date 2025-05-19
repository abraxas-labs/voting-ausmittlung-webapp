/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable } from '@angular/core';

@Injectable()
export class StorageService {
  public readonly stateFilterToCheck: string = 'toCheck';
  public readonly stateFilterChecked: string = 'checked';
  public readonly stateFilterAll: string = 'all';

  public readonly monitoringCockpitTabGrid: string = 'grid';
  public readonly monitoringCockpitTabPoliticalBusinessOverview: string = 'politicalBusinessOverview';

  private readonly stateFilterKey: string = 'stateFilter';
  private readonly monitoringCockpitTabKey: string = 'monitoringCockpitTab';
  private readonly monitoringCockpitSelectedPoliticalBusinessIdKey: string = 'monitoringCockpitSelectedPoliticalBusinessId';
  private readonly monitoringCockpitColumnIdsKey: string = 'monitoringCockpitColumnIds';

  public getStateFilter(): string | null {
    return sessionStorage.getItem(this.stateFilterKey);
  }

  public storeStateFilter(value: string): void {
    sessionStorage.setItem(this.stateFilterKey, value);
  }

  public getMonitoringCockpitTab(): string | null {
    return sessionStorage.getItem(this.monitoringCockpitTabKey);
  }

  public storeMonitoringCockpitTab(value: string): void {
    sessionStorage.setItem(this.monitoringCockpitTabKey, value);
  }

  public getMonitoringCockpitSelectedPoliticalBusinessId(): string | null {
    return sessionStorage.getItem(this.monitoringCockpitSelectedPoliticalBusinessIdKey);
  }

  public storeMonitoringCockpitSelectedPoliticalBusinessId(value: string): void {
    sessionStorage.setItem(this.monitoringCockpitSelectedPoliticalBusinessIdKey, value);
  }

  public getMonitoringCockpitColumnIds(): string[] | null {
    const ids = sessionStorage.getItem(this.monitoringCockpitColumnIdsKey);
    if (!ids) {
      return null;
    }

    return JSON.parse(ids);
  }

  public storeMonitoringCockpitColumnIds(value: string[]): void {
    sessionStorage.setItem(this.monitoringCockpitColumnIdsKey, JSON.stringify(value));
  }
}
