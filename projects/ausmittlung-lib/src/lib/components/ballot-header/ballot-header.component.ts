/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DialogService } from '@abraxas/voting-lib';
import { Component, EventEmitter, HostListener, Input, Output, ViewChild, inject } from '@angular/core';
import { Permissions } from '../../models/permissions.model';
import { BallotNavigationComponent } from '../ballot-navigation/ballot-navigation.component';

@Component({
  selector: 'vo-ausm-ballot-header',
  templateUrl: './ballot-header.component.html',
  styleUrls: ['./ballot-header.component.scss'],
  standalone: false,
})
export class BallotHeaderComponent {
  private readonly dialog = inject(DialogService);

  public readonly deleteBallotPermission = Permissions.PoliticalBusinessResultBallot.Delete;

  @Input()
  public readonly: boolean = true;

  @Input()
  public automaticBallotNumberGeneration: boolean = true;

  @Input()
  public ballotNumber?: number;

  @Input()
  public maxBallotNumber: number = 1;

  @Input()
  public minBallotNumber: number = 1;

  @Input({ required: true })
  public canGoPrevious: boolean = false;

  @Input({ required: true })
  public canGoNext: boolean = false;

  @Input()
  public labelBallotNumber: string = 'ELECTION.BALLOT_DETAIL.BALLOT_NR';

  @Input()
  public actionExecuting: boolean = false;

  @Input()
  public disabled: boolean = true;

  @Input()
  public canDeleteBallot: boolean = false;

  @Input()
  public labelDelete: string = 'ELECTION.BALLOT_DETAIL.DELETE';

  @Input()
  public labelConfirmDelete: string = 'ELECTION.BALLOT_DETAIL.CONFIRM_DELETE';

  @Output()
  public ballotNumberEntered: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  public previousBallotRequest: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public nextBallotRequest: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public deleteBallot: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild(BallotNavigationComponent)
  public navigationComponent!: BallotNavigationComponent;

  @HostListener('document:keydown.control.alt.q', ['$event'])
  public emitDeleteBallot(event?: KeyboardEvent): void {
    if (this.disabled || this.actionExecuting || !this.canDeleteBallot) {
      return;
    }

    event?.preventDefault();
    this.deleteBallot.emit();
  }

  public async confirmDeleteBallot(): Promise<void> {
    const confirmed = await this.dialog.confirm('APP.DELETE', this.labelConfirmDelete, 'APP.DELETE');
    if (!confirmed) {
      return;
    }

    this.deleteBallot.emit();
  }

  public setFocus(): void {
    this.navigationComponent.setFocus();
  }
}
