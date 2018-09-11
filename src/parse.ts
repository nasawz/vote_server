import * as Parse from 'parse/node';
import * as config from './config/config.json';
Parse.initialize(config.parse.appId, '', config.parse.masterKey);
Parse.serverURL = config.parse.serverURL;
Parse.Cloud.useMasterKey();

export { Parse };
