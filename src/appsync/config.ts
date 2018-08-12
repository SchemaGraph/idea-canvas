import { AUTH_TYPE, AWSAppSyncClientOptions } from 'aws-appsync';
import { AuthOptions } from 'aws-appsync/lib/link/auth-link';

export const AppSyncConf = (auth: AuthOptions): AWSAppSyncClientOptions => {
  return {
    url:
      'https://ugjxe2tdzzhsjfuocm3fnzbi4y.appsync-api.eu-west-1.amazonaws.com/graphql',
    region: 'eu-west-1',
    auth,
    complexObjectsCredentials: () => null,
  };
};


