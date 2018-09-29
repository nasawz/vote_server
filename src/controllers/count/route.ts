import { voteAllCount, voteItemCount, mostValuefullUser } from './main';

export default (base, app) => {
  app.get(`${base}/vote_all_count/:activityId`, voteAllCount);
  app.get(`${base}/vote_item_count/:activityId`, voteItemCount);
  app.get(`${base}/most_valuefull_user/:activityId`, mostValuefullUser);
};
