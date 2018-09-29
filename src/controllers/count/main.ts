import { Parse } from '../../parse';
import * as _ from 'lodash';
/**
 * 投票统计总览
 * @param req
 * @param res
 */
let voteAllCount = async (req, res) => {};

/**
 * 投票项统计
 * @param req
 * @param res
 */
let voteItemCount = async (req, res) => {};

let getWXUser: any = id => {
  return new Promise(async (resolve, reject) => {
    const WXUser = Parse.Object.extend('wx_user');
    const a_query = new Parse.Query(WXUser);
    a_query.equalTo('objectId', id);
    let wxuser = await a_query.first();
    resolve(wxuser);
  });
};

/**
 * 最有价值的用户
 * @param req
 * @param res
 */
let mostValuefullUser = async (req, res) => {
  let { activityId } = req.params;
  let { limit = 10, skip = 0 } = req.query;
  let pipeline = [
    {
      match: {
        parent: {
          $ne: null
        },
        _p_activity: `activity$${activityId}`
      }
    },
    {
      project: {
        objectId: 1,
        parent: 1
      }
    },
    {
      group: {
        objectId: '$parent',
        invite_tutorial: {
          $sum: 1
        },
        ids: {
          $push: '$_id'
        }
      }
    },
    {
      sort: {
        invite_tutorial: -1
      }
    },
    {
      skip: skip
    },
    {
      limit: limit
    }
  ];
  const WXUser = Parse.Object.extend('wx_user');
  const query = new Parse.Query(WXUser);
  query
    .aggregate(pipeline)
    .then(async function(results) {
      var _results = await Promise.all(
        results.map(async item => {
          let u = await getWXUser(item.objectId);
          return Object.assign(u.toJSON(), item);
        })
      );
      return res.json(_results);
    })
    .catch(function(error) {
      console.log(error);
    });
};

export { voteAllCount, voteItemCount, mostValuefullUser };
