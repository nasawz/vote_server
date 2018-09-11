import { Parse } from '../../parse';

let addVote = async (req, res) => {
  return res.json({ addVote: '1' });
};
let addVoteItem = async (req, res) => {
  return res.json({ addVoteItem: '1' });
};
let delVoteItem = async (req, res) => {
  return res.json({ delVote: '1' });
};
export { addVote, delVoteItem, addVoteItem };
