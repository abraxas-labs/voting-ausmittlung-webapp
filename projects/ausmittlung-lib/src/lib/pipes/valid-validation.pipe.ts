/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Pipe, PipeTransform } from '@angular/core';
import { ValidationResult } from '../models';

@Pipe({
  name: 'validValidation',
  standalone: false,
})
export class ValidValidationPipe implements PipeTransform {
  public transform(value: ValidationResult[], isValid: boolean = true): ValidationResult[] {
    return value.filter(x => x.isValid === isValid);
  }
}
