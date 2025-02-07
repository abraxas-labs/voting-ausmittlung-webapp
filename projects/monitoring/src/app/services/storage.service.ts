/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable } from '@angular/core';

@Injectable()
export class StorageService {
  public readonly stateFilterSessionStorageValueToCheck: string = 'toCheck';
  public readonly stateFilterSessionStorageValueChecked: string = 'checked';
  public readonly stateFilterSessionStorageValueAll: string = 'all';

  private readonly stateFilterSessionStorageKey: string = 'stateFilter';

  public getStateFilter(): string | null {
    return sessionStorage.getItem(this.stateFilterSessionStorageKey);
  }

  public storeStateFilter(value: string): void {
    sessionStorage.setItem(this.stateFilterSessionStorageKey, value);
  }
}
