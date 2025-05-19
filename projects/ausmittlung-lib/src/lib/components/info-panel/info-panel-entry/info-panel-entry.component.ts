/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'vo-ausm-info-panel-entry',
  templateUrl: './info-panel-entry.component.html',
  styleUrls: ['./info-panel-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class InfoPanelEntryComponent {
  @Input()
  public label: string = '';

  @Input()
  public hasTopSpacing: boolean = true;
}
