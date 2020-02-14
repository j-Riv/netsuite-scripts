const dotenv = require('dotenv');
const fetch = require('node-fetch');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const jsBase64 = require('js-base64');
const path = require('path');
const fs = require('fs');
dotenv.config();

const createPickingTicketPDF = async () => {

  // let pickingTickets = [
  //   '113',
  //   '1295',
  //   '1297',
  //   '7128',
  //   '1771',
  //   '1788',
  //   '2407',
  //   '2408',
  //   '2423',
  //   '3429'
  // ];

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
    url: process.env.NETSUITE_GET_PICKING_TICKET_IDS_RESTLET_URL,
    method: 'GET'
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

  const authorization = oauth.authorize(requestData, token);
  const header = oauth.toHeader(authorization);
  header.Authorization += ', realm="' + accountID + '"';
  header['content-type'] = 'application/json';

  console.log('SETUP COMPLETE');
  console.log('READY TO PROCESS DATA');

  // get picking ticket ids
  const response = await fetch(requestData.url, {
    method: requestData.method,
    headers: header
  });

  const content = await response.json();

  if (response.ok) {
    const pickingTickets = content.results;
    console.log('Getting PDF(s) for the following ID(s):' + pickingTickets);

    (async function moveAlong() {
      // if we still have rows in the quie, let's process the next one.
      console.log('THERE ARE (' + pickingTickets.length + ') picking tickets.');
      if (pickingTickets.length) {
        console.log('++++++++ PROCESSING +++++++');
        let pickingTicketID = pickingTickets.shift();
        console.log('Picking Ticket ID')
        console.log(pickingTicketID);

        // data
        let data = {
          id: pickingTicketID
        }

        console.log('GETTING PICKING TICKET ID: (' + pickingTicketID + ')');

        const requestData = {
          url: process.env.NETSUITE_PRINT_PICKING_TICKET_RESTLET_URL,
          method: 'POST'
        }

        const authorization = oauth.authorize(requestData, token);
        const header = oauth.toHeader(authorization);
        header.Authorization += ', realm="' + accountID + '"';
        header['content-type'] = 'application/json';

        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: header,
          body: JSON.stringify(data)
        });

        const content = await response.json();
        console.log('RESPONSE ========>');
        // console.log(content);

        if (response.ok) {
          // const bin = Base64.atob(content.fileContent);
          const bin = jsBase64.Base64.atob(content.fileContent);

          // const pdfPath = path.join(__dirname, '/pdf/' + content.fileName + '.pdf');

          // fs.writeFile(pdfPath, bin, 'base64', error => {
          //   if (error) {
          //     throw error;
          //   } else {
          //     console.log('base64 saved!');
          //     console.log('RESPONSE OK, LETS MOVE ALONG!');
          //     console.log('+++++++++++++++++++++++++++++');
          //     console.log();
          //     console.log();
          //     moveAlong();
          //   }
          const pdfPath = path.join(__dirname, '/pdf/merged.pdf');

          fs.appendFileSync(pdfPath, bin, 'base64', error => {
            if (error) {
              throw error;
            } else {
              console.log('base64 saved!');
              console.log('RESPONSE OK, LETS MOVE ALONG!');
              console.log('+++++++++++++++++++++++++++++');
              console.log();
              console.log();
              moveAlong();
            }
          });
        } else {
          console.log('ERROR OCCURED, CHECK EMAIL OR SCRIPT LOG FOR DETAILS.');
        }
      }
    })();
  } 

}

createPickingTicketPDF();