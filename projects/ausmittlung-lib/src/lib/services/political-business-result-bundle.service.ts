/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable } from '@angular/core';
import {
  PoliticalBusinessResultBallotLog,
  PoliticalBusinessResultBundleLog,
  PoliticalBusinessResultBundleLogProto,
  PoliticalBusinessResultBallotLogProto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class PoliticalBusinessResultBundleService {
  public static mapToPoliticalBusinessResultBundleLog(proto: PoliticalBusinessResultBundleLogProto): PoliticalBusinessResultBundleLog {
    return {
      ...proto.toObject(),
      user: proto.getUser()!.toObject(),
      timestamp: proto.getTimestamp()!.toDate(),
    };
  }

  public static mapToPoliticalBusinessResultBallotLog(proto: PoliticalBusinessResultBallotLogProto): PoliticalBusinessResultBallotLog {
    return {
      user: proto.getUser()!.toObject(),
      timestamp: proto.getTimestamp()!.toDate(),
    };
  }
}
