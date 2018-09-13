import { Parse } from '../../parse';
import * as _ from 'lodash';

let getActivity: any = activityId => {
  return new Promise(async (resolve, reject) => {
    const Activity = Parse.Object.extend('activity');
    const a_query = new Parse.Query(Activity);
    a_query.equalTo('objectId', activityId);
    let activity = await a_query.first();
    resolve(activity);
  });
};

let getWXUser: any = id => {
  return new Promise(async (resolve, reject) => {
    const WXUser = Parse.Object.extend('wx_user');
    const a_query = new Parse.Query(WXUser);
    a_query.equalTo('objectId', id);
    let wxuser = await a_query.first();
    resolve(wxuser);
  });
};

let getVoteItem: any = id => {
  return new Promise(async (resolve, reject) => {
    const VoteItem = Parse.Object.extend('vote_item');
    const query = new Parse.Query(VoteItem);
    query.equalTo('objectId', id);
    query.equalTo('status', 0);
    let vote_item = await query.first();
    resolve(vote_item);
  });
};

let getVoteItemsByUser = user => {
  return new Promise(async (resolve, reject) => {
    const VoteItem = Parse.Object.extend('vote_item');
    const query = new Parse.Query(VoteItem);
    query.equalTo('voters', user);
    query.equalTo('status', 0);
    let vote_items = await query.find();
    resolve(vote_items);
  });
};

