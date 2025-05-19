/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Inject, Injectable } from '@angular/core';
import { GrpcBackendService, GrpcEnvironment, GrpcService, retryForeverWithBackoff } from '@abraxas/voting-lib';
import { EventLogServicePromiseClient } from '@abraxas/voting-ausmittlung-service-proto/grpc/event_log_service_grpc_web_pb';
import {
  WatchEventsRequest,
  WatchEventsRequestFilter,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/requests/event_log_requests_pb';
import { catchError, finalize, map, merge, Observable, Subject, Subscription, tap, throwError } from 'rxjs';
import {
  Event,
  EventProto,
  EventType,
  EventTypePrefix,
  FilterParams,
  ResultStateChangeEvent,
  ResultStateEventTypes,
} from '../models/event-log.model';
import { filter } from 'rxjs/operators';
import { EventDetails } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/event_log_pb';
import { PoliticalBusinessResultBundleService } from './political-business-result-bundle.service';
import { CountingCircleResultState } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/counting_circle_pb';
import { GRPC_ENV_INJECTION_TOKEN } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class EventLogService extends GrpcService<EventLogServicePromiseClient> {
  private contestId: string = '';
  private countingCircleId?: string = '';

  private watchFilters: WatchEventsRequestFilter[] = [];
  private readonly onReconnectAttempt: Subject<void> = new Subject<void>();
  private readonly watchSubject: Subject<Event> = new Subject<Event>();
  private readonly watch$: Observable<Event> = this.watchSubject.pipe(
    tap({
      finalize: () => {
        this.watchCallSubscription?.unsubscribe();
        delete this.watchCallSubscription;
      },
    }),
  );
  private watchCallSubscription?: Subscription;

  constructor(grpcBackend: GrpcBackendService, @Inject(GRPC_ENV_INJECTION_TOKEN) env: GrpcEnvironment) {
    super(EventLogServicePromiseClient, env, grpcBackend);
  }

  /**
   * Can be used together with skipCall of watch
   * to limit reconnecting once, even if multiple new filters need to be established.
   */
  public startWatcher(): void {
    // unfortunately grpc-web doesn't support client streaming.
    // therefore we need to reconnect and may lose a small set of updates.
    // But the idea is to only have one connection to the server to limit the open http connections
    // the browser and the server has to handle due to connection limits on several layers.

    const req = new WatchEventsRequest().setContestId(this.contestId).setFiltersList(this.watchFilters);

    if (this.countingCircleId !== undefined) {
      req.setCountingCircleId(this.countingCircleId);
    }

    const newSubscription = this.requestServerStream(
      c => c.watch,
      req,
      r => this.mapEvent(r),
    )
      .pipe(
        catchError(err => {
          console.error(err);
          return throwError(err);
        }),
        retryForeverWithBackoff(() => this.onReconnectAttempt.next()),
      )
      .subscribe(e => this.watchSubject.next(e));

    this.watchCallSubscription?.unsubscribe();
    this.watchCallSubscription = newSubscription;
  }

  public watch<T extends EventType>(types: T[], filterParams: FilterParams): Observable<Event<T>> {
    const contestId = filterParams.contestId;
    if (this.contestId != contestId && this.watchFilters.length > 0) {
      throw new Error('cannot watch multiple contests');
    }

    this.contestId = contestId;

    if (
      filterParams.countingCircleId !== undefined &&
      this.countingCircleId != filterParams.countingCircleId &&
      this.watchFilters.length > 0
    ) {
      throw new Error('cannot watch multiple counting circles');
    }

    this.countingCircleId = filterParams.countingCircleId;

    const filterId = crypto.randomUUID();
    const watchFilter = new WatchEventsRequestFilter();
    watchFilter.setId(filterId);
    watchFilter.setTypesList(types.map(t => EventTypePrefix + t));
    if (filterParams.politicalBusinessId !== undefined) {
      watchFilter.setPoliticalBusinessId(filterParams.politicalBusinessId);
    }

    if (filterParams.politicalBusinessResultId !== undefined) {
      watchFilter.setPoliticalBusinessResultId(filterParams.politicalBusinessResultId);
    }

    this.watchFilters.push(watchFilter);

    if (!filterParams.skipCall) {
      this.startWatcher();
    }

    let events = this.watch$.pipe(
      filter(e => e.filterId == filterId),
      map(e => <Event<T>>e),
      finalize(() => (this.watchFilters = this.watchFilters.filter(f => f.getId() !== watchFilter.getId()))),
    );

    if (filterParams.dontFireOnReconnectAttempt) {
      return events;
    }

    const reconnectAttempts = this.onReconnectAttempt.pipe(
      map(
        () =>
          ({
            type: '_reconnectAttempt',
            contestId,
            filterId,
            aggregateId: '',
            politicalBusinessId: '',
            politicalBusinessBundleId: '',
            entityId: '',
            timestamp: new Date(),
            data: {},
          }) satisfies Event<T>,
      ),
    );
    return merge(events, reconnectAttempts);
  }

  public watchResultState(contestId: string, countingCircleId?: string, skipCall: boolean = false): Observable<ResultStateChangeEvent> {
    return this.watch([...ResultStateEventTypes], { contestId, countingCircleId, skipCall }).pipe(
      map(e => {
        switch (e.type) {
          case 'VoteResultSubmissionStarted':
          case 'VoteResultResetted':
          case 'ProportionalElectionResultSubmissionStarted':
          case 'ProportionalElectionResultResetted':
          case 'MajorityElectionResultSubmissionStarted':
          case 'MajorityElectionResultResetted':
            return { event: e, newState: CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_ONGOING };
          case 'VoteResultSubmissionFinished':
          case 'VoteResultResettedToSubmissionFinished':
          case 'ProportionalElectionResultSubmissionFinished':
          case 'ProportionalElectionResultResettedToSubmissionFinished':
          case 'MajorityElectionResultSubmissionFinished':
          case 'MajorityElectionResultResettedToSubmissionFinished':
            return { event: e, newState: CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_SUBMISSION_DONE };
          case 'VoteResultCorrectionFinished':
          case 'ProportionalElectionResultCorrectionFinished':
          case 'MajorityElectionResultCorrectionFinished':
            return { event: e, newState: CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_CORRECTION_DONE };
          case 'VoteResultFlaggedForCorrection':
          case 'ProportionalElectionResultFlaggedForCorrection':
          case 'MajorityElectionResultFlaggedForCorrection':
            return { event: e, newState: CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_READY_FOR_CORRECTION };
          case 'VoteResultAuditedTentatively':
          case 'VoteResultResettedToAuditedTentatively':
          case 'ProportionalElectionResultAuditedTentatively':
          case 'ProportionalElectionResultResettedToAuditedTentatively':
          case 'MajorityElectionResultAuditedTentatively':
          case 'MajorityElectionResultResettedToAuditedTentatively':
            return { event: e, newState: CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_AUDITED_TENTATIVELY };
          case 'VoteResultPlausibilised':
          case 'ProportionalElectionResultPlausibilised':
          case 'MajorityElectionResultPlausibilised':
            return { event: e, newState: CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_PLAUSIBILISED };
          case '_reconnectAttempt':
            return { event: e, isReconnect: true, newState: CountingCircleResultState.COUNTING_CIRCLE_RESULT_STATE_UNSPECIFIED };
        }
      }),
    );
  }

  private mapEvent<T extends EventType>(evt: EventProto): Event<T> {
    return {
      ...evt.toObject(),
      type: evt.getType().substring(EventTypePrefix.length) as T,
      data: this.mapEventData(evt.getData()),
      timestamp: evt.getTimestamp()!.toDate(),
    };
  }

  private mapEventData(data?: EventDetails): Event['data'] {
    return {
      writeInsMapped: data?.getWriteInsMapped()?.toObject(),
      countingCircleImportCompleted: data?.getCountingCircleImportCompleted()?.toObject(),
      protocolExportStateChange: data?.getProtocolExportStateChange()?.toObject(),
      bundleLog:
        data?.getBundleLog() == undefined
          ? undefined
          : PoliticalBusinessResultBundleService.mapToPoliticalBusinessResultBundleLog(data.getBundleLog()!),
    };
  }
}
