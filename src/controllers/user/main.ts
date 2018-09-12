let touch = async (req, res) => {
  let { user } = req.session;
  if (user) {
    return res.json(user);
  } else {
    return res.boom.notFound('user not login');
  }
};

export { touch };
