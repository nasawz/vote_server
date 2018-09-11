import * as qiniu from 'qiniu';
export default class QNAdapter {
  _access_key;
  _secret_key;
  _bucket;
  _domain;
  constructor(access_key, secret_key, bucket, domain) {
    this._access_key = access_key;
    this._secret_key = secret_key;
    this._bucket = bucket;
    this._domain = domain;
  }

  createFile = (filename: string, data, contentType: string) => {
    let mac = new qiniu.auth.digest.Mac(this._access_key, this._secret_key);
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: this._bucket
    });
    const uploadToken = putPolicy.uploadToken(mac);
    let config: any = new qiniu.conf.Config();
    config.zone = qiniu.zone.Zone_z0;
    let formUploader = new qiniu.form_up.FormUploader(config);
    let putExtra = new qiniu.form_up.PutExtra();

    return new Promise((resolve, reject) => {
      formUploader.put(uploadToken, filename, data, putExtra, function(
        respErr,
        respBody,
        respInfo
      ) {
        if (respErr) {
          // throw respErr;
          return reject(respErr);
        }
        if (respInfo.statusCode == 200) {
          resolve(respBody);
        } else {
          return reject(respBody);
        }
      });
    });
  };

  deleteFile(filename: string) {
    console.log('deleteFile', filename);
    var mac = new qiniu.auth.digest.Mac(this._access_key, this._secret_key);
    var config: any = new qiniu.conf.Config();
    config.zone = qiniu.zone.Zone_z0;
    var bucketManager = new qiniu.rs.BucketManager(mac, config);
    return new Promise((resolve, reject) => {
      bucketManager.delete(this._bucket, filename, function(err, respBody, respInfo) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log(respBody);
          resolve(respBody);
        }
      });
    });
  }

  getFileData(filename: string) {
    return null;
  }

  getFileLocation(config, filename: string) {
    var mac = new qiniu.auth.digest.Mac(this._access_key, this._secret_key);
    var config: any = new qiniu.conf.Config();
    config.zone = qiniu.zone.Zone_z0;
    var bucketManager = new qiniu.rs.BucketManager(mac, config);
    return `http://${bucketManager.publicDownloadUrl(this._domain, filename)}`;
  }
}
