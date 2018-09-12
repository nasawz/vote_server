import { ParseServer } from 'parse-server';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as Boom from 'express-boom';
import * as Session from 'express-session';
import * as CookieParser from 'cookie-parser';
import * as BodyParser from 'body-parser';
import wxRoute from './controllers/wx/route';
import qywxRoute from './controllers/qywx/route';
import voteRoute from './controllers/vote/route';
import userRoute from './controllers/user/route';

import QNAdapter from './QNAdapter';

import * as config from './config/config.json';

let app = express();

const __basename = path.dirname(__dirname);
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
app.use(Boom());
app.use(CookieParser());
app.use(BodyParser.urlencoded({ extended: false }));
app.use(BodyParser.json());
app.set('trust proxy', 1);
app.use(
  Session({
    secret: 'skcjJdks'
  })
);
app.use('/api/parse', api);
app.use('/', express.static(path.resolve(__basename, 'static')));
wxRoute('/api/wx', app);
qywxRoute('/api/qywx', app);
voteRoute('/api/vote', app);
userRoute('/api/user', app);

app.listen(1337, function() {
  console.log('server running on port 1337.');
});
