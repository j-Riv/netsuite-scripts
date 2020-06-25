/**
*
@NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @NModuleScope public
 *
*/
define(['N/record', 'N/log', './getUspsRates', './itemFulfillmentTotals', './testBox'],
  function (record, log, getUspsRates, itemFulfillmentTotal, testBox) {

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

    /**
     * Does some cool shit.
     * @param {Object} context 
     */
    function onAction(context) {
      // Get item fulfillment record
      var itemFulfill = context.newRecord;
      try {
        // Calculate total weight & item count
        log.debug({
          title: 'RUNNING CALCULATE TOTAL WEIGHT COUNT',
          details: 'Will calculate total weight and item count...'
        });

        itemFulfillmentTotal.calculate(itemFulfill);

        // Testing output -- can delete this later
        var lines = itemFulfill.getLineCount({ sublistId: 'item' });
        log.debug({
          title: 'ITEM FULFILLMENT',
          details: 'There were ' + lines + ' lines in item fulfillment.'
        });
        for (var i = 0; i < lines; i++) {
          var quantity = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
          var itemName = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'itemname', line: i });
          log.debug({
            title: 'LINE ' + i,
            details: itemName + ' x ' + quantity
          });
        }
        // End of Testing output

        // Set package
        // Which should call box selection algo
        // Which should call setShipMethod
        setPackage(itemFulfill);

      } catch (e) {
        // Changing the ship method should cause an error
        // we catch the error, log it and continue.
        log.error({
          title: 'ON ACTION ERROR!',
          details: e.message
        });

        // Set ship status to 'Packed'
        itemFulfill.setValue('shipstatus', 'B', true);
        // Log ship method (should no longer be 'manual') + ship status.
        log.debug({
          title: 'CATCH',
          details: itemFulfill.getValue('shipmethod') + ' | ' + itemFulfill.getValue('shipstatus')
        })
        // Log package list should be usps
        log.debug({
          title: 'PACKAGE',
          details: itemFulfill.getSublists()
        });

        return itemFulfill.id;
      }
    }

    /**
     * Sets the package on the Item Fulfillment Record
     * @param {Object} itemFulfill - The Item Fulfillment Record
     */
    function setPackage(itemFulfill) {
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
        var theBox = testBox.selectBox(itemFulfill, 0);
        var boxNum = 1;
        while (!theBox) {
          theBox = testBox.selectBox(itemFulfill, boxNum);
          boxNum++;
        }
        log.debug({
          title: 'THE FINAL BOX',
          details: JSON.stringify(theBox)
        });
        var boxDimensions = {
          // width: 6,
          // length: 9,
          // height: 3
          name: theBox.name,
          width: Math.ceil(theBox.y),
          length: Math.ceil(theBox.x),
          height: Math.ceil(theBox.z)
        };

        var weightPounds = shippingWeight;

        // Once the box is set check the ship country. If it is international, ship it manually.
        if (country == 'US') {
          // Validate Address
          var addressOk = getUspsRates.validateAddress(addr1, addr2, city, state, zip, country);
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

            setShipMethod(itemFulfill, method, shippingCost, zip, weightPounds, boxDimensions, i);
            
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

    /**
     * Sets the shipping method on the Item Fulfillment Record.
     * @param {Object} itemFulfill - Item Fulmillment Record
     * @param {Object} method - Shipping Method
     * @param {decimal} shippingCost - Customer Paid Shipping Cost
     * @param {string} zip - Zip Code
     * @param {decimal} weightPounds - Package Weight in LBs
     * @param {Object} boxDimensions - Box Dimensions
     * @param {integer} i - Current index
     */
    // function setShipMethod(itemFulfill, method, shippingCost, zip, weightPounds, boxDimensions, i) {
    //   log.debug({
    //     title: 'RUNNING SET SHIP METHOD',
    //     details: 'Running setShipMethod'
    //   });
    //   try {
    //     var rate = getUspsRates.getRateByMethod(method.name, method.container, zip, weightPounds, boxDimensions);
    //     // var allRates = getUspsRates.getAllRates(zip, weightPounds, boxDimensions);
    //   } catch (e) {
    //     throw new Error(e.message);
    //   }
    //   // load record
    //   var createdFrom = itemFulfill.getValue('createdfrom');
    //   var salesOrder = loadRecord(createdFrom, 'SALES_ORDER');
    //   var subtotal = salesOrder.getValue('subtotal');
    //   log.debug({
    //     title: 'PAID SHIPPING COST | RATE | SUBTOTAL',
    //     details: shippingCost + ' | ' + rate + ' | ' + subtotal
    //   });
    //   // fails because md box is 13.20
    //   if (parseFloat(shippingCost) >= parseFloat(rate) || parseFloat(subtotal) >= 25.00) {
    //     try {
    //       itemFulfill.setValue('shipmethod', method.id);
    //     } catch (e) {
    //       log.debug({
    //         title: 'ERROR SETTING SHIP METHOD',
    //         details: JSON.stringify(e.message)
    //       });
    //       throw new Error(e.message);
    //     }
    //   } else {
    //     setShipMethod(itemFulfill, shipMethods[shipMethodNames[i + 1]], shippingCost, zip, weightPounds, boxDimensions, i + 1);
    //   }
    // }

    function setShipMethod(itemFulfill, method, shippingCost, zip, weightPounds, boxDimensions, i) {
      log.debug({
        title: 'RUNNING SET SHIP METHOD',
        details: 'Running setShipMethod'
      });    
      try {
        var rate = parseFloat(getUspsRates.getRateByMethod(method.service, method.container, zip, weightPounds, boxDimensions));
        // var allRates = getUspsRates.getAllRates(zip, weightPounds, boxDimensions);
      } catch (e) {
        throw new Error(e.message);
      }
      // check box dimensions
      // compare rate vs flat rate
      var flatRateEnvelopeCost = 7.15;
      var flatRateLegalEnvelopeCost = 7.45;
      var flatRateMdBoxCost = 13.20;
      shippingCost = parseFloat(shippingCost);
      // load record
      var createdFrom = itemFulfill.getValue('createdfrom');
      var salesOrder = loadRecord(createdFrom, 'SALES_ORDER');
      var subtotal = parseFloat(salesOrder.getValue('subtotal'));
      log.debug({
        title: 'PAID SHIPPING COST | RATE | SUBTOTAL',
        details: shippingCost + ' | ' + rate + ' | ' + subtotal
      });
      // fails because md box is 13.20
      // if customer paid shipping cost >= rate or if subtotal >= $25
      var sm = method.id;
      var pkg = method.packaging;
      if (rate <= flatRateEnvelopeCost && boxDimensions.name == 'Membership') {
        // set flat rate ship method
        sm = method.id;
        pkg = method.packaging;
      } else if (rate >= flatRateEnvelopeCost && boxDimensions.name == 'Membership') {
        sm = shipMethods['uspsPriorityEnvelope'].id;
        pkg = shipMethods['uspsPriorityEnvelope'].packaging;
      } else if (rate >= flatRateEnvelopeCost && boxDimensions.name == 'Membership Large') {
        sm = shipMethods['uspsPriorityLegalEnvelope'].id;
        pkg = shipMethods['uspsPriorityLegalEnvelope'].packaging;
      }

      // Set box data
      // Set custom box dimensions if not using flat rate
      // add flat rate dimensions
      var boxData = {
        carrierPackaging: pkg,
        customBoxDimensions: boxDimensions
      }
      itemFulfill.setValue('custbody_sp_box_data', JSON.stringify(boxData));

      try {
        itemFulfill.setValue('shipmethod', sm);
      } catch (e) {
        log.debug({
          title: 'ERROR SETTING SHIP METHOD',
          details: JSON.stringify(e.message)
        });
        throw new Error(e.message);
      }
    }

    /**
     * Loads a Record.
     * @param {string} id - The Record's Internal ID
     * @param {string} type - The Record's Type
     * @returns {Object} - The Record
     */
    function loadRecord(id, type) {
      var objRecord = record.load({
        type: record.Type[type],
        id: id,
        isDynamic: true
      });

      return objRecord;
    }

    return {
      onAction: onAction
    }
  });