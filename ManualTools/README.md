# Manual Tools
> Manual tools created to import data into NetSuite. Uses CSV's to map data / files to appropriate records in NetSuite.

## Dependencies
- Node
- Yarn

## Config
> Project expects a `.env` file with the following:
```javascript
// Netsuite Production
NETSUITE_ACCT_ID="NETSUITE SPRODUCTION ACCT ID"
NETSUITE_CONSUMER_KEY="NETSUITE PRODUCTION CONSUMER KEY" // Generated at Integration Record creation
NETSUITE_CONSUMER_SECRET="NETSUITE PRODUCTION CONSUMER SECRET" // Generated at Integration Record creation
NETSUITE_ACCESS_TOKEN="NETSUITE PRODUCTION ACCESS TOKEN" // User specific access token
NETSUITE_TOKEN_SECRET="NETSUITE PRODUCTION TOKEN SECRET" // User specific token secret
// URLs
NETSUITE_USER_NOTES_RESTLET_URL="NETSUITE PRODUCTION RESTLET URL" // Callback RESTlet URL
NETSUITE_USER_ATTACHMENTS_RESTLET_URL="NETSUITE PRODUCTION RESTLET URL" // Callback RESTlet URL
NETSUITE_GET_PICKING_TICKET_IDS_RESTLET_URL="NETSUITE PRODUCTION RESTLET URL" // Callback RESTlet URL
NETSUITE_PRINT_PICKING_TICKET_RESTLET_URL="NETSUITE PRODUCTION RESTLET URL" // Callback RESTlet URL
```

## Setup
```bash
yarn install
```