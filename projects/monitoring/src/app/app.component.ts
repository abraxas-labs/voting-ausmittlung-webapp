/*!
 * (c) Copyright 2022 by Abraxas Informatik AG
 * For license information see LICENSE file
 */

import { AuthenticationService, AuthorizationService, SnackbarComponent } from '@abraxas/base-components';
import { OAuthService } from 'angular-oauth2-oidc';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService, ThemeService } from '@abraxas/voting-lib';
import { LanguageService } from '../../../ausmittlung-lib/src/lib/services/language.service';
import { LocationStrategy } from '@angular/common';
import { Subscription } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  public authenticated = false;
  public hasTenant = false;
  public loading = false;
  public theme?: string;

  @ViewChild('snackbar')
  public snackbarComponent?: SnackbarComponent;

  private readonly subscriptions: Subscription[] = [];

  constructor(
    themeService: ThemeService,
    private readonly translations: TranslateService,
    private readonly oauthService: OAuthService,
    private readonly auth: AuthenticationService,
    private readonly authorization: AuthorizationService,
    private readonly router: Router,
    private readonly snackbarService: SnackbarService,
    private readonly languageService: LanguageService,
    private readonly locationStrategy: LocationStrategy,
  ) {
    // enable automatic silent refresh
    this.oauthService.setupAutomaticSilentRefresh();

    const snackbarSubscription = this.snackbarService.message$.subscribe(m => {
      if (!this.snackbarComponent) {
        return;
      }

      this.snackbarComponent.message = m.message;
      this.snackbarComponent.variant = m.variant;
      this.snackbarComponent.open();
    });
    this.subscriptions.push(snackbarSubscription);

    // This prevents a short flickering of the default theme (if another theme has been set)
    const themeSubscription = themeService.theme$.subscribe(theme => (this.theme = theme));
    this.subscriptions.push(themeSubscription);
  }

  public async switchTenant(): Promise<void> {
    window.location.reload(); // reload to ensure consistent state across all components, needed due to some base-components
  }

  public async ngOnInit(): Promise<void> {
    moment.locale(this.languageService.currentLanguage);
    this.translations.setDefaultLang(this.languageService.currentLanguage);
    this.authenticated = false;
    this.hasTenant = false;
    this.loading = true;

    if (!(await this.auth.authenticate())) {
      this.loading = false;
      return;
    }

    this.authenticated = true;

    try {
      await this.authorization.getActiveTenant();
      this.hasTenant = true;
    } catch (e) {
      this.hasTenant = false;
    } finally {
      this.loading = false;
    }
  }

  public async reload(): Promise<void> {
    window.location.href = this.locationStrategy.getBaseHref();
  }

  public logout(): void {
    this.auth.logout();
  }

  public ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
}
