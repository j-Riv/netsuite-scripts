const dotenv = require('dotenv');
const fetch = require('node-fetch');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const csv = require('csvtojson');
const path = require('path');
dotenv.config();

const createSalesOrder = async () => {

  // csv to json
  const jsonArray = await csv().fromFile(path.join(__dirname, '../public/csv/test-orders.csv'));
  console.log('READING CSV & CONVERTING TO JSON ARRAY');
  console.log(jsonArray[0]);

  const salesOrders = await fixSalesOrders(jsonArray);

  console.log('This is it');
  console.log(salesOrders);

  // console.log('NETSUITE OAUTH SETUP');
  // // netsuite production
  // const accountID = process.env.NETSUITE_ACCT_ID;
  // const token = {
  //   key: process.env.NETSUITE_ACCESS_TOKEN,
  //   secret: process.env.NETSUITE_TOKEN_SECRET
  // }
  // const consumer = {
  //   key: process.env.NETSUITE_CONSUMER_KEY,
  //   secret: process.env.NETSUITE_CONSUMER_SECRET
  // }
  // const requestData = {
  //   url: process.env.NETSUITE_USER_NOTES_RESTLET_URL,
  //   method: 'POST'
  // }
  // const oauth = OAuth({
  //   consumer: consumer,
  //   signature_method: 'HMAC-SHA1',
  //   hash_function(base_string, key) {
  //     return crypto
  //       .createHmac('sha1', key)
  //       .update(base_string)
  //       .digest('base64');
  //   },
  //   realm: accountID
  // });
  
  // console.log('SETUP COMPLETE');
  // console.log('READY TO PROCESS DATA');

  // (async function moveAlong(){
  //   // if we still have rows in the quie, let's process the next one.
  //   console.log('THERE ARE (' + jsonArray.length + ') rows.');
  //   if (jsonArray.length) {
  //     console.log('++++++++ PROCESSING +++++++');
  //     let row = jsonArray.shift();
  //     console.log('ROW')
  //     console.log(row);

  //     const authorization = oauth.authorize(requestData, token);
  //     const header = oauth.toHeader(authorization);
  //     header.Authorization += ', realm="' + accountID + '"';
  //     header['content-type'] = 'application/json';

  //     const response = await fetch(requestData.url, {
  //       method: requestData.method,
  //       headers: header,
  //       body: JSON.stringify(salesOrder)
  //     });

  //     const content = await response.json();
  //     console.log('RESPONSE ========>');
  //     console.log(content);

  //     if (response.ok) {
  //       console.log('RESPONSE OK, LETS MOVE ALONG!');
  //       console.log('+++++++++++++++++++++++++++++');
  //       console.log();
  //       console.log();
  //       moveAlong();
  //     } else {
  //       console.log('ERROR OCCURED, CHECK EMAIL OR SCRIPT LOG FOR DETAILS.');
  //     }

  //   }
  // })();

}

const fixSalesOrders = jsonArray => {
  // process jsonArray
  let salesData = [];
  let order;
  let orderNumber = '';
  jsonArray.forEach(row => {
    if (row.name === orderNumber) {
      salesData[salesData.length - 1]
        .items.push({
          sku: row.sku,
          qty: row.quantity,
          price: row.price
        });
    } else {
      orderNumber = row.name;
      order = {
        name: row.name,
        items: [
          {
            sku: row.sku,
            qty: row.quantity,
            price: row.price
          }
        ],
        email: row.email,
        shippingMethod: row.shippingMethod,
        location: 1
      }
      salesData.push(order);
    }
  });

  // console.log(salesData);
  return salesData;
}

createSalesOrder();