import { Parse } from '../../parse';

let touch = async (req, res) => {
  let { user } = req.session;
  if (user) {
    return res.json(user);
  } else {
    return res.boom.notFound('user not login');
  }
};

let fake = async (req, res) => {
  Parse.Config.get().then(
    async function(config) {
      let debug = config.get('debug');
      if (debug) {
        let { id } = req.query;
        const WXUser = Parse.Object.extend('wx_user');
        const query = new Parse.Query(WXUser);
        query.equalTo('objectId', id);
        const results = await query.first();
        let user = results.toJSON();
        req.session.user = user;
        req.session.save(function(err) {});
        return res.json(user);
      } else {
        res.boom.notFound();
      }
    },
    function(error) {
      res.boom.badRequest(error);
    }
  );
};

export { touch, fake };
