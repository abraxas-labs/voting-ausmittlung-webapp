/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { GrpcHandler, GrpcInterceptor, ThemeService } from '@abraxas/voting-lib';
import { Injectable, inject } from '@angular/core';
import { Metadata } from 'grpc-web';
import { EMPTY, Observable, switchMap, timer } from 'rxjs';
import { RuntimeConfigService } from '../runtime-config.service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class GrpcThrottlingInterceptor implements GrpcInterceptor {
  private readonly runtimeConfigService: RuntimeConfigService = inject(RuntimeConfigService);
  private readonly router: Router = inject(Router);
  private readonly themeService: ThemeService = inject(ThemeService);

  public intercept(req: unknown, metadata: Metadata, next: GrpcHandler): Observable<any> {
    const delay = this.runtimeConfigService.delay;

    if (delay === 0) {
      return next.handle(req, metadata);
    }

    if (delay === Infinity) {
      this.router.navigate([this.themeService.theme$.value, 'system-busy']);
      return EMPTY;
    }

    return timer(delay).pipe(switchMap(() => next.handle(req, metadata)));
  }
}
