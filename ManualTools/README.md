# NetSuite Data Transfer
> Uses CSV's to map data / files to appropriate records in NetSuite.

## Dependencies
- Node
- Yarn

## Setup
```bash
yarn install
```

## Config
> Project expects a `.env` file in the root directory with the following:
```javascript
// Netsuite Production
NETSUITE_ACCT_ID="NETSUITE SPRODUCTION ACCT ID"
NETSUITE_USER_NOTES_RESTLET_URL="NETSUITE PRODUCTION RESTLET URL" // Callback RESTlet URL
NETSUITE_USER_ATTACHMENTS_RESTLET_URL="NETSUITE PRODUCTION RESTLET URL" // Callback RESTlet URL
NETSUITE_CONSUMER_KEY="NETSUITE PRODUCTION CONSUMER KEY" // Generated at Integration Record creation
NETSUITE_CONSUMER_SECRET="NETSUITE PRODUCTION CONSUMER SECRET" // Generated at Integration Record creation
NETSUITE_ACCESS_TOKEN="NETSUITE PRODUCTION ACCESS TOKEN" // User specific access token
NETSUITE_TOKEN_SECRET="NETSUITE PRODUCTION TOKEN SECRET" // User specific token secret
```

Resources:
- [NetSuite RESTlet Web Service](https://community.boomi.com/s/article/howtocallanetsuiterestletwebservice)
- [NetSuite Token-based Authenication](https://medium.com/@morrisdev/netsuite-token-based-authentication-tba-342c7df56386)
- [Postman Setup](https://leacc.com.ph/2019/07/02/using-postman-to-test-your-first-netsuite-restlet/)
- [NetSuite RESTlet](https://community.boomi.com/s/article/howtocallanetsuiterestletwebservice)
> NetSuite
- [N/record Module](https://5657911.app.netsuite.com/app/help/helpcenter.nl?fid=section_4267255811.html)
  - [record.Type](https://5657911.app.netsuite.com/app/help/helpcenter.nl?fid=section_4273205732.html)
  - [record.create](https://5657911.app.netsuite.com/app/help/helpcenter.nl?fid=section_4267258059.html)
  - [record.attach](https://5657911.app.netsuite.com/app/help/helpcenter.nl?fid=section_4267284169.html)
- [N/file Module](https://5657911.app.netsuite.com/app/help/helpcenter.nl?fid=section_4205693274.html)
