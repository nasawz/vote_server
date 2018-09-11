import { auth, touch, oauth_response, jsconfig } from './main';

export default (base, app) => {
  app.get(`${base}/auth/:activityId`, auth);
  app.get(`${base}/touch/:activityId`, touch);
  app.get(`${base}/oauth_response/:activityId`, oauth_response);
  app.get(`${base}/jsconfig/:activityId`, jsconfig);
};
