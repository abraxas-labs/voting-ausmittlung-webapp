/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

const CreateSuffix = ':create';
const UpdateSuffix = ':update';
const ReadSuffix = ':read';
const DeleteSuffix = ':delete';

// Used when the "normal" permission (ex. 'read') allows access only to specific resources, while the  '-all' allows access to all resources
const ReadAllSuffix = ReadSuffix + '-all';
const UpdateAllSuffix = UpdateSuffix + '-all';

export class Permissions {
  private static readonly ContestPrefix = 'Contest';
  public static readonly Contest = {
    Read: Permissions.ContestPrefix + ReadSuffix,
  };

  private static readonly PoliticalBusinessPrefix = 'PoliticalBusiness';
  public static readonly PoliticalBusiness = {
    // Allowed to read political businesses owned by the tenant
    ReadOwned: Permissions.PoliticalBusinessPrefix + ':read-owned',

    // Allowed to read political businesses accessible to the user
    ReadAccessible: Permissions.PoliticalBusinessPrefix + ':read-accessible',
  };

  private static readonly PoliticalBusinessResultPrefix = 'PoliticalBusinessResult';
  public static readonly PoliticalBusinessResult = {
    Read: Permissions.PoliticalBusinessResultPrefix + ReadSuffix,
    ReadComments: Permissions.PoliticalBusinessResultPrefix + ':read-comments',
    ReadOverview: Permissions.PoliticalBusinessResultPrefix + ':read-overview',
    EnterResults: Permissions.PoliticalBusinessResultPrefix + ':enter-results',
    ResetResults: Permissions.PoliticalBusinessResultPrefix + ':reset-results',
    StartSubmission: Permissions.PoliticalBusinessResultPrefix + ':start-submission',
    FinishSubmission: Permissions.PoliticalBusinessResultPrefix + ':finish-submission',
    Audit: Permissions.PoliticalBusinessResultPrefix + ':audit',
    FinishSubmissionAndAudit: Permissions.PoliticalBusinessResultPrefix + ':finish-submission-and-audit',
  };

  private static readonly PoliticalBusinessResultBundlePrefix = 'PoliticalBusinessResultBundle';
  public static readonly PoliticalBusinessResultBundle = {
    Read: Permissions.PoliticalBusinessResultBundlePrefix + ReadSuffix,
    Create: Permissions.PoliticalBusinessResultBundlePrefix + CreateSuffix,
    UpdateAll: Permissions.PoliticalBusinessResultBundlePrefix + UpdateAllSuffix,
    Delete: Permissions.PoliticalBusinessResultBundlePrefix + DeleteSuffix,
    FinishSubmission: Permissions.PoliticalBusinessResultBundlePrefix + ':finish-submission',
    Review: Permissions.PoliticalBusinessResultBundlePrefix + ':review',
  };

  private static readonly PoliticalBusinessResultBallotPrefix = 'PoliticalBusinessResultBallot';
  public static readonly PoliticalBusinessResultBallot = {
    Read: Permissions.PoliticalBusinessResultBallotPrefix + ReadSuffix,
    ReadAll: Permissions.PoliticalBusinessResultBallotPrefix + ReadAllSuffix,
    Create: Permissions.PoliticalBusinessResultBallotPrefix + CreateSuffix,
    Update: Permissions.PoliticalBusinessResultBallotPrefix + UpdateSuffix,
    Delete: Permissions.PoliticalBusinessResultBallotPrefix + DeleteSuffix,
  };

  private static readonly VoteBallotResultPrefix = 'VoteBallotResult';
  public static readonly VoteBallotResult = {
    Read: Permissions.VoteBallotResultPrefix + ReadSuffix,
  };

  private static readonly MajorityElectionBallotGroupResultPrefix = 'MajorityElectionBallotGroupResult';
  public static readonly MajorityElectionBallotGroupResult = {
    Read: Permissions.MajorityElectionBallotGroupResultPrefix + ReadSuffix,
  };

  private static readonly MajorityElectionCandidatePrefix = 'MajorityElectionCandidate';
  public static readonly MajorityElectionCandidate = {
    Read: Permissions.MajorityElectionCandidatePrefix + ReadSuffix,
  };

