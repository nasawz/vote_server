import {
  addVote,
  addVoteItem,
  delVoteItem,
  myVoteItem,
  getVoteItems,
  getVoteItemById
} from './main';

export default (base, app) => {
  app.post(`${base}/addVote/:activityId/:id`, addVote);
  app.post(`${base}/addVoteItem/:activityId`, addVoteItem);
  app.get(`${base}/myVoteItem/:activityId`, myVoteItem);
  app.get(`${base}/voteItems/:activityId`, getVoteItems);
  app.get(`${base}/voteItem/:activityId/:id`, getVoteItemById);
  app.delete(`${base}/delVoteItem/:activityId/:id`, delVoteItem);
};
