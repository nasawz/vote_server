import { index, oauth_response, jsconfig } from './main';

export default (base, app) => {
  app.get(`${base}/auth/:activityId`, index);
  app.get(`${base}/oauth_response/:activityId`, oauth_response);
  app.post(`${base}/jsconfig/:activityId`, jsconfig);
};
