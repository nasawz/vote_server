Parse.Cloud.define('hello', async request => {
  console.log(request);
  return { a: 'b' };
});
