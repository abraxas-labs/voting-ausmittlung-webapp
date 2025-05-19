/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { ValidationResult } from '../../models';

@Component({
  selector: 'vo-ausm-validation-result',
  templateUrl: './validation-result.component.html',
  styleUrls: ['./validation-result.component.scss'],
  standalone: false,
})
export class ValidationResultComponent {
  @Input()
  public result!: ValidationResult;
}
