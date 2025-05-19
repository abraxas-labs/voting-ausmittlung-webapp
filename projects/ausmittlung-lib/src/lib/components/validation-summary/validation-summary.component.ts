/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { ValidationSummary } from '../../models';

@Component({
  selector: 'vo-ausm-validation-summary',
  templateUrl: './validation-summary.component.html',
  styleUrls: ['./validation-summary.component.scss'],
  standalone: false,
})
export class ValidationSummaryComponent {
  @Input()
  public summary!: ValidationSummary;
}
