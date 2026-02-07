/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnInit, inject } from '@angular/core';
import { Comment } from '../../models';
import { ResultService } from '../../services/result.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-comments-dialog',
  templateUrl: './comments-dialog.component.html',
  styleUrls: ['./comments-dialog.component.scss'],
  standalone: false,
})
export class CommentsDialogComponent implements OnInit {
  private readonly resultService = inject(ResultService);
  private readonly dialogRef = inject<MatDialogRef<CommentsDialogComponentData>>(MatDialogRef);

  public loading: boolean = true;
  public comments: Comment[] = [];

  private readonly resultId: string;

  constructor() {
    const dialogData = inject<CommentsDialogComponentData>(MAT_DIALOG_DATA);

    this.resultId = dialogData.resultId;
  }

  public async ngOnInit(): Promise<void> {
    try {
      this.comments = await this.resultService.getComments(this.resultId);
    } finally {
      this.loading = false;
    }
  }

  public done(): void {
    this.dialogRef.close();
  }
}

export interface CommentsDialogComponentData {
  resultId: string;
}
