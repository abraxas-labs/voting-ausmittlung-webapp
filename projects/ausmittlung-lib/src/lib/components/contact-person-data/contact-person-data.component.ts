/*!
 * (c) Copyright 2022 by Abraxas Informatik AG
 * For license information see LICENSE file
 */

import { Component, Input } from '@angular/core';
import { ContactPerson } from '../../models';

@Component({
  selector: 'vo-ausm-contact-person-data',
  templateUrl: './contact-person-data.component.html',
  styleUrls: ['./contact-person-data.component.scss'],
})
export class ContactPersonDataComponent {
  @Input()
  public contactPerson?: ContactPerson;
}
