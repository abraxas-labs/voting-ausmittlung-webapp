/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { NumberComponent } from '@abraxas/base-components';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { PoliticalBusinessNullableCountOfVoters, updateCountOfVotersCalculatedFields } from '../../models';

@Component({
  selector: 'vo-ausm-ballot-count-input',
  templateUrl: './ballot-count-input.component.html',
  styleUrls: ['./ballot-count-input.component.scss'],
  standalone: false,
})
export class BallotCountInputComponent {
  @Input()
  public header!: string;

  @Input()
  public participationLabel!: string;

  @Input()
  public readonly: boolean = true;

  @Input()
  public eVoting: boolean = false;

  @Input()
  public eCounting: boolean = false;

  public get hasMultipleRows(): boolean {
    return this.eVoting || this.eCounting;
  }

  @Input()
  public countOfVoters!: PoliticalBusinessNullableCountOfVoters;

  @Input()
  public totalCountOfVoters?: number;

  @Output()
  public countOfVotersChange: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('receivedFormfield')
  private receivedFormfieldComponent!: NumberComponent;

  public changed(): void {
    updateCountOfVotersCalculatedFields(this.countOfVoters, this.totalCountOfVoters);
    this.countOfVotersChange.emit();
  }

  public setFocus(): void {
    this.receivedFormfieldComponent.setFocus();
  }
}
