/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Directive, Input, OnChanges, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[voAusmPermission]',
  standalone: false,
})
export class PermissionDirective implements OnChanges {
  private readonly templateRef = inject<TemplateRef<any>>(TemplateRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);

  @Input('voAusmPermission')
  public permission: string = '';

  public async ngOnChanges(): Promise<void> {
    if (await this.permissionService.hasPermission(this.permission)) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainerRef.clear();
    }
  }
}
