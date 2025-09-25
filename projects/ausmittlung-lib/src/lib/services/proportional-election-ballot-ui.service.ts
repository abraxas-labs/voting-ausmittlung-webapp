/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable } from '@angular/core';
import {
  ProportionalElectionBallotCandidate,
  ProportionalElectionCandidate,
  ProportionalElectionOrBallotCandidate,
  ProportionalElectionResultBallot,
} from '../models';
import { arraysEqual, groupBy } from './utils/array.utils';

@Injectable({
  providedIn: 'root',
})
export class ProportionalElectionBallotUiService {
  public static newEmptyUiData(): ProportionalElectionBallotUiData {
    return {
      listPositions: [],
      addableCandidatesByNumber: {},
      removableCandidatesByNumber: {},
      removableCandidatesInRangeByNumber: {},
      emptyVoteCountValid: true,
      automaticEmptyVoteCounting: true,
      userEnteredEmptyVoteCount: 0,
      emptyVoteCount: 0,
      numberOfMandates: 0,
      candidateCountValid: true,
      candidateCheckDigit: false,
    };
  }

  public buildUiData(
    electionCandidates: ProportionalElectionCandidate[],
    automaticEmptyVoteCounting: boolean,
    numberOfMandates: number,
    candidateCheckDigit: boolean,
    ballot?: ProportionalElectionResultBallot,
  ): ProportionalElectionBallotUiData {
    if (!ballot) {
      return ProportionalElectionBallotUiService.newEmptyUiData();
    }

    // positions are 1-indexed
    const listPositions: ProportionalElectionBallotListPosition[] = [...new Array(numberOfMandates).keys()].map(position => ({
      position: position + 1,
      isSlotAvailable: true,
    }));

    let emptyVoteCount = numberOfMandates;
    let listNumber: string | undefined;
    for (const candidate of ballot.candidates) {
      const listPosition = listPositions[candidate.position - 1];

      // this is an added candidate (which displays on the right in the UI)
      if (!candidate.onList) {
        listPosition.replacementCandidate = candidate;
        listPosition.isSlotAvailable = false;
        emptyVoteCount--;
        continue;
      }

      // this is a candidate which was on the original list
      listPosition.listCandidate = candidate;
      listNumber = candidate.listNumber;
      if (!candidate.removedFromList) {
        listPosition.isSlotAvailable = false;
        emptyVoteCount--;
      }
    }

    const result: ProportionalElectionBallotUiData = {
      listPositions,
      numberOfMandates,
      emptyVoteCount,
      automaticEmptyVoteCounting,
      emptyVoteCountValid: true,
      userEnteredEmptyVoteCount: emptyVoteCount,
      removableCandidatesByNumber: {},
      removableCandidatesInRangeByNumber: {},
      addableCandidatesByNumber: {},
      listNumber,
      candidateCountValid: !!listNumber || ballot.candidates.length > 0,
      candidateCheckDigit,
    };
    this.updateAllCandidateAccumulated(ballot.candidates);
    this.updateEditableCandidates(result, electionCandidates);
    return result;
  }

  public isUnchanged(uiData: ProportionalElectionBallotUiData): boolean {
    if (!uiData.listNumber) {
      return uiData.emptyVoteCount === uiData.numberOfMandates;
    }

    // candidate ids on the list
    const listCandidateIds = uiData.listPositions
      .filter(p => p.listCandidate !== undefined)
      .map(p => p.listCandidate!.id)
      .sort((a, b) => a.localeCompare(b));

    // effective candidate ids on the ballot
    const candidateIds = uiData.listPositions
      .filter(p => !p.isSlotAvailable)
      .map(p => p.replacementCandidate?.id ?? p.listCandidate?.id)
      .filter(c => c !== undefined)
      .map(c => c!)
      .sort((a, b) => a.localeCompare(b));

    return arraysEqual(listCandidateIds, candidateIds);
  }

