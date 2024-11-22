/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  ValidationComparisonCountOfVotersData,
  ValidationComparisonValidVotingCardsWithAccountedBallotsData,
  ValidationComparisonVoterParticipationsData,
  ValidationComparisonVotingChannelsData,
  ValidationPoliticalBusinessData,
  ValidationVoteAccountedBallotsEqualQnData,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/validation_pb';
import { EnumItemDescription, EnumUtil } from '@abraxas/voting-lib';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import {
  DomainOfInfluenceType,
  ValidationSummary,
  ValidationSummaryProto,
  ValidationResult,
  ValidationResultProto,
  VotingChannel,
  ValidationSummariesProto,
  ValidationSummaries,
} from '../models';
import { groupBy } from './utils/array.utils';

@Injectable({
  providedIn: 'root',
})
export class ValidationMappingService {
  private readonly votingChannels: EnumItemDescription<VotingChannel>[];
  private readonly doiTypes: EnumItemDescription<DomainOfInfluenceType>[];

  constructor(
    private readonly decimalPipe: DecimalPipe,
    private readonly datePipe: DatePipe,
    private readonly enumUtil: EnumUtil,
  ) {
    this.doiTypes = this.enumUtil.getArrayWithDescriptions<DomainOfInfluenceType>(DomainOfInfluenceType, 'DOMAIN_OF_INFLUENCE_TYPES.');

    this.votingChannels = this.enumUtil.getArrayWithDescriptions<VotingChannel>(VotingChannel, 'VOTING_CHANNELS.');
  }

  public mapToValidationSummaries(v: ValidationSummariesProto): ValidationSummaries {
    return {
      summaries: v.getSummariesList().map(x => this.mapToValidationSummary(x)),
      isValid: v.getIsValid(),
    };
  }

  public mapToValidationSummary(v: ValidationSummaryProto): ValidationSummary {
    const validationResults = v.getValidationResultsList().map(x => this.mapToValidationResult(x));
    return {
      requiredValidationResults: groupBy(
        validationResults.filter(x => !x.isOptional),
        x => x.groupValue,
        x => x,
      ),
      optionalValidationResults: groupBy(
        validationResults.filter(x => x.isOptional),
        x => x.groupValue,
        x => x,
      ),
      isValid: v.getIsValid(),
      title: v.getTitle(),
    };
  }

  private mapToValidationResult(resultProto: ValidationResultProto): ValidationResult {
    const dataCase = resultProto.getDataCase();
    const resultProtoObj = resultProto.toObject();

    const result: ValidationResult = {
      ...resultProtoObj,
      translationId: '' + resultProtoObj.validation,
    };

    switch (dataCase) {
      case ValidationResultProto.DataCase.POLITICAL_BUSINESS_DATA:
        this.mapPoliticalBusinessType(result, resultProto.getPoliticalBusinessData()!.toObject());
        break;
      case ValidationResultProto.DataCase.VOTE_ACCOUNTED_BALLOTS_EQUAL_QN_DATA:
        this.mapVoteAccountedBallotsEqualQnData(result, resultProto.getVoteAccountedBallotsEqualQnData()!.toObject());
        break;
      case ValidationResultProto.DataCase
        .MAJORITY_ELECTION_NUMBER_OF_MANDATES_TIMES_ACCOUNTED_BALLOTS_EQUAL_CAND_VOTES_PLUS_EMPTY_INVALID_VOTES_DATA:
        result.data = resultProto
          .getMajorityElectionNumberOfMandatesTimesAccountedBallotsEqualCandVotesPlusEmptyInvalidVotesData()!
          .toObject();
        break;
      case ValidationResultProto.DataCase.PROPORTIONAL_ELECTION_ACCOUNTED_BALLOTS_EQUAL_MODIFIED_PLUS_UNMODIFIED_LISTS_DATA:
        result.data = resultProto.getProportionalElectionAccountedBallotsEqualModifiedPlusUnmodifiedListsData()!.toObject();
        break;
      case ValidationResultProto.DataCase.COMPARISON_VOTER_PARTICIPATIONS_DATA:
        this.mapComparisonVoterParticipationsData(result, resultProto.getComparisonVoterParticipationsData()!.toObject());
        break;
      case ValidationResultProto.DataCase.COMPARISON_COUNT_OF_VOTERS_DATA:
        this.mapComparisonCountOfVotersData(result, resultProto.getComparisonCountOfVotersData()!.toObject());
        break;
      case ValidationResultProto.DataCase.COMPARISON_VOTING_CHANNELS_DATA:
        this.mapComparisonVotingChannelsData(result, resultProto.getComparisonVotingChannelsData()!.toObject());
        break;
      case ValidationResultProto.DataCase.COMPARISON_VALID_VOTING_CARDS_WITH_ACCOUNTED_BALLOTS_DATA:
        this.mapComparisonValidVotingCardsWithAccountedBallotsData(
          result,
          resultProto.getComparisonValidVotingCardsWithAccountedBallotsData()!.toObject(),
        );
        break;
    }

    return result;
  }

