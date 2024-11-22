/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';

// TODO: can be moved to lib after updating to angular 18
@Component({
  selector: 'vo-ausm-button-bar',
  templateUrl: './button-bar.component.html',
  styleUrl: './button-bar.component.scss',
})
export class ButtonBarComponent {
  @Input()
  public saving: boolean = false;

  @Input()
  public saveLabel?: string;

  @Input()
  public saveIcon?: string;

  @Input()
  public canSave: boolean = true;

  @Input()
  public hasSaveButton: boolean = true;

  @Input()
  public hasCancelButton: boolean = true;

  @Input()
  public cancelLabel?: string;

  @Output()
  public cancel: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public save: EventEmitter<void> = new EventEmitter<void>();

  @Input()
  public hintLabel?: string;

  @Input()
  public sticky: boolean = true;
}
