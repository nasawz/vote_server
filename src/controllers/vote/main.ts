import { Parse } from '../../parse';

let getActivity: any = activityId => {
  return new Promise(async (resolve, reject) => {
    const Activity = Parse.Object.extend('activity');
    const a_query = new Parse.Query(Activity);
    a_query.equalTo('objectId', activityId);
    let activity = await a_query.first();
    resolve(activity.toJSON());
  });
};

let getWXUser: any = id => {
  return new Promise(async (resolve, reject) => {
    const WXUser = Parse.Object.extend('wx_user');
    const a_query = new Parse.Query(WXUser);
    a_query.equalTo('objectId', id);
    let wxuser = await a_query.first();
    resolve(wxuser.toJSON());
  });
};

let getVoteItem: any = id => {
  return new Promise(async (resolve, reject) => {
    const VoteItem = Parse.Object.extend('vote_item');
    const query = new Parse.Query(VoteItem);
    query.equalTo('objectId', id);
    let vote_item = await query.first();
    resolve(vote_item.toJSON());
  });
};

let getVoteItemsByUser = user => {
  return new Promise(async (resolve, reject) => {
    const VoteItem = Parse.Object.extend('vote_item');
    const query = new Parse.Query(VoteItem);
    query.equalTo('voters', user);
    let vote_items = await query.find();
    resolve(vote_items);
  });
};

let ckUser = (req, res, cb) => {
  let { user } = req.session;
  if (user) {
    cb(req, res);
  } else {
    return res.boom.notFound('user not login');
  }
};

let addVote = async (req, res) => {
  ckUser(req, res, async (req, res) => {
    let { activityId, id } = req.params;
    let activity = await getActivity(activityId);
    let { user } = req.session;
    let wxuser = await getWXUser(user.objectId);
    let vote_item = await getVoteItem(id);
    // TODO 规则验证 1 微信用户 2 企业用户
    // 取得当前用户所有的投票项
    let vote_items = await getVoteItemsByUser(wxuser);

    vote_item.increment('score');
    let relation = vote_item.relation('voters');
    relation.add(wxuser);
    vote_item.save().then(
      res => {
        return res.json(res);
      },
      err => {
        return res.badRequest('add vote fail', err);
      }
    );
  });
};

let addVoteItem = async (req, res) => {
  ckUser(req, res, async (req, res) => {
    let { activityId } = req.params;
    let activity = await getActivity(activityId);
    let { user } = req.session;
    let wxuser = await getWXUser(user.objectId);
    // TODO 资格检测 1 微信用户 2 企业用户 0 任意用户
    // TODO 已提交检测
    const VoteItem = Parse.Object.extend('vote_item');
    let data = req.body;
    const voteItem = new VoteItem(data);
    voteItem.set('activity', activity);
    voteItem.set('owner', wxuser);
    voteItem.save().then(
      res => {
        return res.json(res);
      },
      err => {
        return res.badRequest('save vote_item fail', err);
      }
    );
  });
};

let delVoteItem = async (req, res) => {
  ckUser(req, res, async (req, res) => {
    let { activityId, id } = req.params;
    let activity = await getActivity(activityId);
    let { user } = req.session;
    let wxuser = await getWXUser(user.objectId);
    const VoteItem = Parse.Object.extend('vote_item');
    const query = new Parse.Query(VoteItem);
    query.equalTo('activity', activity);
    query.equalTo('owner', wxuser);
    query.equalTo('objectId', id);
    let vote_item = await query.first();
    if (!vote_item) {
      return res.badRequest('del vote_item fail');
    }
    vote_item.set('status', -1);
    vote_item.save().then(
      res => {
        return res.json(res);
      },
      err => {
        return res.badRequest('del vote_item fail', err);
      }
    );
  });
};

let myVoteItem = async (req, res) => {
  ckUser(req, res, async (req, res) => {
    let { activityId } = req.params;
    let activity = await getActivity(activityId);
    let { user } = req.session;
    let wxuser = await getWXUser(user.objectId);
    const VoteItem = Parse.Object.extend('vote_item');
    const query = new Parse.Query(VoteItem);
    query.equalTo('activity', activity);
    query.equalTo('owner', wxuser);
    let vote_item = await query.first();
    if (vote_item) {
      return res.json(vote_item);
    } else {
      return res.boom.notFound('not vote_item fond');
    }
  });
};
export { addVote, delVoteItem, addVoteItem, myVoteItem };
