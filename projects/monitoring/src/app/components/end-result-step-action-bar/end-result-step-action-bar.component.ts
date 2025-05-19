/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EndResultStep } from '../../models/end-result-step.model';

@Component({
  selector: 'app-end-result-step-action-bar',
  templateUrl: './end-result-step-action-bar.component.html',
  styleUrl: './end-result-step-action-bar.component.scss',
  standalone: false,
})
export class EndResultStepActionBarComponent {
  public steps: typeof EndResultStep = EndResultStep;

  @Input()
  public showMandateDistributionTrigger = false;

  @Input()
  public showFinalize = false;

  @Input()
  public step?: EndResultStep;

  @Input()
  public disabled = false;

  @Output()
  public stepChange: EventEmitter<EndResultStep> = new EventEmitter<EndResultStep>();

  public revert(): void {
    if (!this.step) {
      return;
    }

    if (this.step < EndResultStep.MandateDistributionTriggered) {
      return;
    }

    if (this.step === EndResultStep.MandateDistributionTriggered) {
      this.stepChange.emit(EndResultStep.AllCountingCirclesDone);
      return;
    }

    this.stepChange.emit(
      this.showMandateDistributionTrigger ? EndResultStep.MandateDistributionTriggered : EndResultStep.AllCountingCirclesDone,
    );
  }

  public startMandateDistribution(): void {
    this.stepChange.emit(EndResultStep.MandateDistributionTriggered);
  }

  public finalize(): void {
    this.stepChange.emit(EndResultStep.Finalized);
  }
}
