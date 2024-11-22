/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { TranslateLoader } from '@ngx-translate/core';
import { all as merge } from 'deepmerge';
import { from, Observable } from 'rxjs';
import deAppTranslations from '../../assets/i18n/de.json';
import deAusmittlungLibTranslations from '../../../../ausmittlung-lib/assets/ausmittlung-lib/i18n/de.json';
import deLibTranslations from '../../../../../node_modules/@abraxas/voting-lib/assets/voting-lib/i18n/de.json';

export class TranslationLoader implements TranslateLoader {
  public getTranslation(lang: string): Observable<any> {
    return from(this.loadTranslations());
  }

  private async loadTranslations(): Promise<any> {
    return merge([deLibTranslations, deAusmittlungLibTranslations, deAppTranslations]);
  }
}
