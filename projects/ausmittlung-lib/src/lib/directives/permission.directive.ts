/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Directive, Input, OnChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[voAusmPermission]',
  standalone: false,
})
export class PermissionDirective implements OnChanges {
  @Input('voAusmPermission')
  public permission: string = '';

  constructor(
    private readonly templateRef: TemplateRef<any>,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly permissionService: PermissionService,
  ) {}

  public async ngOnChanges(): Promise<void> {
    if (await this.permissionService.hasPermission(this.permission)) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainerRef.clear();
    }
  }
}