  public removeAllCandidates(uiData: ProportionalElectionBallotUiData): void {
    for (const listPosition of uiData.listPositions) {
      listPosition.isSlotAvailable = true;

      if (listPosition.replacementCandidate) {
        this.setCandidateAddable(uiData, { ...listPosition.replacementCandidate, accumulatedPosition: -1 }, true);
        delete listPosition.replacementCandidate;
      } else if (listPosition.listCandidate && !listPosition.listCandidate.removedFromList) {
        this.setCandidateAddable(uiData, { ...listPosition.listCandidate, accumulatedPosition: -1 }, true);
        listPosition.listCandidate.removedFromList = true;
      }
    }

    uiData.removableCandidatesByNumber = {};
    uiData.removableCandidatesInRangeByNumber = {};
    uiData.emptyVoteCount = uiData.numberOfMandates;
    this.updateEmptyVoteCountComputed(uiData);
  }

  public removeCandidateAtLastFoundPosition(
    candidate: ProportionalElectionBallotCandidate,
    uiData: ProportionalElectionBallotUiData,
  ): number {
    const listCandidatePosition = uiData.listPositions
      .filter(x => !x.isSlotAvailable)
      .slice()
      .reverse()
      .find(x => x.listCandidate?.id === candidate.id || x.replacementCandidate?.id === candidate.id);
    if (!listCandidatePosition) {
      throw new Error('could not find candidate position to remove candidate');
    }

    this.removeCandidateAtPosition(listCandidatePosition, !listCandidatePosition.replacementCandidate, uiData);
    return listCandidatePosition.position;
  }

  public removeCandidateAtPosition(
    position: ProportionalElectionBallotListPosition,
    listCandidate: boolean,
    uiData: ProportionalElectionBallotUiData,
  ): void {
    let candidate: ProportionalElectionBallotCandidate | undefined;
    if (listCandidate) {
      if (!position.listCandidate) {
        throw new Error('cannot remove an unknown list candidate');
      }

      candidate = position.listCandidate;
      candidate.removedFromList = true;
    } else {
      candidate = position.replacementCandidate;
      delete position.replacementCandidate;
    }

    if (!candidate) {
      throw new Error('cannot remove an unknown candidate');
    }

    position.isSlotAvailable = true;
    this.updateEmptyVoteCount(uiData, 1);
    this.updateValidCandidateCount(uiData);
    this.updateCandidateAccumulated(candidate, uiData);
    this.updateEditableCandidatesForRemovedCandidate(candidate, uiData);
  }

  public addCandidateAtFirstAvailablePosition(
    candidate: ProportionalElectionBallotCandidate,
    uiData: ProportionalElectionBallotUiData,
  ): number {
    const position = uiData.listPositions.find(p => p.isSlotAvailable);
    if (!position) {
      throw new Error('find available candidate position not found');
    }

    this.addCandidateAtPosition(candidate, position, false, uiData);
    return position.position;
  }

  public addCandidateAtPosition(
    candidate: ProportionalElectionOrBallotCandidate,
    position: ProportionalElectionBallotListPosition,
    listCandidate: boolean,
    uiData: ProportionalElectionBallotUiData,
  ): void {
    let ballotCandidate: ProportionalElectionBallotCandidate;
    if (listCandidate) {
      if (position.listCandidate?.id !== candidate.id) {
        throw new Error('list candidate does not match');
      }

      ballotCandidate = position.listCandidate;
      ballotCandidate.removedFromList = false;
    } else {
      ballotCandidate = position.replacementCandidate = {
        ...candidate,
        onList: false,
        removedFromList: false,
      };
    }

    position.isSlotAvailable = false;
    this.updateEmptyVoteCount(uiData, -1);
    this.updateValidCandidateCount(uiData);
    this.updateCandidateAccumulated(ballotCandidate, uiData);
    this.updateEditableCandidatesForAddedCandidate(ballotCandidate, uiData);
  }

  public newBallot(ballotNumber: number, listCandidates: ProportionalElectionCandidate[]): ProportionalElectionResultBallot {
    return {
      isNew: true,
      number: ballotNumber,
      candidates: [
        ...listCandidates.map(c => ({
          ...c,
          onList: true,
          removedFromList: false,
        })),
        ...listCandidates
          .filter(c => c.accumulated)
          .map(c => ({
            ...c,
            position: c.accumulatedPosition,
            onList: true,
            removedFromList: false,
          })),
      ],
      emptyVoteCount: 0,
    };
  }

