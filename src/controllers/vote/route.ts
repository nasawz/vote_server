import { addVote, addVoteItem, delVoteItem } from './main';

export default (base, app) => {
  app.post(`${base}/addVote/:activityId/:id`, addVote);
  app.post(`${base}/addVoteItem/:activityId/:id`, addVoteItem);
  app.delete(`${base}/delVoteItem/:activityId/:id`, delVoteItem);
};
