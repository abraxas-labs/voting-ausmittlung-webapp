/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContactPerson } from '../../models';

@Component({
  selector: 'vo-ausm-contact-person-edit',
  templateUrl: './contact-person-edit.component.html',
  styleUrls: ['./contact-person-edit.component.scss'],
  standalone: false,
})
export class ContactPersonEditComponent {
  @Input()
  public contactPerson!: ContactPerson;

  @Input()
  public readonly: boolean = false;

  @Output()
  public contentChanged: EventEmitter<void> = new EventEmitter<void>();
}