  private static readonly MajorityElectionWriteInPrefix = 'MajorityElectionWriteIn';
  public static readonly MajorityElectionWriteIn = {
    Read: Permissions.MajorityElectionWriteInPrefix + ReadSuffix,
    Update: Permissions.MajorityElectionWriteInPrefix + UpdateSuffix,
  };

  private static readonly ProportionalElectionCandidatePrefix = 'ProportionalElectionCandidate';
  public static readonly ProportionalElectionCandidate = {
    Read: Permissions.ProportionalElectionCandidatePrefix + ReadSuffix,
  };

  private static readonly ProportionalElectionListPrefix = 'ProportionalElectionList';
  public static readonly ProportionalElectionList = {
    Read: Permissions.ProportionalElectionListPrefix + ReadSuffix,
  };

  private static readonly ProportionalElectionListResultPrefix = 'ProportionalElectionListResult';
  public static readonly ProportionalElectionListResult = {
    Read: Permissions.ProportionalElectionListResultPrefix + ReadSuffix,
  };

  private static readonly ProportionalElectionEndResultPrefix = 'ProportionalElectionEndResult';
  public static readonly ProportionalElectionEndResult = {
    EnterManualResults: Permissions.ProportionalElectionEndResultPrefix + ':enter-manual-results',
  };

  private static readonly PoliticalBusinessEndResultPrefix = 'PoliticalBusinessEndResult';
  public static readonly PoliticalBusinessEndResult = {
    Read: Permissions.PoliticalBusinessEndResultPrefix + ReadSuffix,
    Finalize: Permissions.PoliticalBusinessEndResultPrefix + ':finalize',
  };

  private static readonly PoliticalBusinessEndResultLotDecisionPrefix = 'PoliticalBusinessEndResultLotDecision';
  public static readonly PoliticalBusinessEndResultLotDecision = {
    Read: Permissions.PoliticalBusinessEndResultLotDecisionPrefix + ReadSuffix,
    Update: Permissions.PoliticalBusinessEndResultLotDecisionPrefix + UpdateSuffix,
  };

  private static readonly PoliticalBusinessUnionPrefix = 'PoliticalBusinessUnion';
  public static readonly PoliticalBusinessUnion = {
    Read: Permissions.PoliticalBusinessUnionPrefix + ReadSuffix,
  };

  private static readonly CountingCircleContactPersonPrefix = 'CountingCircleContactPerson';
  public static readonly CountingCircleContactPerson = {
    Create: Permissions.CountingCircleContactPersonPrefix + CreateSuffix,
    Update: Permissions.CountingCircleContactPersonPrefix + UpdateSuffix,
  };

  private static readonly ContestCountingCircleElectoratePrefix = 'ContestCountingCircleElectorate';
  public static readonly ContestCountingCircleElectorate = {
    Update: Permissions.ContestCountingCircleElectoratePrefix + UpdateSuffix,
  };

  private static readonly ContestCountingCircleDetailsPrefix = 'ContestCountingCircleDetails';
  public static readonly ContestCountingCircleDetails = {
    Update: Permissions.ContestCountingCircleDetailsPrefix + UpdateSuffix,
  };

  private static readonly ImportPrefix = 'Import';
  public static readonly Import = {
    ImportECounting: Permissions.ImportPrefix + ':import-ecounting',
    ReadECounting: Permissions.ImportPrefix + ':read-ecounting',
    DeleteECounting: Permissions.ImportPrefix + ':delete-ecounting',

    ImportEVoting: Permissions.ImportPrefix + ':import-evoting',
    ReadEVoting: Permissions.ImportPrefix + ':read-evoting',
    DeleteEVoting: Permissions.ImportPrefix + ':delete-evoting',

    ListenToImportChanges: Permissions.ImportPrefix + ':listen-import-changes',
  };

  private static readonly ExportPrefix = 'Export';
  public static readonly Export = {
    ExportData: Permissions.ExportPrefix + ':export',
    ExportMonitoringData: Permissions.ExportPrefix + ':export-monitoring',
    ExportActivityProtocol: Permissions.ExportPrefix + ':export-activity-protocol',
  };

  private static readonly ExportConfigurationPrefix = 'ExportConfiguration';
  public static readonly ExportConfiguration = {
    Read: Permissions.ExportConfigurationPrefix + ReadSuffix,
    Update: Permissions.ExportConfigurationPrefix + UpdateSuffix,
    Trigger: Permissions.ExportConfigurationPrefix + ':trigger',
  };
}
