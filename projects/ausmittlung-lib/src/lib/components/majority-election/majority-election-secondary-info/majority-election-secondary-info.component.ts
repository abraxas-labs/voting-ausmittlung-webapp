/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { MajorityElectionBase } from '../../../models';

@Component({
  selector: 'vo-ausm-majority-election-secondary-info',
  templateUrl: './majority-election-secondary-info.component.html',
  styleUrls: ['./majority-election-secondary-info.component.scss'],
  standalone: false,
})
export class MajorityElectionSecondaryInfoComponent {
  @Input()
  public election!: MajorityElectionBase;

  @Input()
  public centeredTitle: boolean = false;
}
