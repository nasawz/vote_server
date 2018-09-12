import { touch } from './main';

export default (base, app) => {
  app.get(`${base}/touch`, touch);
};
