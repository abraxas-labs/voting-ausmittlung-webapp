/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  DomainOfInfluence as DomainOfInfluenceProto,
  DomainOfInfluenceCanton,
} from '@abraxas/voting-ausmittlung-service-proto/grpc/models/domain_of_influence_pb';
import { DomainOfInfluenceType } from '@abraxas/voting-ausmittlung-service-proto/grpc/shared/domain_of_influence_pb';

export type DomainOfInfluence = DomainOfInfluenceProto.AsObject;
export { DomainOfInfluenceType, DomainOfInfluenceCanton };
export { DomainOfInfluenceProto };
