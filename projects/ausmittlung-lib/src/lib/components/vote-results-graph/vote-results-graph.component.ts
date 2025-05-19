/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';

@Component({
  selector: 'vo-ausm-vote-results-graph',
  templateUrl: './vote-results-graph.component.html',
  styleUrls: ['./vote-results-graph.component.scss'],
  standalone: false,
})
export class VoteResultsGraphComponent {
  @Input()
  public resultLabelLeft: string = 'APP.YES';

  @Input()
  public resultLabelRight: string = 'APP.NO';

  @Input()
  public countLeft: number = 0;

  @Input()
  public countRight: number = 0;

  @Input()
  public equalityRightWins: boolean = false;

  public get sum(): number {
    return this.countLeft + this.countRight;
  }

  public get ratioLeft(): number {
    return this.countLeft / this.sum;
  }

  public get ratioRight(): number {
    return this.countRight / this.sum;
  }

  public get leftWins(): boolean {
    return this.countLeft > this.countRight;
  }

  public get rightWins(): boolean {
    return this.countLeft < this.countRight;
  }

  public get equality(): boolean {
    return this.countLeft === this.countRight;
  }
}
