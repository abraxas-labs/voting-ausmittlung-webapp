/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AuthenticationService, AuthorizationService, SnackbarComponent } from '@abraxas/base-components';
import { OAuthService } from 'angular-oauth2-oidc';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService, ThemeService } from '@abraxas/voting-lib';
import { LanguageService } from '../../../ausmittlung-lib/src/lib/services/language.service';
import { LocationStrategy } from '@angular/common';
import { firstValueFrom, Subscription } from 'rxjs';
import * as moment from 'moment';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly translations = inject(TranslateService);
  private readonly oauthService = inject(OAuthService);
  private readonly auth = inject(AuthenticationService);
  private readonly authorization = inject(AuthorizationService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly languageService = inject(LanguageService);
  private readonly locationStrategy = inject(LocationStrategy);
  private readonly title = inject(Title);

  public authenticated = false;
  public hasTenant = false;
  public loading = true;
  public theme?: string;
  public customLogo?: string;
  public appTitle: string = '';

  @ViewChild('snackbar')
  public snackbarComponent?: SnackbarComponent;

  private readonly subscriptions: Subscription[] = [];

  constructor() {
    const themeService = inject(ThemeService);

    // enable automatic silent refresh
    this.oauthService.setupAutomaticSilentRefresh({}, 'access_token');

    const snackbarSubscription = this.snackbarService.message$.subscribe(m => {
      if (!this.snackbarComponent) {
        return;
      }

      this.snackbarComponent.message = m.message;
      this.snackbarComponent.variant = m.variant;
      this.snackbarComponent.open();
    });
    this.subscriptions.push(snackbarSubscription);

    const themeSubscription = themeService.theme$.subscribe(theme => this.onThemeChange(theme));
    this.subscriptions.push(themeSubscription);

    const logoSubscription = themeService.logo$.subscribe(logo => (this.customLogo = logo));
    this.subscriptions.push(logoSubscription);

    const authSubscription = this.auth.authenticationChanged.pipe(filter(isAuthenticated => isAuthenticated)).subscribe(async () => {
      this.authenticated = true;

      try {
        // getActiveTenant is called to initialize the tenant cache, otherwise the authorization endpoint would be called multiple times
        await this.authorization.getActiveTenant();
        this.hasTenant = true;
      } catch (e) {
        this.hasTenant = false;
      } finally {
        this.loading = false;
      }
    });
    this.subscriptions.push(authSubscription);
  }

  public async switchTenant(): Promise<void> {
    window.location.reload(); // reload to ensure consistent state across all components, needed due to some base-components
  }

  public async ngOnInit(): Promise<void> {
    moment.locale(this.languageService.currentLanguage);
    this.translations.setDefaultLang(this.languageService.currentLanguage);
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

  private async onThemeChange(theme?: string): Promise<void> {
    if (!theme) {
      return;
    }

    // Cannot use translations.instant here, as the translations may not have been loaded yet
    // It would then just display the non-translated string
    this.appTitle = await firstValueFrom(this.translations.get('APP.TITLE.' + theme));
    this.title.setTitle(this.appTitle);

    this.theme = theme;
  }
}
