import 'babel-polyfill';
// import regeneratorRuntime from "regenerator-runtime";
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import hummus from 'hummus';
import memoryStreams from 'memory-streams';

dotenv.config();

/**
 * Sets up Oauth 1.0 and calls getPickingTicketIDs and getPDFs
 */
const main = async () => {

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

  const pickingTickets = await getPickingTicketIDs(oauth, token, accountID);
  let buffers = [];
  getPDFs(oauth, token, accountID, pickingTickets, buffers);
}

/**
 * Gets picking ticket id(s) from NetSuite RESTLet using a saved search.
 * @param {String} oauth - oauth signature
 * @param {String} token - netsuite user token
 * @param {String} accountID - netsuite id
 * @returns {String[]} - array of ids
 */
const getPickingTicketIDs = async (oauth, token, accountID) => {
  // get args
  const args = process.argv.slice(2);
  let getPrinted;
  if (args[0] === '-np') {
    getPrinted = false;
    console.log('GETTING ID(s) FOR SALES ORDER(s) THAT ARE OPEN AND PRINTING TICKETS HAVE NOT BEEN PRINTED.');
  } else {
    console.log('GETTING ID(s) FOR ALL OPEN SALES ORDER(s).');
  }

  let marketplace;
  if (args[1] === '-rs') {
    marketplace = 'shopify';
  }
  if (args[1] === '-ws') {
    marketplace = 'shopify-wholesaleshopify';
  }
  if (args[1] === '-amz') {
    marketplace = 'amazon';
  }
  if (args[1] === '-eb') {
    marketplace = 'ebay';
  }

  const searchData = {
    getPrinted,
    marketplace
  }

  const requestData = {
    url: process.env.NETSUITE_GET_PICKING_TICKET_IDS_RESTLET_URL,
    method: 'POST'
  }
  const authorization = oauth.authorize(requestData, token);
  const header = oauth.toHeader(authorization);
  header.Authorization += ', realm="' + accountID + '"';
  header['content-type'] = 'application/json';
  // get picking ticket ids
  try {
    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: header,
      body: JSON.stringify(searchData)
    });

    const content = await response.json();

    // if response ok
    if (response.ok) {
      const pickingTickets = content.results;
      console.log('ID(s):' + '\n\n' + pickingTickets);

      return pickingTickets;    
    }
  } catch (e) {
    throw new Error('ERROR GETTING PICKING TICKET ID(s): ' + e.message);
  }
}

/**
 * Gets pdf data from NetSuite RESTLet.
 * @param {String} oauth - oauth signature
 * @param {String} token - netsuite user token
 * @param {String} accountID - netsuite account id
 * @param {String[]} pickingTickets -
 * @param {Buffer[]} buffers
 */
const getPDFs = async(oauth, token, accountID, pickingTickets, buffers) => {
  // if we still have rows in the quie, let's process the next one.
  console.log('\n\n' + 'THERE ARE (' + pickingTickets.length + ') PICKING TICKETS.');
  if (pickingTickets.length) {
    console.log('\n\n' + '++++++++ PROCESSING +++++++');
    let pickingTicketID = pickingTickets.shift();

    // data
    let data = {
      id: pickingTicketID
    }

    console.log('🤔 ---> GETTING PICKING TICKET ID: (' + pickingTicketID + ')');

    const requestData = {
      url: process.env.NETSUITE_PRINT_PICKING_TICKET_RESTLET_URL,
      method: 'POST'
    }
    const authorization = oauth.authorize(requestData, token);
    const header = oauth.toHeader(authorization);
    header.Authorization += ', realm="' + accountID + '"';
    header['content-type'] = 'application/json';

    try {
      const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: header,
        body: JSON.stringify(data)
      });

      const content = await response.json();

      if (response.ok) {
        console.log('\n\n' + '📂 ---> RECEIVED PDF FROM NETSUITE APPENDING TO LIST.');
        buffers.push(content.fileBuffer);
        getPDFs(oauth, token, accountID, pickingTickets, buffers);
      } else {
        console.log('\n\n' + 'ERROR OCCURED, CHECK EMAIL OR SCRIPT LOG FOR DETAILS.');
      }
    } catch (e) {
      throw new Error('\n\n' + 'ERROR GETTING PICKING TICKET: ' + e.message);
    }
  } else {
    console.log('\n\n' + 'MERGING FILES ...');
    console.log(buffers.length);

    // get date & time to use for name
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();
    const dateTime = year + '-' + month + '-' + day + 'T' + hour + '-' + min + '-' + sec;
    // merge pdf(s)
    const newBuffer = await mergePDFs(buffers);
    const pdfPath = path.join(__dirname, '../public/pdf/' + 'PICKING-TICKETS_' + dateTime + '.pdf');

    fs.writeFile(pdfPath, newBuffer, error => {
      if (error) {
        throw error;
      } else {
        console.log('\n\n' + 'FILES MERGED!');
      }
    });
  }
};

/**
 * Merges the PDF(s) into 1 PDF so it can be printed easier.
 * @param {Buffer[]} buffers
 * @return {Buffer} - the buffer to be saved to file 
 */
const mergePDFs = async buffers => {
  const outStream = new memoryStreams.WritableStream();

  try {
    var [firstPDFStream, ...restPDFStreams] = buffers.map(buffer => {
      let bufferPDF = Buffer.from(buffer, 'base64');
      return new hummus.PDFRStreamForBuffer(bufferPDF);
    });
    console.log(restPDFStreams.length);
    const pdfWriter = hummus.createWriterToModify(firstPDFStream, new hummus.PDFStreamForResponse(outStream));
    restPDFStreams.forEach(PDFStream => pdfWriter.appendPDFPagesFromPDF(PDFStream));

    pdfWriter.end();
    outStream.end();
    return outStream.toBuffer();
  } catch (e) {
    outStream.end();
    throw new Error('\n\n' + 'ERROR DURING PDF COMBINATION: ' + e.message);
  }
};

main();