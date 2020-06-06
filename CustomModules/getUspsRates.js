/**
 * getUspsRates.js
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define(['N/record', 'N/https', 'N/xml', 'N/log', './xmlToJson'],
  function (record, https, xml, log, xmlToJson) {

    function getRates(context) {
      // PRIORITY CONTAINER TYPES:
      // Valid Containers are: FLAT RATE ENVELOPE, LEGAL FLAT RATE ENVELOPE, 
      // PADDED FLAT RATE ENVELOPE, SM FLAT RATE ENVELOPE, WINDOW FLAT RATE 
      // ENVELOPE, GIFT CARD FLAT RATE ENVELOPE, SM FLAT RATE BOX, MD FLAT 
      // RATE BOX, LG FLAT RATE BOX and VARIABLE.
      var method = 'PRIORITY';
      var zipDestination = '92843';
      var weightPounds = 1;
      var weightOunces = 0;
      var containerType = 'BOX';
      var width = 6;
      var length = 9;
      var height = 3;

      var uspsUser = '681SUAVE2769';
      var url = 'https://secure.shippingapis.com/shippingapi.dll?API=RateV4&XML='
        + '<RateV4Request USERID="' + uspsUser + '">'
        + '<Revision>2</Revision>'
        + '<Package ID="1ST">'
        + '<Service>' + method + '</Service>'
        + '<ZipOrigination>92703</ZipOrigination>'
        + '<ZipDestination>' + zipDestination + '</ZipDestination>'
        + '<Pounds>' + weightPounds +'</Pounds>'
        + '<Ounces>' + weightOunces + '</Ounces>'
        + '<Container>' + containerType + '</Container>'
        + '<Width>' + width + '</Width>'
        + '<Length>' + length + '</Length>'
        + '<Height>' + height + '</Height>'
        + '<Girth></Girth>'
        + '<Machinable>false</Machinable>'
        + '</Package>'
        + '</RateV4Request >';

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
          title: 'response', 
          details: response.body
        });

        var xmlDocument = xml.Parser.fromString({
          text: response.body
        });

        var jsonObj = xmlToJson.parseXML(xmlDocument.documentElement);
        var rate;
        
        if ('Error' in jsonObj.Package) {
          log.debug({
            title: 'Error!',
            details: jsonObj.Package.Error.Description['#text']
          });
        } else {
          rate = jsonObj.Package.Postage.Rate['#text'];

          log.debug({
            title: 'Package',
            details: rate
          });
        }

      } catch (e) {
        log.debug({
          title: 'ERROR!',
          details: e.message
        });
      }
    }

    return {
      getRates: getRates
    }
  });