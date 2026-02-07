/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';

@Component({
  selector: 'vo-ausm-info-icon',
  templateUrl: './info-icon.component.html',
  styleUrl: './info-icon.component.scss',
  standalone: false,
})
export class InfoIconComponent {
  @Input()
  public iconTooltip: string = '';

  @Input()
  public label: string = '';
}
