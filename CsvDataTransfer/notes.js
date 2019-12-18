const dotenv = require('dotenv');
const fetch = require('node-fetch');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const csv = require('csvtojson');
dotenv.config();

const createNote = async () => {

  // csv to json
  const jsonArray = await csv().fromFile('./csv/sample-notes.csv');
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
    url: process.env.NETSUITE_USER_NOTES_RESTLET_URL,
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

      // data
      let fileData = {
        recordtype: 'note',
        recordID: Number(row.ownerID),
        note: row.note,
        noteTitle: row.noteTitle,
        author: Number(row.author)
      }

      console.log('POSTING NOTE TO NETSUITE & ATTACHING TO USER ID (' + row.ownerID + ')');

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

    }
  })();

}

createNote();