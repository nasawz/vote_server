import { Parse } from '../../parse';
import * as WechatAPI from 'wechat-api';
// import { auth, message } from 'node-weixin-api';
import axios from 'axios';
import * as _ from 'lodash';
axios.defaults.timeout = 60000;

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

let getApi: any = async function(appid, secret, callback) {
  let api = new WechatAPI(
    appid,
    secret,
    async cb => {
      const AT = Parse.Object.extend('access_token');
      const query = new Parse.Query(AT);
      query.equalTo('appid', appid);
      let value = await query.first();
      if (value) {
        // console.log(`[wx]获取token ${value.toJSON().token}`);
        cb(null, JSON.parse(value.toJSON().token));
      } else {
        cb(null, null);
      }
    },
    async (token, cb) => {
      cb(null, token);
      const AT = Parse.Object.extend('access_token');
      const query = new Parse.Query(AT);
      query.equalTo('appid', appid);
      let value = await query.first();
      if (value) {
        value.set('token', JSON.stringify(token));
        value
          .save()
          .then(res => {
            console.log(`[wx]更新token ${JSON.stringify(token)}`);
          })
          .catch(err => {
            console.log(`[wx]更新token ${JSON.stringify(err)}`);
          });
      } else {
        let at = new AT({
          appid,
          token: JSON.stringify(token)
        });
        at.save()
          .then(res => {
            console.log(`[wx]新建token ${JSON.stringify(token)}`);
          })
          .catch(err => {
            console.log(`[wx]新建token ${JSON.stringify(err)}`);
          });
      }
    }
  );

  api.registerTicketHandle(
    async (type, cb) => {
      const AT = Parse.Object.extend('api_ticket');
      const query = new Parse.Query(AT);
      query.equalTo('appid', appid);
      let value = await query.first();
      if (value) {
        // console.log(`[wx]获取ticket ${value.toJSON().ticket}`);
        cb(null, JSON.parse(value.toJSON().ticket));
      } else {
        cb(null, null);
      }
    },
    async (type, ticket, cb) => {
      cb(null, ticket);
      const AT = Parse.Object.extend('api_ticket');
      const query = new Parse.Query(AT);
      query.equalTo('appid', appid);
      let value = await query.first();
      if (value) {
        value.set('ticket', JSON.stringify(ticket));
        value
          .save()
          .then(res => {
            console.log(`[wx]更新ticket ${JSON.stringify(ticket)}`);
          })
          .catch(err => {
            console.log(`[wx]更新ticket ${JSON.stringify(err)}`);
          });
      } else {
        let at = new AT({
          appid,
          ticket: JSON.stringify(ticket)
        });
        at.save()
          .then(res => {
            console.log(`[wx]新建ticket ${JSON.stringify(ticket)}`);
          })
          .catch(err => {
            console.log(`[wx]新建ticket ${JSON.stringify(err)}`);
          });
      }
      cb(null);
    }
  );

  callback(null, api);
};

let getJsConfig = (api, param) => {
  return new Promise((resolve, reject) => {
    api.getJsConfig(param, (err, result) => {
      if (!err) {
        return resolve(result);
      }
      return reject(err);
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

let saveOrUpdateWxUser = async (user, parentId, activityId) => {
  user = Object.assign({}, user, { type: '1' });
  return new Promise(async (resolve, reject) => {
    const WXUser = Parse.Object.extend('wx_user');
    const Activity = Parse.Object.extend('activity');
    let activity = new Activity();
    activity.id = activityId;
    const query = new Parse.Query(WXUser);
    query.equalTo('openid', user.openid);
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
    `${domain}/api/wx/oauth_response/${activityId}`
  )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`;
  return res.redirect(url);
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

  let { callback } = req.session;
  let reg = /-p_(.*)-/gi;
  let _result = reg.exec(callback);
  let parentId = null;
  if (_result) {
    parentId = _result[1];
  }
  let u = await saveOrUpdateWxUser(wx_user, parentId, activityId);
  req.session.user = u;
  req.session.save(function(err) {});
  return res.redirect(callback);
};

let jsconfig = async (req, res) => {
  let { url } = req.body;
  if (!url) {
    return res.boom.badRequest('miss url');
  }
  let { activityId } = req.params;
  let { appid, secret } = await getConfig(activityId);
  getApi(appid, secret, async (err, api) => {
    let param = {
      debug: false,
      jsApiList: [
        'onMenuShareTimeline',
        'onMenuShareAppMessage',
        'onMenuShareQQ',
        'onMenuShareWeibo',
        'onMenuShareQZone',
        'startRecord',
        'stopRecord',
        'onVoiceRecordEnd',
        'playVoice',
        'pauseVoice',
        'stopVoice',
        'onVoicePlayEnd',
        'uploadVoice',
        'downloadVoice',
        'chooseImage',
        'previewImage',
        'uploadImage',
        'downloadImage',
        'translateVoice',
        'getNetworkType',
        'openLocation',
        'getLocation',
        'hideOptionMenu',
        'showOptionMenu',
        'hideMenuItems',
        'showMenuItems',
        'hideAllNonBaseMenuItem',
        'showAllNonBaseMenuItem',
        'closeWindow',
        'scanQRCode',
        'chooseWXPay',
        'openProductSpecificView',
        'addCard',
        'chooseCard',
        'openCard'
      ],
      url: url
    };
    try {
      let result = await getJsConfig(api, param);
      return res.json(result);
    } catch (error) {
      return res.boom.badRequest('get jsconfig fail');
    }
  });
};

export { index, oauth_response, jsconfig };
