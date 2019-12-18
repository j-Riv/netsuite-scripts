const dotenv = require('dotenv');
const fetch = require('node-fetch');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const pdf2base64 = require('pdf-to-base64');
const csv = require('csvtojson');
dotenv.config();

const createAttachFile = async () => {

  // csv to json
  const jsonArray = await csv().fromFile('./csv/sample-attachments.csv');
  console.log('READING CSV & CONVERTING TO JSON ARRAY');
  console.log(jsonArray);

  console.log('NETSUITE OAUTH SETUP');
  // netsuite production
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
  
  console.log('SETUP COMPLETE');
  console.log('READY TO PROCESS DATA');

  (async function moveAlong(){
    // if we still have rows in the quie, let's process the next one.
    console.log('THERE ARE (' + jsonArray.length + ') rows.');
    if (jsonArray.length) {
      console.log('++++++++ PROCESSING +++++++');
      let row = jsonArray.shift();
      console.log('ROW')
      console.log(row);
      console.log('CONVERTING: ' + row.fileName + ' TO BASE64.');
      pdf2base64('./attachments/' + row.fileName)
        .then(async pdfResponse => {
          console.log('BASE64 ENCODING SUCCESSFUL');
          // console.log(pdfResponse);
          // get name
          let fn = row.fileName.split('.pdf');

          // data
          let fileData = {
            recordtype: 'file',
            customerID: Number(row.ownerID),
            fileName: fn[0],
            fileContents: pdfResponse,
            fileDescription: 'This is a CA Resale Certificate'
          }

          console.log('POSTING (' + fn[0] + ') TO NETSUITE & ATTACHING TO USER ID (' + row.ownerID + ')');

          const authorization = oauth.authorize(requestData, token);
          const header = oauth.toHeader(authorization);
          header.Authorization += ', realm="' + accountID + '"';
          header['content-type'] = 'application/json';

          const response = await fetch(requestData.url, {
            method: requestData.method,
            headers: header,
            body: JSON.stringify(fileData)
          });

          const content = await response.json();
          console.log('RESPONSE ========>');
          console.log(content);
          
          if (response.ok) {
            console.log('RESPONSE OK, LETS MOVE ALONG!');
            console.log('+++++++++++++++++++++++++++++');
            console.log();
            console.log();
            moveAlong();
          } else {
            console.log('ERROR OCCURED, CHECK EMAIL OR SCRIPT LOG FOR DETAILS.');
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
  })();

}

createAttachFile();