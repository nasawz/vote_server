import { touch, fake } from './main';

export default (base, app) => {
  app.get(`${base}/touch`, touch);
  app.get(`${base}/fake`, fake);
};
