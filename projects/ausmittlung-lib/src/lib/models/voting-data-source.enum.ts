/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

export enum VotingDataSource {
  Conventional,
  EVoting,
  ECounting,
  Total,
}

export function dataSourceToPropertyPrefix(dataSource: VotingDataSource): string | undefined {
  switch (dataSource) {
    case VotingDataSource.Conventional:
      return 'conventionalSubTotal';
    case VotingDataSource.EVoting:
      return 'eVotingSubTotal';
    case VotingDataSource.ECounting:
      return 'eCountingSubTotal';
    default:
      return undefined;
  }
}
