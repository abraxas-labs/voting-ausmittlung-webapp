/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'vo-ausm-result-state-box',
  templateUrl: './result-state-box.component.html',
  styleUrls: ['./result-state-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ResultStateBoxComponent {
  @Input()
  public state: CountingCircleResultState = CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_INITIAL;

  @Input()
  public timestamp?: Date;

  @Input()
  public stateDescriptionsByState: Record<number, string> = {};
}
