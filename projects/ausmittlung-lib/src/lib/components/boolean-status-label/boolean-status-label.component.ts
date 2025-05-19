/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';

@Component({
  selector: 'vo-ausm-boolean-status-label',
  templateUrl: './boolean-status-label.component.html',
  standalone: false,
})
export class BooleanStatusLabelComponent {
  @Input()
  public value?: boolean;
}
