const dotenv = require('dotenv');
const fetch = require('node-fetch');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const hummus = require('hummus');
const memoryStreams = require('memory-streams');

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
  const requestData = {
    url: process.env.NETSUITE_GET_PICKING_TICKET_IDS_RESTLET_URL,
    method: 'GET'
  }
  const authorization = oauth.authorize(requestData, token);
  const header = oauth.toHeader(authorization);
  header.Authorization += ', realm="' + accountID + '"';
  header['content-type'] = 'application/json';
  // get picking ticket ids
  try {
    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: header
    });

    const content = await response.json();

    // if response ok
    if (response.ok) {
      const pickingTickets = content.results;
      console.log('GETTING PDF(s) FOR THE FOLLOWING ID(s):' + pickingTickets);

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

    try {
      const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: header,
        body: JSON.stringify(data)
      });

      const content = await response.json();

      if (response.ok) {
        console.log('RECEIVED PDF FROM NETSUITE APPENDING TO LIST.');
        buffers.push(content.fileBuffer);
        getPDFs(oauth, token, accountID, pickingTickets, buffers);
      } else {
        console.log('ERROR OCCURED, CHECK EMAIL OR SCRIPT LOG FOR DETAILS.');
      }
    } catch (e) {
      throw new Error('ERROR GETTING PICKING TICKET: ' + e.message);
    }
  } else {
    console.log('MERGING FILES ...');
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
    const pdfPath = path.join(__dirname, '/pdf/' + 'PICKING-TICKETS_' + dateTime + '.pdf');

    fs.writeFile(pdfPath, newBuffer, error => {
      if (error) {
        throw error;
      } else {
        console.log('FILES MERGED!');
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
    throw new Error('ERROR DURING PDF COMBINATION: ' + e.message);
  }
};

main();