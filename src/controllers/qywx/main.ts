import { Parse } from '../../parse';

let auth = async (req, res) => {
  const VoteItem = Parse.Object.extend('vote_item');
  const query = new Parse.Query(VoteItem);
  const results = await query.find();
  return res.json(results);
};

let touch = async (req, res) => {
  return res.json({ touch: 1 });
};

let oauth_response = async (req, res) => {
  return res.json({ oauth_response: 1 });
};

let jsconfig = async (req, res) => {
  return res.json({ jsconfig: 1 });
};

export { auth, touch, oauth_response, jsconfig };
