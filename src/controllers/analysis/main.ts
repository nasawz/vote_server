import { Parse } from '../../parse';

let share = async (req, res) => {
  let data = req.body;
  let { userId, activityId, url, parentId } = data;
  if (userId == parentId) {
    parentId = null;
  }
  const WXUser = Parse.Object.extend('wx_user');
  const Activity = Parse.Object.extend('activity');
  let user = new WXUser();
  user.id = userId;
  let activity = new Activity();
  activity.id = activityId;
  let parent = null;
  if (parentId != null) {
    parent = new WXUser();
    parent.id = parentId;
  }
  const SA = Parse.Object.extend('share_analysis');
  const sa = new SA({
    user,
    activity,
    url,
    parent
  });
  sa.save()
    .then(result => {
      return res.json(result);
    })
    .catch(err => {
      return res.boom.badRequest();
    });
};

export { share };
