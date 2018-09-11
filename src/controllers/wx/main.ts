import { Parse } from '../../parse';
import { auth, message } from 'node-weixin-api';
import axios from 'axios';
import * as _ from 'lodash';
axios.defaults.timeout = 6000;

let getConfig: any = activityId => {
  return new Promise(async (resolve, reject) => {
    const WXConfig = Parse.Object.extend('wx_config');
    const Activity = Parse.Object.extend('activity');
    const query = new Parse.Query(WXConfig);
    const a_query = new Parse.Query(Activity);
    a_query.equalTo('objectId', activityId);
    let activity = await a_query.first();
    query.equalTo('activity', activity);
    const results = await query.first();
    resolve(Object.assign({}, results.toJSON(), { domain: activity.toJSON().domain }));
  });
};

let getAccessTokenByCode: any = (code, appid, secret) => {
  return new Promise((resolve, reject) => {
    let url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`;
    axios
      .get(url)
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        reject(err);
      });
  });
};

let getUserFromWX: any = (access_token, openid) => {
  return new Promise((resolve, reject) => {
    let url = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
    axios
      .get(url)
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        reject(err);
      });
  });
};

let saveOrUpdateWxUser = async user => {
  user = Object.assign({}, user, { type: '1' });
  return new Promise(async (resolve, reject) => {
    const WXUser = Parse.Object.extend('wx_user');
    const query = new Parse.Query(WXUser);
    query.equalTo('openid', user.openid);
    const results = await query.first();
    if (results) {
      _.forIn(user, function(value, key) {
        results.set(`${key}`, value);
      });
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

let index = async (req, res) => {
  let callback = req.query.callback;
  if (!callback) {
    return res.boom.badRequest('miss callback');
  }
  let { activityId } = req.params;
  let { appid, secret, domain } = await getConfig(activityId);
  req.session.callback = decodeURIComponent(callback);
  req.session.save(function(err) {});
  let url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${encodeURIComponent(
    `${domain}/wx/oauth_response/${activityId}`
  )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`;
  return res.redirect(url);
};

let touch = async (req, res) => {
  let { user } = req.session;
  return res.json(user);
};

let oauth_response = async (req, res) => {
  let { code } = req.query;
  if (!code) {
    return res.boom.badRequest('miss code');
  }
  let { activityId } = req.params;
  let { appid, secret } = await getConfig(activityId);
  let { access_token, openid } = await getAccessTokenByCode(code, appid, secret);
  let wx_user = await getUserFromWX(access_token, openid);
  let u = await saveOrUpdateWxUser(wx_user);
  let { callback } = req.session;
  req.session.user = u;
  req.session.save(function(err) {});
  return res.redirect(callback);
};

let jsconfig = async (req, res) => {
  return res.json({ jsconfig: 1 });
};

export { index, touch, oauth_response, jsconfig };