let ckUser = (req, res, cb) => {
  // !!!!!!!!!!!!!!!!!!!// !!!!!!!!!!!!!!!!!!!// !!!!!!!!!!!!!!!!!!!// !!!!!!!!!!!!!!!!!!!
  // req.session.user = {
  //   // objectId: 'vtDCKVLNKh'
  //   objectId: 'mrt4GgJy8m' // 企业用户
  // };
  // req.session.save(function(err) {});
  // !!!!!!!!!!!!!!!!!!!// !!!!!!!!!!!!!!!!!!!// !!!!!!!!!!!!!!!!!!!// !!!!!!!!!!!!!!!!!!!

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
    // 取得当前用户所有的投票项
    let vote_items = await getVoteItemsByUser(wxuser);

    /**
     * 规则验证
     * wx_user_rule 微信用户
     * qywx_user_rule 企业用户
     */
    let { wx_user_rule, qywx_user_rule } = activity.toJSON();
    // 用户类型 1：微信用户 2：企业用户
    let { type } = wxuser.toJSON();

    if (type == 1) {
      // 微信用户 wx_user_rule
      if (wx_user_rule == 0) {
        // 外部微信用户每个作品都可以投1票
        let hasVote = false;
        _.map(vote_items, item => {
          if (item.toJSON().objectId == id) {
            hasVote = true;
          }
        });
        if (hasVote) {
          return res.boom.badRequest('只能为这个作品投1票');
        }
      }
    }

    if (type == 2) {
      // 微信用户 qywx_user_rule
      if (qywx_user_rule == 0) {
        // 微信用户每组可投3票,每个作品限1票
        let hasVote = false;
        let group_len = 0;
        _.map(vote_items, item => {
          if (item.toJSON().objectId == id) {
            hasVote = true;
          }
          if (item.toJSON().category == vote_item.toJSON().category) {
            group_len++;
          }
        });
        if (group_len >= 3) {
          return res.boom.badRequest('本组最多能投3票');
        }
        if (hasVote) {
          return res.boom.badRequest('只能为这个作品投1票');
        }
      }
    }
    vote_item.increment('score');
    let relation = vote_item.relation('voters');
    relation.add(wxuser);
    vote_item.save().then(
      data => {
        return res.json(data);
      },
      err => {
        return res.boom.badRequest('add vote fail', err);
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

    let { join_rule } = activity.toJSON();
    // 用户类型 1：微信用户 2：企业用户
    let { type } = wxuser.toJSON();
    /**
     * 资格检测 join_rule
     * 2 : 企业用户可参与
     * 1 : 全部用户可参与
     */
    if (join_rule == 2) {
      if (type != 2) {
        return res.boom.badRequest('只有企业用户才可参与活动');
      }
    }
    // 已提交检测
    const VoteItem = Parse.Object.extend('vote_item');
    const query = new Parse.Query(VoteItem);
    query.equalTo('activity', activity);
    query.equalTo('owner', wxuser);
    query.equalTo('status', 0);
    if (await query.first()) {
      return res.boom.badRequest('您已参与活动了');
    }
    let data = req.body;
    let u = wxuser.toJSON();
    const voteItem = new VoteItem({
      title: data.title,
      category: data.category,
      desc: data.desc,
      pic: data.pic,
      score: 0,
      status: 0,
      name: u.name,
      mobile: u.mobile,
      userid: u.userid
    });
    voteItem.set('activity', activity);
    voteItem.set('owner', wxuser);
    voteItem.save().then(
      result => {
        return res.json(result);
      },
      err => {
        return res.boom.badRequest('save vote_item fail', err);
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
      return res.boom.badRequest('del vote_item fail');
    }
    vote_item.set('status', -1);
    vote_item.save().then(
      res => {
        return res.json(res);
      },
      err => {
        return res.boom.badRequest('del vote_item fail', err);
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
    query.equalTo('status', 0);
    let vote_item = await query.first();
    let pipeline = {
      match: { status: 0, category: vote_item.toJSON().category },
      sort: {
        score: -1
      },
      group: {
        objectId: null,
        items: {
          $push: {
            _id: '$_id',
            title: '$title',
            score: '$score',
            category: '$category',
            desc: '$desc',
            pic: '$pic'
          }
        }
      },
      unwind: {
        path: '$items',
        includeArrayIndex: 'items.rank'
      },
      project: {
        objectId: '$items._id',
        title: '$items.title',
        score: '$items.score',
        category: '$items.category',
        desc: '$items.desc',
        pic: '$items.pic',
        rank: { $add: ['$items.rank', 1] }
      }
    };
    const query_rank = new Parse.Query(VoteItem);
    query_rank.equalTo('activity', activity);
    query_rank
      .aggregate(pipeline)
      .then(function(results) {
        let index = _.findIndex(results, function(r) {
          return r.objectId == vote_item.toJSON().objectId;
        });
        if (index > -1) {
          return res.json(results[index]);
        } else {
          return res.boom.notFound('not vote_item fond');
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  });
};

let getVoteItems = async (req, res) => {
  let { activityId } = req.params;
  let { limit = 10, skip = 0, category = '' } = req.query;
  let pipeline = {
    match: { status: 0, category: category },
    sort: {
      score: -1
    },
    group: {
      objectId: null,
      items: {
        $push: {
          _id: '$_id',
          title: '$title',
          score: '$score',
          category: '$category',
          desc: '$desc',
          pic: '$pic'
        }
      }
    },
    unwind: {
      path: '$items',
      includeArrayIndex: 'items.rank'
    },
    project: {
      objectId: '$items._id',
      title: '$items.title',
      score: '$items.score',
      category: '$items.category',
      desc: '$items.desc',
      pic: '$items.pic',
      rank: { $add: ['$items.rank', 1] }
    },
    limit: parseInt(limit),
    skip: parseInt(skip)
  };
  const Activity = Parse.Object.extend('activity');
  let activity = new Activity();
  activity.id = activityId;
  const VoteItem = Parse.Object.extend('vote_item');
  const query = new Parse.Query(VoteItem);
  query.equalTo('activity', activity);
  query
    .aggregate(pipeline)
    .then(function(results) {
      return res.json(results);
    })
    .catch(function(error) {
      console.log(error);
    });
};

let getVoteItemById = async (req, res) => {
  let { activityId, id } = req.params;
  let vote_item = await getVoteItem(id);
  if (!vote_item) {
    return res.boom.notFound('not vote_item fond');
  }
  let pipeline = {
    match: { status: 0, category: vote_item.toJSON().category },
    sort: {
      score: -1
    },
    group: {
      objectId: null,
      items: {
        $push: {
          _id: '$_id',
          title: '$title',
          score: '$score',
          category: '$category',
          desc: '$desc',
          pic: '$pic'
        }
      }
    },
    unwind: {
      path: '$items',
      includeArrayIndex: 'items.rank'
    },
    project: {
      objectId: '$items._id',
      title: '$items.title',
      score: '$items.score',
      category: '$items.category',
      desc: '$items.desc',
      pic: '$items.pic',
      rank: { $add: ['$items.rank', 1] }
    }
  };
  const Activity = Parse.Object.extend('activity');
  let activity = new Activity();
  activity.id = activityId;
  const VoteItem = Parse.Object.extend('vote_item');
  const query = new Parse.Query(VoteItem);
  query.equalTo('activity', activity);
  query
    .aggregate(pipeline)
    .then(function(results) {
      let index = _.findIndex(results, function(r) {
        return r.objectId == id;
      });
      if (index > -1) {
        return res.json(results[index]);
      } else {
        return res.boom.notFound('not vote_item fond');
      }
    })
    .catch(function(error) {
      console.log(error);
    });
};

export { addVote, delVoteItem, addVoteItem, myVoteItem, getVoteItems, getVoteItemById };
