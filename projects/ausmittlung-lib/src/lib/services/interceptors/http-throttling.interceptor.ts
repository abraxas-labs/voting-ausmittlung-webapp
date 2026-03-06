/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, switchMap, timer } from 'rxjs';
import { RuntimeConfigService } from '../runtime-config.service';
import { REST_API_URL, ThemeService } from '@abraxas/voting-lib';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class HttpThrottlingInterceptor implements HttpInterceptor {
  private readonly runtimeConfigService: RuntimeConfigService = inject(RuntimeConfigService);
  private readonly restApiUrl = inject(REST_API_URL);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.restApiUrl || !req.url.includes(this.restApiUrl)) {
      return next.handle(req);
    }

    const delay = this.runtimeConfigService.delay;

    if (delay === 0) {
      return next.handle(req);
    }

    if (delay === Infinity) {
      this.router.navigate([this.themeService.theme$.value, 'system-busy']);
      return EMPTY;
    }

    return timer(delay).pipe(switchMap(() => next.handle(req)));
  }
}
