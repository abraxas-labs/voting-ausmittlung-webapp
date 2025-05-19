/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'vo-ausm-shortcut-dialog',
  templateUrl: './shortcut-dialog.component.html',
  styleUrls: ['./shortcut-dialog.component.scss'],
  standalone: false,
})
export class ShortcutDialogComponent {
  public title: string;
  public shortcuts: Shortcut[];
  public confirmText: string;

  constructor(@Inject(MAT_DIALOG_DATA) dialogData: ShortcutDialogData) {
    this.title = dialogData.title ?? 'APP.SHORTCUT_TITLE';
    this.shortcuts = dialogData.shortcuts;
    this.confirmText = dialogData.confirmText ? dialogData.confirmText : 'COMMON.OK';
  }
}

export interface ShortcutDialogData {
  title?: string;
  shortcuts: Shortcut[];
  confirmText?: string;
}

export interface Shortcut {
  text: string;
  combination: string;
}
