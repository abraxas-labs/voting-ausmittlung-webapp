/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { GrpcHandler, GrpcInterceptor } from '@abraxas/voting-lib';
import { Injectable, inject } from '@angular/core';
import { Metadata } from 'grpc-web';
import { Observable } from 'rxjs';
import { LanguageService } from '../language.service';

const languageHeader = 'x-language';

@Injectable({ providedIn: 'root' })
export class GrpcLanguageInterceptor implements GrpcInterceptor {
  private readonly languageService = inject(LanguageService);

  public intercept(req: unknown, metadata: Metadata, next: GrpcHandler): Observable<any> {
    metadata[languageHeader] = this.languageService.currentLanguage;
    return next.handle(req, metadata);
  }
}
