/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { MajorityElectionResultBundle } from '../../../models';

@Component({
  selector: 'vo-ausm-majority-election-bundle-info',
  templateUrl: './majority-election-bundle-info.component.html',
  styleUrls: ['./majority-election-bundle-info.component.scss'],
  standalone: false,
})
export class MajorityElectionBundleInfoComponent {
  @Input({ required: true })
  public bundle!: MajorityElectionResultBundle;

  @Input()
  public bundleSize?: number;
}
