/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Int32Value } from 'google-protobuf/google/protobuf/wrappers_pb';

type ReplaceType<T, Match, Replacement> = {
  [K in keyof T]: T[K] extends Match ? Replacement : T[K];
};

export type ReplaceProtoOptionalInts<T> = ReplaceType<T, Int32Value.AsObject | undefined, number | undefined>;

export function createInt32Value(v: number | undefined): Int32Value | undefined {
  if (v === undefined || v === null) {
    return;
  }

  const proto = new Int32Value();
  proto.setValue(v);
  return proto;
}
