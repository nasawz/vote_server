import { share } from './main';

export default (base, app) => {
  app.post(`${base}/share`, share);
};
