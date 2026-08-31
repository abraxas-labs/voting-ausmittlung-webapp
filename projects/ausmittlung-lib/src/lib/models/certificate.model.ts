/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CertificateInfo as CertificateInfoProto } from '@abraxas/voting-ausmittlung-service-proto/grpc/models/certificate_pb';

export interface CertificateInfo {
  subject: string;
  issuer: string;
  thumbprint: string;
  notBefore: Date;
  notAfter: Date;
  caThumbprint: string;
  cn: string;
}

export function mapToCertificateInfo(proto?: CertificateInfoProto): CertificateInfo | undefined {
  if (!proto) {
    return undefined;
  }

  const subject = proto.getSubject();
  const cnMatch = subject.match(/CN=([^,]+)/);

  return {
    ...proto.toObject(),
    notBefore: proto.getNotBefore()!.toDate(),
    notAfter: proto.getNotAfter()!.toDate(),
    cn: cnMatch ? cnMatch[1] : '',
  };
}
