import { Parse } from '../../parse';
import { API } from 'wechat-enterprise';
import axios from 'axios';
import * as _ from 'lodash';

let getConfig: any = activityId => {
  return new Promise(async (resolve, reject) => {
    const QYWXConfig = Parse.Object.extend('qywx_config');
    const Activity = Parse.Object.extend('activity');
    const query = new Parse.Query(QYWXConfig);
    const a_query = new Parse.Query(Activity);
    a_query.equalTo('objectId', activityId);
    let activity = await a_query.first();
    query.equalTo('activity', activity);
    const results = await query.first();
    resolve(Object.assign({}, results.toJSON(), { domain: activity.toJSON().domain }));
  });
};

let getUserId = (api, openid) => {
  return new Promise((resolve, reject) => {
    api.getLatestToken((err, data) => {
      axios
        .post(
          `https://qyapi.weixin.qq.com/cgi-bin/user/convert_to_userid?access_token=${
            data.accessToken
          }`,
          { openid: openid }
        )
        .then(res => {
          resolve(res.data.userid);
        })
        .catch(err => {
          reject(err);
        });
    });
  });
};

let getApi: any = async function(corpId, secret, agentid, callback) {
  let api = new API(
    corpId,
    secret,
    agentid,
    async cb => {
      const AT = Parse.Object.extend('access_token');
      const query = new Parse.Query(AT);
      query.equalTo('appid', agentid);
      let value = await query.first();
      if (value) {
        if (new Date().getTime() > JSON.parse(value.toJSON().token).expireTime) {
          // 过期
          console.log(`[qywx]token过期`);
          cb(null, null);
        } else {
          // console.log(`[qywx]获取token ${value.toJSON().token}`);
          cb(null, JSON.parse(value.toJSON().token));
        }
      } else {
        cb(null, null);
      }
    },
    async function(token, cb) {
      let expireTime = new Date().getTime() + (7200 - 10) * 1000;
      token.expireTime = expireTime;
      cb(null, token);
      const AT = Parse.Object.extend('access_token');
      const query = new Parse.Query(AT);
      query.equalTo('appid', agentid);
      let value = await query.first();
      if (value) {
        value.set('token', JSON.stringify(token));
        value
          .save()
          .then(res => {
            console.log(`[qywx]更新token ${JSON.stringify(token)}`);
          })
          .catch(err => {
            console.log(`[qywx]更新token ${JSON.stringify(err)}`);
          });
      } else {
        let at = new AT({
          appid: agentid,
          token: JSON.stringify(token)
        });
        at.save()
          .then(res => {
            console.log(`[qywx]新建token ${JSON.stringify(token)}`);
          })
          .catch(err => {
            console.log(`[qywx]新建token ${JSON.stringify(err)}`);
          });
      }
    }
  );

  callback(null, api);
};

let saveOrUpdateWxUser = async (user, parentId, activityId) => {
  user = Object.assign({}, user, { type: '2', headimgurl: user.avatar });
  _.unset(user, 'errcode');
  _.unset(user, 'errmsg');
  return new Promise(async (resolve, reject) => {
    const WXUser = Parse.Object.extend('wx_user');
    const Activity = Parse.Object.extend('activity');
    let activity = new Activity();
    activity.id = activityId;
    const query = new Parse.Query(WXUser);
    query.equalTo('userid', user.userid);
    const results = await query.first();
    if (results) {
      _.forIn(user, function(value, key) {
        results.set(`${key}`, value);
      });
      results.set('activity', activity);
      results
        .save()
        .then(u => {
          resolve(u.toJSON());
        })
        .catch(err => {
          reject(err);
        });
    } else {
      const wxuser = new WXUser();
      if (parentId != null) {
        let parent = new WXUser();
        parent.id = parentId;
        wxuser.set('parent', parent);
      }
      wxuser.set('activity', activity);
      wxuser
        .save(user)
        .then(u => {
          resolve(u.toJSON());
        })
        .catch(err => {
          reject(err);
        });
    }
  });
};

let auth = async (req, res) => {
  let callback = req.query.callback;
  if (!callback) {
    return res.boom.badRequest('miss callback');
  }
  let { activityId } = req.params;
  let { corpId, secret, agentid, domain } = await getConfig(activityId);
  getApi(corpId, secret, agentid, (err, api) => {
    let url = api.getAuthorizeURL(
      `${domain}/api/qywx/oauth_response/${activityId}`,
      0,
      'snsapi_userinfo'
    );
    req.session.callback = decodeURIComponent(callback);
    req.session.save(function(err) {});
    return res.redirect(url);
  });
};

let oauth_response = async (req, res) => {
  let { code } = req.query;
  if (!code) {
    return res.boom.badRequest('miss code');
  }
  let { activityId } = req.params;
  let { corpId, secret, agentid, domain } = await getConfig(activityId);
  getApi(corpId, secret, agentid, (err, api) => {
    api.getUserIdByCode(code, async (err, baseinfo) => {
      if (!err) {
        let userId = baseinfo.UserId;
        if (!userId) {
          userId = await getUserId(api, baseinfo.OpenId);
        }
        api.getUser(userId, async (err, userinfo) => {
          if (userinfo.errcode != 0) {
            console.log('[qywx]企业登录无权限 尝试用wx登录', err);
            let { callback } = req.session;
            let url = `${domain}/api/wx/auth/${activityId}?callback=${callback}`;
            return res.redirect(url);
          }
          let { callback } = req.session;
          let reg = /-p_(.*)-/gi;
          let _result = reg.exec(callback);
          let parentId = null;
          if (_result) {
            parentId = _result[1];
          }
          let u = await saveOrUpdateWxUser(userinfo, parentId, activityId);
          req.session.user = u;
          req.session.save(function(err) {});
          return res.redirect(callback);
        });
      } else {
        console.log('[qywx]企业登录失败 尝试用wx登录', err);
        let { callback } = req.session;
        let url = `${domain}/api/wx/auth/${activityId}?callback=${callback}`;
        return res.redirect(url);
      }
    });
  });
};

// let jsconfig = async (req, res) => {
//   return res.json({ jsconfig: 1 });
// };

export { auth, oauth_response /*, jsconfig*/ };
