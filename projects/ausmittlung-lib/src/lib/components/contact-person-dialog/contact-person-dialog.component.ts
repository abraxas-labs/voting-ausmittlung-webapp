/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { DomainOfInfluence } from '../../models';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-contact-person-dialog',
  templateUrl: './contact-person-dialog.component.html',
  standalone: false,
})
export class ContactPersonDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<ContactPersonDialogComponentData>>(MatDialogRef);

  public readonly domainOfInfluences: DomainOfInfluence[];

  constructor() {
    const dialogData = inject<ContactPersonDialogComponentData>(MAT_DIALOG_DATA);

    this.domainOfInfluences = dialogData.domainOfInfluences;
  }

  public done(): void {
    this.dialogRef.close();
  }
}

export interface ContactPersonDialogComponentData {
  domainOfInfluences: DomainOfInfluence[];
}
