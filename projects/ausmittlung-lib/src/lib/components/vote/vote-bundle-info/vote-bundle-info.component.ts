/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { PoliticalBusinessResultBundle } from '../../../models';

@Component({
  selector: 'vo-ausm-vote-bundle-info',
  templateUrl: './vote-bundle-info.component.html',
  styleUrls: ['./vote-bundle-info.component.scss'],
  standalone: false,
})
export class VoteBundleInfoComponent {
  @Input({ required: true })
  public bundle!: PoliticalBusinessResultBundle;
}
