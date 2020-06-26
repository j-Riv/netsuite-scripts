/**
 * getRateByService.js
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/record', 'N/https', 'N/xml', 'N/log', './xmlToJson'],
  function (record, https, xml, log, xmlToJson) {
    var uspsUser = '681SUAVE2769';
    /**
     * Gets USPS package Rates via USPS web services.
     * @param {string} method 
     * @param {string} containerType 
     * @param {string} zipDestination
     * @param {string} weightPounds 
     * @param {string} boxDimensions 
     */
    function getRateByService(method, containerType, zipDestination, weightPounds, boxDimensions) {
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

    return {
      _get: getRateByService
    }
  });