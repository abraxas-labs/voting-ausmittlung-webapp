/*!
 * (c) Copyright 2022 by Abraxas Informatik AG
 * For license information see LICENSE file
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'vo-ausm-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoPanelComponent {
  @Input()
  public mainEntry: string = '';
}
