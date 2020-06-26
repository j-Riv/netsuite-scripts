/**
 * getUspsRates.js
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define(['N/record', 'N/https', 'N/xml', 'N/log', './xmlToJson'],
  function (record, https, xml, log, xmlToJson) {
    var uspsUser = '681SUAVE2769';

    /**
     * Validates the customer's address via USPS web services
     * @param {string} addr1 
     * @param {string} addr2 
     * @param {string} city 
     * @param {string} state 
     * @param {string} zip
     * @param {string} country
     */
    function validateAddress(addr1, addr2, city, state, zip, country) {

      log.debug({
        title: 'VALIDATING ADDRESS',
        details: addr1 + ' ' + addr2 + ' ' + city + ', ' + state + ' ' + zip + ', ' + country
      });

      var url = 'https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&XML='
        + '<AddressValidateRequest USERID="' + uspsUser +'">'
        + '<Address>'
        + '<Address1>' + addr1 + '</Address1>'
        + '<Address2>' + addr2 + '</Address2>' 
        + '<City>' + city + '</City>'
        + '<State>' + state + '</State>' 
        + '<Zip5>' + zip + '</Zip5>' 
        + '<Zip4></Zip4>'
        + '</Address>'
        + '</AddressValidateRequest>';

      try {
        var headersObj = {
          name: 'Content-Type',
          value: 'text/xml'
        };

        var response = https.get({
          url: url,
          headers: headersObj
        });

        log.debug({
          title: 'ADDRESS VALIDATION RESPONSE',
          details: response.body
        });

        var xmlDocument = xml.Parser.fromString({
          text: response.body
        });

        var jsonObj = xmlToJson._parse(xmlDocument.documentElement);

        if ('Error' in jsonObj.Address) {
          throw new Error(jsonObj.Address.Error.Description['#text']);
        } else {
          return true;
        }

      } catch (e) {
        log.error({
          title: 'ADDRESS VALIDATION ERROR!',
          details: e.message
        });
        throw new Error(e.message);
      }

    }

    /**
     * Gets USPS package Rates via USPS web services.
     * @param {string} method 
     * @param {string} containerType 
     * @param {string} zipDestination
     * @param {string} weightPounds 
     * @param {string} boxDimensions 
     */
    function getRateByMethod(method, containerType, zipDestination, weightPounds, boxDimensions) {
      // PRIORITY CONTAINER TYPES:
      // Valid Containers are: FLAT RATE ENVELOPE, LEGAL FLAT RATE ENVELOPE, 
      // PADDED FLAT RATE ENVELOPE, SM FLAT RATE ENVELOPE, WINDOW FLAT RATE 
      // ENVELOPE, GIFT CARD FLAT RATE ENVELOPE, SM FLAT RATE BOX, MD FLAT 
      // RATE BOX, LG FLAT RATE BOX and VARIABLE.
      // var method = 'PRIORITY';
      // var zipDestination = '92843';
      // var weightPounds = 1;
      var weightOunces = 0;
      // var containerType = 'BOX';
      // var width = 6;
      // var length = 9;
      // var height = 3;
      var url;
      if (method.service == 'PRIORITY COMMERCIAL') {
        url = 'https://secure.shippingapis.com/shippingapi.dll?API=RateV4&XML='
          + '<RateV4Request USERID="' + uspsUser + '">'
          + '<Revision>2</Revision>'
          + '<Package ID="1ST">'
          + '<Service>' + method + '</Service>'
          + '<ZipOrigination>92703</ZipOrigination>'
          + '<ZipDestination>' + zipDestination + '</ZipDestination>'
          + '<Pounds>' + weightPounds +'</Pounds>'
          + '<Ounces>' + weightOunces + '</Ounces>'
          + '<Container>' + containerType + '</Container>'
          + '<Width>' + boxDimensions.width + '</Width>'
          + '<Length>' + boxDimensions.length + '</Length>'
          + '<Height>' + boxDimensions.height + '</Height>'
          + '<Girth></Girth>'
          + '<Machinable>false</Machinable>'
          + '</Package>'
          + '</RateV4Request>';
      } else {
        url = 'https://secure.shippingapis.com/shippingapi.dll?API=RateV4&XML='
          + '<RateV4Request USERID="' + uspsUser + '">'
          + '<Revision>2</Revision>'
          + '<Package ID="1ST">'
          + '<Service>' + method + '</Service>'
          + '<FirstClassMailType>PARCEL</FirstClassMailType>'
          + '<ZipOrigination>92703</ZipOrigination>'
          + '<ZipDestination>' + zipDestination + '</ZipDestination>'
          + '<Pounds>' + weightPounds + '</Pounds>'
          + '<Ounces>' + weightOunces + '</Ounces>'
          + '<Container>' + containerType + '</Container>'
          + '<Width>' + boxDimensions.width + '</Width>'
          + '<Length>' + boxDimensions.length + '</Length>'
          + '<Height>' + boxDimensions.height + '</Height>'
          + '<Girth></Girth>'
          + '<Machinable>false</Machinable>'
          + '</Package>'
          + '</RateV4Request>';
      }

      try {
        var headersObj = {
          name: 'Content-Type',
          value: 'text/xml'
        };

        var response = https.get({
          url: url,
          headers: headersObj
        });

        log.debug({
          title: 'USPS GET RATE BY METHOD RESPONSE', 
          details: response.body
        });

        var xmlDocument = xml.Parser.fromString({
          text: response.body
        });

        var jsonObj = xmlToJson._parse(xmlDocument.documentElement);
        var rate;
        var mailService;
        
        if ('Error' in jsonObj.Package) {
          log.error({
            title: 'USPS GET RATE ERROR!',
            details: jsonObj.Package.Error.Description['#text']
          });
          throw new Error(jsonObj.Package.Error.Description['#text']);
        } else {
          rate = jsonObj.Package.Postage.CommercialRate['#text'];
          mailService = jsonObj.Package.Postage.MailService['#text'];

          log.debug({
            title: 'Package',
            details: rate + '|' + mailService
          });
        }

        return rate;

      } catch (e) {
        log.error({
          title: 'ERROR!',
          details: JSON.stringify(e.message)
        });
        throw new Error(JSON.stringify(e.message));
      }
    }

    function getAllRates(zipDestination, weightPounds, boxDimensions) {
      var weightOunces = 0;
      var containerType = '';
      var url = 'https://secure.shippingapis.com/shippingapi.dll?API=RateV4&XML='
        + '<RateV4Request USERID="' + uspsUser + '">'
        + '<Revision>2</Revision>'
        + '<Package ID="1ST">'
        + '<Service>Online</Service>'
        + '<ZipOrigination>92703</ZipOrigination>'
        + '<ZipDestination>' + zipDestination + '</ZipDestination>'
        + '<Pounds>' + weightPounds + '</Pounds>'
        + '<Ounces>' + weightOunces + '</Ounces>'
        + '<Container>' + containerType + '</Container>'
        + '<Width>' + boxDimensions.width + '</Width>'
        + '<Length>' + boxDimensions.length + '</Length>'
        + '<Height>' + boxDimensions.height + '</Height>'
        + '<Girth></Girth>'
        + '<Machinable>false</Machinable>'
        + '</Package>'
        + '</RateV4Request>';

      try {
        var headersObj = {
          name: 'Content-Type',
          value: 'text/xml'
        };

        var response = https.get({
          url: url,
          headers: headersObj
        });

        log.debug({
          title: 'USPS GET ALL RATES RESPONSE',
          details: response.body
        });

        var xmlDocument = xml.Parser.fromString({
          text: response.body
        });

        var jsonObj = xmlToJson._parse(xmlDocument.documentElement);
        var postage = [];
        jsonObj.Package.Postage.forEach(function(p){
          var rate;
          if ('Rate' in p) {
            rate = p.Rate['#text'];
          } else {
            rate = null;
          }
          var commercialRate;
          if ('CommercialRate' in p) {
            commercialRate = p.CommercialRate['#text'];
          } else {
            commercialRate = null;
          }
          postage.push({
            classID: p['@attributes'].CLASSID,
            mailService: p.MailService['#text'],
            rate: rate,
            commercialRate: commercialRate  
          });
        });

        log.debug({
          title: 'ALL RATES POSTAGE',
          details: JSON.stringify(postage)
        });

      } catch(e) {
        log.error({
          title: 'ERROR GETTING ALL USPS RATES!',
          details: JSON.stringify(e.message)
        });
        throw new Error(JSON.stringify(e.message));
      }

    }

    return {
      validateAddress: validateAddress,
      getRateByMethod: getRateByMethod,
      getAllRates: getAllRates
    }
  });