/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, inject } from '@angular/core';
import { BreadcrumbItem } from '../../services/breadcrumbs.service';
import { Observable } from 'rxjs';
import { ThemeService } from '@abraxas/voting-lib';

@Component({
  selector: 'vo-ausm-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  standalone: false,
})
export class BreadcrumbsComponent {
  @Input()
  public items: BreadcrumbItem[] = [];

  public readonly $theme: Observable<string | undefined>;

  constructor() {
    const themeService = inject(ThemeService);

    this.$theme = themeService.theme$;
  }
}
