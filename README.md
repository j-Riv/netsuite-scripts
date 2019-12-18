# NETSUITE
> SuiteScript 2.0

Future home for SuiteScripts & RESTlets

### Contents:
- [SuiteScripts](/SuiteScripts)
- [RESTlets](/RESTlets)
- [Sample Responses](/SampleResponses)
- [CSV Data Transfer - Used for Migration from Zoho](/CsvDataTransfer)

### Documentation:
- [RESTlets](https://5657911.app.netsuite.com/app/help/helpcenter.nl?fid=chapter_N2970114.html)
- [SuiteScript](https://5657911.app.netsuite.com/app/help/helpcenter.nl?fid=set_1502135122.html)
- [SuiteScript 2.0](https://5657911.app.netsuite.com/app/help/helpcenter.nl?topic=DOC_SS2_API)
- [Supported Records](https://5657911.app.netsuite.com/app/help/helpcenter.nl?fid=preface_3710625923.html)
- [Records Browser](https://5657911.app.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2019_1/script/record/lead.html)

## Token Based Authentication (TBA)
> Setting up Token-Based Authentication for a RESTlet

I. Acquiring the Consumer Key and Consumer Secret
   1. Go to `Setup > Integrations > Manage Integrations > New`. Fill out the form.
   2. Enable Token-Based Authentication
   3. You will receive the following <i>message</i>, along with the <i>Consumer Key</i> and <i>Consumer Secret</i>. Save it somewhere secure.
   ```
   Warning: For security reasons, this is the only time that the Consumer Key and Consumer Secret values are displayed.
   After you leave this page, they cannot be retrieved from the system. If you lose or forget these credentials, you
   will need to reset them to obtain new values.
   
   Treat the values for Consumer Key and Consumer Secret as you would a password. Never share these credentials
   with unauthorized individuals and never send them by email.
   ```
II. Acquiring the Token ID and Token Secret
   1. If your role is granted with User Access Token permission (If your reading this you should have Admin privileges), you should be able to see `Manage Access Tokens` inside the settings portlet.
   2. Click on `New My Access Token`
   3. Select an Application Name and enter your preferred Token Name.
   4. Click `Save`
   5. You will receive the following <i>message</i>, along with the <i>Token ID</i> and <i>Token Secret</i>. Save it somewhere secure.
   ```
   Warning: For security reasons, this is the only time that the Token ID and Token Secret values are displayed. After
   you leave this page, they cannot be retrieved from the system. If you lose or forget these credentials, you will need
   to reset them to obtain new values.

   Treat the values for Token ID and Token Secret as you would a password. Never share these credentials with
   unauthorized individuals and never send them by email.
   ```
III. Testing with Postman
   1. Select the appropriate request method (ex: GET, POST, PUT, DELETE).
   2. Enter the URL you can grab it from the deployment record / integration record.
   3. Click on Authorization.
   4. Select OAuth 1.0
   5. Enter the following Parameters:
        - Consumer Key (from Section I, Step 3)
        - Consumer Secret (from Section I, Step 3)
        - Access Token (from Section II, Step 6)
        - Token Secret (from Section II, Step 6)
   6. Enter the NetSutie Account ID under `Advanced > Realm`.
   7. Test

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