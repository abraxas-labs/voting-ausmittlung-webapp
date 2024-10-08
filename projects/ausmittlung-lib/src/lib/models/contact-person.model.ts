/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ContactPerson as ContactPersonProto } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/contact_person_pb';

export { ContactPersonProto };

export type ContactPerson = ContactPersonProto.AsObject;
