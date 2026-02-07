/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { ProportionalElectionResultBundle } from '../../../models';

@Component({
  selector: 'vo-ausm-proportional-election-bundle-info',
  templateUrl: './proportional-election-bundle-info.component.html',
  styleUrls: ['./proportional-election-bundle-info.component.scss'],
  standalone: false,
})
export class ProportionalElectionBundleInfoComponent {
  @Input({ required: true })
  public bundle!: ProportionalElectionResultBundle;

  @Input()
  public bundleSize?: number;
}
