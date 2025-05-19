/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Inject } from '@angular/core';
import { DomainOfInfluence } from '../../models';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-contact-person-dialog',
  templateUrl: './contact-person-dialog.component.html',
  standalone: false,
})
export class ContactPersonDialogComponent {
  public readonly domainOfInfluences: DomainOfInfluence[];

  constructor(
    private readonly dialogRef: MatDialogRef<ContactPersonDialogComponentData>,
    @Inject(MAT_DIALOG_DATA) dialogData: ContactPersonDialogComponentData,
  ) {
    this.domainOfInfluences = dialogData.domainOfInfluences;
  }

  public done(): void {
    this.dialogRef.close();
  }
}

export interface ContactPersonDialogComponentData {
  domainOfInfluences: DomainOfInfluence[];
}
