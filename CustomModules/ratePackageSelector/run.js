/**
 * setPackage.js
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/log', './usps/validateAddress', './setShipMethod', './testBox/selectBox'],
  function (log, uspsValidateAddress, setShipMethod, boxSelector) {

    // Shipping Methods - Production
    var shipMethods = {
      uspsFirstClass: {
        id: '22000',
        service: 'FIRST CLASS COMMERCIAL',
        container: 'VARIABLE',
        weightMaxLB: 1,
        packaging: 14
      },
      uspsPriority: {
        id: '22001',
        service: 'PRIORITY COMMERCIAL',
        container: 'VARIABLE',
        weightMaxLB: 70,
        packaging: 14
      },
      uspsPriorityEnvelope: {
        id: '31089',
        service: 'PRIORITY COMMERCIAL',
        container: 'FLAT RATE ENVELOPE',
        weightMaxLB: 70,
        packaging: 16
      },
      uspsPriorityLegalEnvelope: {
        id: '31094',
        service: 'PRIORITY COMMERCIAL',
        container: 'LEGAL FLAT RATE ENVELOPE',
        weightMaxLB: 70,
        packaging: 25
      },
      uspsPriorityMdFlatRateBox: {
        id: '31136',
        service: 'PRIORITY COMMERCIAL',
        container: 'MD FLAT RATE BOX',
        weightMaxLB: 70,
        packaging: 23
      }
    }
    var shipMethodNames = [
      'uspsFirstClass',
      'uspsPriority',
      'uspsPriorityEnvelope',
      'uspsPriorityLegalEnvelope',
      'uspsPriorityMdFlatRateBox'
    ];

    /**
     * Sets the package on the Item Fulfillment Record
     * @param {Object} itemFulfill - The Item Fulfillment Record
     */
    function main(itemFulfill) {
      log.debug({
        title: 'RUNNING SET PACKAGE',
        details: 'Running setPackage'
      });
      try {
        var tranId = itemFulfill.getValue('tranid');
        // Address
        var shippingAddress = itemFulfill.getSubrecord('shippingaddress');
        var addr1 = shippingAddress.getValue('addr1');
        var addr2 = shippingAddress.getValue('addr2');
        var city = shippingAddress.getValue('city');
        var state = shippingAddress.getValue('state');
        var country = shippingAddress.getValue('country');
        var zip = shippingAddress.getValue('zip');

        var shippingCost = itemFulfill.getValue('shippingcost');
        if (shippingCost == '') {
          shippingCost = 0;
        }
        var shippingWeight = itemFulfill.getValue('custbody_sp_total_items_weight');
        var totalItemCount = itemFulfill.getValue('custbody_sp_total_items');

        log.debug({
          title: 'SHIPPING COST, WEIGHT, ITEM COUNT, COUNTRY',
          details: shippingCost + '|' + shippingWeight + '|' + totalItemCount + ' | ' + country
        });

        // Calculate box algo will go around here
        var theBox = boxSelector._select(itemFulfill, 0);
        var boxNum = 1;
        while (!theBox) {
          theBox = boxSelector._select(itemFulfill, boxNum);
          boxNum++;
        }
        log.debug({
          title: 'THE FINAL BOX',
          details: JSON.stringify(theBox)
        });
        var boxDimensions = {
          name: theBox.name,
          width: Math.ceil(theBox.y),
          length: Math.ceil(theBox.x),
          height: Math.ceil(theBox.z)
        };

        var weightPounds = shippingWeight;

        // Once the box is set check the ship country. If it is international, ship it manually.
        if (country == 'US') {
          // Validate Address
          var addressOk = uspsValidateAddress._validate(addr1, addr2, city, state, zip, country);
          var marketShipMethod = selectShipMethod(itemFulfill);
          // If address is ok, continue
          if (addressOk && marketShipMethod != false) {
            log.debug({
              title: 'RUNNING GETUSPSRATES',
              details: 'Zip: ' + zip + ' | Weight (lbs): ' + weightPounds + ' | Box Dimensions: ' + boxDimensions
            });

            // Method will be selected taking account box size, box weight and customer
            // paid shipping cost
            // check if weight exceeds 1 lb 
            // This might change depending, this sets what ship method list index to start on
            // 0 = USPS First Class, 1 = USPS Priority
            var i = 0;
            if (parseFloat(weightPounds) >= 1 || marketShipMethod == 'uspsPriority') {
              var i = 1;
            }
            log.debug({
              title: 'TOTAL WEIGHT | INDEX',
              details: weightPounds + ' | ' + i
            });
            // Get ship method from method list
            // var method = shipMethods[shipMethodNames[i]];
            var method = shipMethods[shipMethodNames[i]];

            setShipMethod._set(itemFulfill, method, shippingCost, zip, weightPounds, boxDimensions, i);

          } else {
            log.error({
              title: 'ADDRESS IS UNACCEPTABLE',
              details: tranId + ' This order will have to be manually shipped'
            });
            itemFulfill.setValue('custbody_sp_manual_fulfillment_req', true);
          }
        } else {
          // Maybe? Set field for searching errored item fulfillments, for manual shipment
          log.debug({
            title: 'ITEM FULFILLMENT',
            details: tranId + ' This order will have to be manually shipped'
          });
          itemFulfill.setValue('custbody_sp_manual_fulfillment_req', true);
        }

      } catch (e) {
        log.error({
          title: 'SET PACKAGE ERROR!',
          details: e.message
        });
        itemFulfill.setValue('custbody_sp_manual_fulfillment_req', true);
        throw new Error(e.message);
      }
    }

    function selectShipMethod(itemFulfill) {
      var marketShipMethod = itemFulfill.getValue('custbody_sp_customer_ship_method');
      var shipMethod = false;
      if (marketShipMethod.indexOf('USPS First-Class') != -1) {
        shipMethod = 'uspsFirstClass';
      }
      if (marketShipMethod.indexOf('USPS Priority Mail') != -1) {
        shipMethod = 'uspsPriority';
      }
      return shipMethod;
    }

    return {
      _run: main
    }
  });