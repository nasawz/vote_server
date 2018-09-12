import { addVote, addVoteItem, delVoteItem, myVoteItem } from './main';

export default (base, app) => {
  app.post(`${base}/addVote/:activityId/:id`, addVote);
  app.post(`${base}/addVoteItem/:activityId/:id`, addVoteItem);
  app.get(`${base}/myVoteItem/:activityId/`, myVoteItem);
  app.delete(`${base}/delVoteItem/:activityId/:id`, delVoteItem);
};
