/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Pipe, PipeTransform } from '@angular/core';
import { ValidationResult } from '../models';
import { KeyValue } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'validationGroup',
})
export class ValidationGroupPipe implements PipeTransform {
  constructor(private readonly i18n: TranslateService) {}

  public transform(value: Record<string, ValidationResult[]>): KeyValue<string, ValidationResult[]>[] {
    return Object.entries(value)
      .map(([k, v]) => ({ key: this.mapKey(k, v), value: v }))
      .sort((kvp1, kvp2) => {
        const validationGroupSort = kvp1.value[0].validationGroup - kvp2.value[0].validationGroup;
        if (validationGroupSort != 0) {
          return validationGroupSort;
        }

        return kvp1.key.localeCompare(kvp2.key);
      });
  }

  private mapKey(key: string, value: ValidationResult[]): string {
    if (value.length == 0 || !key) {
      return key;
    }

    const validationResult = value[0];
    if (!validationResult.validationGroup) {
      return key;
    }

    return this.i18n.instant('VALIDATION.GROUP.' + validationResult.validationGroup, { ...validationResult });
  }
}
