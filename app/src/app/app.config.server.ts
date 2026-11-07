import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';

import { authConfig } from '../server/auth/session';
import { appConfig } from './app.config';
import { SIGN_IN_SET_UP } from './auth/auth.service';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(), { provide: SIGN_IN_SET_UP, useFactory: () => authConfig() !== null }],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
