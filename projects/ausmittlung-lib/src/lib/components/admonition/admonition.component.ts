/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { AdmonitionType } from './admonition-type.enum';

// Copied from the old base components (bc-alert)
@Component({
  selector: 'vo-ausm-admonition',
  templateUrl: './admonition.component.html',
  styleUrls: ['./admonition.component.scss'],
  standalone: false,
})
export class AdmonitionComponent {
  @Input()
  public type: AdmonitionType = AdmonitionType.info;

  @Input()
  public titleText: string = '';

  public get icon(): string {
    switch (this.type) {
      case AdmonitionType.success:
        return 'checkmark';
      case AdmonitionType.warning:
        return 'exclamation-circle';
      case AdmonitionType.error:
        return 'exclamation-triangle';
      default:
        return 'info-circle';
    }
  }
}
