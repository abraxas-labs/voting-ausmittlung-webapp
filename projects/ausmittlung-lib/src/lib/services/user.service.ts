/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AuthenticationService } from '@abraxas/base-components';
import { Injectable, inject } from '@angular/core';
import { User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly auth = inject(AuthenticationService);

  // user change needs a reload of the page, no extra handling needed
  private cachedUser?: User;

  public async getUser(): Promise<User> {
    if (this.cachedUser) {
      return this.cachedUser;
    }

    const user = await this.auth.getUserProfile();
    this.cachedUser = {
      firstName: user.info.given_name,
      lastName: user.info.family_name,
      fullName: `${user.info.given_name} ${user.info.family_name}`,
      secureConnectId: user.info.sub,
    };
    return this.cachedUser;
  }
}