  public updateUserEnteredEmptyVoteCount(ballotUiData: ProportionalElectionBallotUiData, emptyVoteCount: number): void {
    ballotUiData.userEnteredEmptyVoteCount = emptyVoteCount;
    ballotUiData.emptyVoteCountValid = ballotUiData.emptyVoteCount === emptyVoteCount;
  }

  private updateCandidateAccumulated({ id }: ProportionalElectionBallotCandidate, uiData: ProportionalElectionBallotUiData): void {
    const matchedCandidates = this.getAllCandidates(uiData).filter(c => c.id === id);
    const accumulated = matchedCandidates.filter(c => !c.removedFromList).length > 1;
    for (const candidate of matchedCandidates) {
      candidate.accumulated = accumulated;
    }
  }

  private updateAllCandidateAccumulated(allCandidates: ProportionalElectionBallotCandidate[]): void {
    const byId = groupBy(
      allCandidates,
      c => c.id,
      c => c,
    );
    for (const candidates of Object.values(byId)) {
      const accumulated = candidates.filter(c => !c.removedFromList).length > 1;
      for (const candidate of candidates) {
        candidate.accumulated = accumulated;
      }
    }
  }

  private updateEditableCandidatesForAddedCandidate(
    candidate: ProportionalElectionBallotCandidate,
    uiData: ProportionalElectionBallotUiData,
  ): void {
    // if the candidate is added and is now accumulated it cannot be added anymore (remove it from the addable candidates)
    if (candidate.accumulated) {
      this.setCandidateAddable(uiData, { ...candidate, accumulatedPosition: -1 }, false);
    }

    // if a candidate is not yet removable it is definitely now as the candidate is freshly added.
    this.setCandidateRemovable(uiData, candidate, true);
  }

  private updateEmptyVoteCount(uiData: ProportionalElectionBallotUiData, delta: number): void {
    uiData.emptyVoteCount += delta;
    this.updateEmptyVoteCountComputed(uiData);
  }

  private updateEmptyVoteCountComputed(uiData: ProportionalElectionBallotUiData): void {
    if (uiData.automaticEmptyVoteCounting) {
      uiData.userEnteredEmptyVoteCount = uiData.emptyVoteCount;
    } else {
      uiData.emptyVoteCountValid = uiData.userEnteredEmptyVoteCount === uiData.emptyVoteCount;
    }
  }

  private updateValidCandidateCount(uiData: ProportionalElectionBallotUiData): void {
    if (uiData.listNumber) {
      uiData.candidateCountValid = true;
      return;
    }

    // ballots without a party need at least one candidate
    uiData.candidateCountValid = uiData.listPositions.some(
      x => (!!x.listCandidate && !x.listCandidate.removedFromList) || !!x.replacementCandidate,
    );
  }

  private updateEditableCandidatesForRemovedCandidate(
    candidate: ProportionalElectionBallotCandidate,
    uiData: ProportionalElectionBallotUiData,
  ): void {
    this.setCandidateAddable(uiData, { ...candidate, accumulatedPosition: -1 }, true);

    // candidate is removable if it is added as a replacement candidate
    // or if it is on the list and not yet removed
    const candidateIsRemovable = !!uiData.listPositions.find(
      x => (x.listCandidate?.id === candidate.id && !x.listCandidate.removedFromList) || x.replacementCandidate?.id === candidate.id,
    );
    this.setCandidateRemovable(uiData, candidate, candidateIsRemovable);
  }

