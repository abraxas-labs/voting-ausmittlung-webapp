/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, Injectable, OnDestroy } from '@angular/core';
import { RUNTIME_CONFIG_POLLING_CONFIG_INJECTION_TOKEN } from './tokens';
import { RuntimeConfigPollingConfig } from '../models';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, EMPTY, filter, firstValueFrom, map, Observable, Subscription, switchMap, timer } from 'rxjs';

const minPollingIntervalSeconds = 10;

/**
 * The runtime config is polled in a giving interval and allows to refresh configuration values without the SPA being reloaded.
 */
@Injectable({
  providedIn: 'root',
})
export class RuntimeConfigService implements OnDestroy {
  private readonly pollingConfig = inject<RuntimeConfigPollingConfig>(RUNTIME_CONFIG_POLLING_CONFIG_INJECTION_TOKEN);
  private readonly http: HttpClient;

  private pollingStarted = false;
  private pollingSubscription?: Subscription;
  private readonly initializedSubject = new BehaviorSubject<boolean>(false);
  private readonly delaySubject = new BehaviorSubject<number>(0);
  private readonly denyDetailEntryPoliticalBusinessIdsSubject = new BehaviorSubject<ReadonlySet<string>>(new Set());

  public get initialized(): boolean {
    return this.initializedSubject.value;
  }

  public get delay(): number {
    return this.delaySubject.value;
  }

  public get denyDetailEntryPoliticalBusinessIds(): ReadonlySet<string> {
    return this.denyDetailEntryPoliticalBusinessIdsSubject.value;
  }

  public readonly denyDetailEntryPoliticalBusinessIds$: Observable<ReadonlySet<string>> =
    this.denyDetailEntryPoliticalBusinessIdsSubject.asObservable();
  public readonly delay$: Observable<number> = this.delaySubject.asObservable();

  constructor() {
    // Create a custom HttpClient that uses the backend directly (without using the existing interceptors).
    this.http = new HttpClient(inject(HttpBackend));
  }

  public async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await firstValueFrom(this.initializedSubject.pipe(filter(initialized => initialized)));
  }

  public initPolling(): void {
    if (this.initialized || this.pollingStarted) {
      return;
    }

    if (!this.pollingConfig?.endpoint || !this.pollingConfig?.intervalSeconds) {
      this.setInitialized(true);
      return;
    }

    const pollingIntervalMs = Math.max(this.pollingConfig.intervalSeconds, minPollingIntervalSeconds) * 1000;
    this.pollingStarted = true;

    this.pollingSubscription = timer(0, pollingIntervalMs)
      .pipe(
        switchMap(() =>
          this.fetchConfig().pipe(
            catchError(err => {
              console.error('Failed to fetch runtime config', err);
              this.setInitialized(true);
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe(config => {
        const delay = config.showSystemBusy ? Infinity : config.delayMs;

        this.denyDetailEntryPoliticalBusinessIdsSubject.next(new Set(config.denyPoliticalBusinessDetailEntryIds));
        this.delaySubject.next(delay);
        this.setInitialized(true);
      });
  }

  public ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }

  private fetchConfig() {
    return this.http.get<RuntimeConfig>(this.pollingConfig.endpoint).pipe(
      map(data => ({
        delayMs: Number.isFinite(+data.delayMs) ? +data.delayMs : 0,
        showSystemBusy: data.showSystemBusy,
        denyPoliticalBusinessDetailEntryIds: Array.isArray(data.denyPoliticalBusinessDetailEntryIds)
          ? data.denyPoliticalBusinessDetailEntryIds
          : [],
      })),
    );
  }

  private setInitialized(v: boolean) {
    this.initializedSubject.next(v);
  }
}

/**
 * This is the shape of the runtime config which gets polled in the configured interval from
 * the configured runtime config endpoint (usually inside the angular assets).
 * This allows controlling the overall system load.
 */
interface RuntimeConfig {
  /**
   * the delay of milliseconds which is added to each request (grpc and http).
   */
  delayMs: number;

  /**
   * If set to true, the system busy page is shown instead of the actual content.
   * Automatically redirects to the app home page when set to false again.
   */
  showSystemBusy: boolean;

  /**
   * Ids of political business for which the detail entry is denied.
   * Instead of the bundle overview, a hint is shown that detailed entry is currently unavailable for the political business.
   */
  denyPoliticalBusinessDetailEntryIds: string[];
}
