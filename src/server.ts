import { ParseServer } from 'parse-server';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

import wxRoute from './controllers/wx/route';
import qywxRoute from './controllers/qywx/route';
import voteRoute from './controllers/vote/route';

import QNAdapter from './QNAdapter';

import * as config from './config/config.json';

let app = express();

let api = new ParseServer(
  Object.assign(
    {
      cloud: path.join(path.dirname(fs.realpathSync(__filename)), './cloud/main.js'),
      filesAdapter: new QNAdapter(
        config.file.accessKey,
        config.file.secretKey,
        config.file.bucket,
        config.file.bucketDomain
      )
    },
    config.parse
  )
);

app.use('/parse', api);
wxRoute('/wx', app);
qywxRoute('/qywx', app);
voteRoute('/vote', app);

app.listen(1337, function() {
  console.log('server running on port 1337.');
});
