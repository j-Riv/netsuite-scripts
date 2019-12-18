const dotenv = require('dotenv');
const fetch = require('node-fetch');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const pdf2base64 = require('pdf-to-base64');
dotenv.config();

const createAttachFile = () => {

  // production
  const accountID = process.env.NETSUITE_ACCT_ID;
  const token = {
    key: process.env.NETSUITE_ACCESS_TOKEN,
    secret: process.env.NETSUITE_TOKEN_SECRET
  }
  const consumer = {
    key: process.env.NETSUITE_CONSUMER_KEY,
    secret: process.env.NETSUITE_CONSUMER_SECRET
  }
  const requestData = {
    url: process.env.NETSUITE_USER_ATTACHMENTS_RESTLET_URL,
    method: 'POST'
  }
  const oauth = OAuth({
    consumer: consumer,
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto
        .createHmac('sha1', key)
        .update(base_string)
        .digest('base64');
    },
    realm: accountID
  });

  pdf2base64('.//30yqs4663c54ef9e6455abf6cfdbff339febf_california-resale-certificate-07-13-2016-Angels_Beauty_Salon_Suites.pdf')
    .then(response => {
      console.log('RESPONSE:');
      console.log(response);

      // data
      let fileData = {
        recordtype: 'file',
        customerID: 700,
        fileName: '30yqs4663c54ef9e6455abf6cfdbff339febf_california-resale-certificate-07-13-2016-Angels_Beauty_Salon_Suites',
        fileContents: response,
        fileDescription: 'This is a CA Resale Certificate'
      }

      console.log('POSTING TO NETSUITE');
      const authorization = oauth.authorize(requestData, token);
      const header = oauth.toHeader(authorization);
      header.Authorization += ', realm="' + accountID + '"';
      header['content-type'] = 'application/json';

      (async () => {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: header,
          body: JSON.stringify(fileData)
        });

        const content = await response.json();
        console.log('RESPONSE ========>');
        console.log(content);
      })();
    })
    .catch(error => {
      console.log(error);
    });

}

createAttachFile();