  private mapPoliticalBusinessType(result: ValidationResult, data: ValidationPoliticalBusinessData.AsObject): void {
    result.data = data;
    result.translationId += '.' + data.politicalBusinessType;
  }

  private mapVoteAccountedBallotsEqualQnData(result: ValidationResult, data: ValidationVoteAccountedBallotsEqualQnData.AsObject): void {
    result.data = data;
    result.translationId += '.' + data.questionNumber;
  }

  private mapComparisonVoterParticipationsData(result: ValidationResult, data: ValidationComparisonVoterParticipationsData.AsObject): void {
    result.data = data;
    result.data.deviationPercentString = this.formatNumberToPercentString(data.deviationPercent);
    result.data.thresholdPercentString = this.formatNumberToPercentString(data.thresholdPercent);
    result.data.domainOfInfluenceTypeString = this.formatDomainOfInfluenceTypeToString(data.domainOfInfluenceType);
    result.translationListItemsCount = 2;
  }

  private mapComparisonCountOfVotersData(result: ValidationResult, data: ValidationComparisonCountOfVotersData.AsObject): void {
    result.data = data;
    result.data.deviationPercentString = this.formatNumberToPercentString(data.deviationPercent);
    result.data.thresholdPercentString = this.formatNumberToPercentString(data.thresholdPercent);
    result.data.previousDateString = this.formatDateToDateString(data.previousDate!);
    result.translationListItemsCount = 3;
  }

  private mapComparisonVotingChannelsData(result: ValidationResult, data: ValidationComparisonVotingChannelsData.AsObject): void {
    result.data = data;
    result.data.deviationPercentString = this.formatNumberToPercentString(data.deviationPercent);
    result.data.thresholdPercentString = this.formatNumberToPercentString(data.thresholdPercent);
    result.data.previousDateString = this.formatDateToDateString(data.previousDate!);
    result.data.votingChannelString = this.formatVotingChannelToString(data.votingChannel);
    result.translationListItemsCount = 3;
  }

  private mapComparisonValidVotingCardsWithAccountedBallotsData(
    result: ValidationResult,
    data: ValidationComparisonValidVotingCardsWithAccountedBallotsData.AsObject,
  ): void {
    result.data = data;
    result.data.deviationPercentString = this.formatNumberToPercentString(data.deviationPercent);
    result.data.thresholdPercentString = this.formatNumberToPercentString(data.thresholdPercent);
    result.translationId += '.' + data.politicalBusinessType;
    result.translationListItemsCount = 2;
  }

  private formatNumberToPercentString(value: number): string {
    return this.decimalPipe.transform(value, '1.1-2') + '%';
  }

  private formatDateToDateString(value: Timestamp.AsObject): string {
    const timestamp = new Timestamp();
    timestamp.setSeconds(value.seconds);
    return this.datePipe.transform(timestamp.toDate(), 'dd.MM.yyyy')!;
  }

  private formatDomainOfInfluenceTypeToString(value: DomainOfInfluenceType): string {
    return this.doiTypes.find(x => x.value === value)!.description;
  }

  private formatVotingChannelToString(value: VotingChannel): string {
    return this.votingChannels.find(x => x.value === value)!.description;
  }
}