  private updateEditableCandidates(uiData: ProportionalElectionBallotUiData, electionCandidates: ProportionalElectionCandidate[]): void {
    const allCandidates = this.getAllCandidates(uiData);
    uiData.removableCandidatesByNumber = {};
    uiData.removableCandidatesInRangeByNumber = {};
    for (const removableCandidate of allCandidates.filter(x => !x.removedFromList)) {
      this.setCandidateRemovable(uiData, removableCandidate, true);
    }

    const accumulatedCandidateIds = allCandidates.filter(x => x && x.accumulated).map(x => x.id);
    uiData.addableCandidatesByNumber = {};
    for (const addableCandidate of electionCandidates.filter(x => !accumulatedCandidateIds.includes(x.id))) {
      this.setCandidateAddable(uiData, addableCandidate, true);
    }
  }

  private getAllCandidates(uiData: ProportionalElectionBallotUiData): ProportionalElectionBallotCandidate[] {
    return [
      ...uiData.listPositions.filter(x => x.listCandidate).map(x => x.listCandidate!),
      ...uiData.listPositions.filter(x => x.replacementCandidate).map(x => x.replacementCandidate!),
    ];
  }

  private setCandidateAddable(uiData: ProportionalElectionBallotUiData, candidate: ProportionalElectionCandidate, addable: boolean): void {
    const number = candidate.listNumber + candidate.number + (uiData.candidateCheckDigit ? candidate.checkDigit : '');
    if (addable) {
      uiData.addableCandidatesByNumber[number] = candidate;
    } else {
      delete uiData.addableCandidatesByNumber[number];
    }
  }

  private setCandidateRemovable(
    uiData: ProportionalElectionBallotUiData,
    candidate: ProportionalElectionBallotCandidate,
    removable: boolean,
  ): void {
    const sameList = uiData.listNumber === candidate.listNumber;
    const candidateNumberWithCheckDigit = candidate.number + (uiData.candidateCheckDigit ? candidate.checkDigit : '');
    if (removable) {
      uiData.removableCandidatesByNumber[candidate.listNumber + candidateNumberWithCheckDigit] = candidate;

      if (sameList) {
        uiData.removableCandidatesByNumber[candidateNumberWithCheckDigit] = candidate;
        if (!isNaN(+candidateNumberWithCheckDigit)) {
          uiData.removableCandidatesInRangeByNumber[+candidateNumberWithCheckDigit] = candidate;
        }
      }

      return;
    }

    delete uiData.removableCandidatesByNumber[candidate.listNumber + candidateNumberWithCheckDigit];
    if (sameList) {
      delete uiData.removableCandidatesByNumber[candidateNumberWithCheckDigit];
      if (!isNaN(+candidateNumberWithCheckDigit)) {
        delete uiData.removableCandidatesInRangeByNumber[+candidateNumberWithCheckDigit];
      }
    }
  }
}

export interface ProportionalElectionBallotUiData {
  // each list position. this array always has the length of numberOfMandates
  listPositions: ProportionalElectionBallotListPosition[];

  // candidates which can be added to the ballot
  // indexed by the candidates number including the list number but without the dots
  addableCandidatesByNumber: Record<string, ProportionalElectionCandidate>;

  // candidates which can be removed from the ballot
  // indexed by the candidates number and additionally by the list number + candidates number without the dot.
  removableCandidatesByNumber: Record<string, ProportionalElectionBallotCandidate>;

  // candidates which can be removed from the ballot
  // indexed by the candidates number converted to a number
  removableCandidatesInRangeByNumber: Record<number, ProportionalElectionBallotCandidate>;

  automaticEmptyVoteCounting: boolean;
  emptyVoteCountValid: boolean;
  userEnteredEmptyVoteCount: number;
  emptyVoteCount: number;
  numberOfMandates: number;
  listNumber?: string;
  candidateCountValid: boolean;
  candidateCheckDigit: boolean;
}

export interface ProportionalElectionBallotListPosition {
  // the position
  position: number;

  // the candidate on the list or undefined if it is an empty slot
  // if this is a candidate which was removed from the list this property is set
  // but removedFromList of the object is set to true.
  listCandidate?: ProportionalElectionBallotCandidate;

  // the added candidate or undefined if it is an empty slot
  replacementCandidate?: ProportionalElectionBallotCandidate;

  // true if a replacement candidate can be added, false otherwise
  isSlotAvailable: boolean;
}
