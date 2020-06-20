/**
*
@NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 * @NModuleScope public
 *
*/
define(['N/record', 'N/log', './getUspsRates', './itemFulfillmentTotals'],
  function (record, log, getUspsRates, itemFulfillmentTotal) {

    // Shipping Methods - Production
    var shipMethods = {
      uspsFirstClass: { 
        id: '22000',
        name: 'FIRST CLASS COMMERCIAL',
        container: 'VARIABLE',
        weightMaxLB: 1,
        packaging: 14
      },
      uspsPriority: {
        id: '22001',
        name: 'PRIORITY COMMERCIAL',
        container: 'VARIABLE',
        weightMaxLB: 70,
        packaging: 14
      },
      uspsPriorityEnvelope: { 
        id: '31089',
        name: 'PRIORITY COMMERCIAL',
        container: 'FLAT RATE ENVELOPE',
        weightMaxLB: 70,
        packaging: 16
      },
      uspsPriorityLegalEnvelope: { 
        id: '31094',
        name: 'PRIORITY COMMERCIAL',
        container: 'LEGAL FLAT RATE ENVELOPE',
        weightMaxLB: 70,
        packaging: 25
      },
      uspsPriorityMdFlatRateBox: { 
        id: '31136',
        name: 'PRIORITY COMMERCIAL',
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
     * Does some cool shit.
     * @param {object} context 
     */
    function onAction(context) {
      var itemFulfill = context.newRecord;
      try {
        // Calculate total weight & item count
        log.debug({
          title: 'RUNNING CALCULATE TOTAL WEIGHT COUNT',
          details: 'Will calculate total weight and item count...'
        });
        // calculateTotalWeightCount(itemFulfill);
        itemFulfillmentTotal.calculate(itemFulfill);
        // Testing output
        var lines = itemFulfill.getLineCount({ sublistId: 'item' });
        log.debug({
          title: 'ITEM FULFILLMENT',
          details: 'There were ' + lines + ' lines in IT.'
        });
        for (var i = 0; i < lines; i++) {
          var quantity = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
          var itemName = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'itemname', line: i });
          log.debug({
            title: 'LINE ' + i,
            details: itemName + ' x ' + quantity
          });
        }

        // set package
        // which should call box selection algo
        // which should call setShipMethod
        setPackage(itemFulfill);

      } catch (e) {
        log.error({
          title: 'ON ACTION ERROR!',
          details: e.message
        });

        // do shit
        itemFulfill.setValue('shipstatus', 'B', true);

        log.debug({
          title: 'CATCH',
          details: itemFulfill.getValue('shipmethod') + ' | ' + itemFulfill.getValue('shipstatus')
        })

        log.debug({
          title: 'PACKAGE',
          details: itemFulfill.getSublists()
        });

        return itemFulfill.id;
      }
    }

    /**
     * Sets the package on the Item Fulfillment Record
     * @param {object} itemFulfill - The Item Fulfillment Record
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
        var boxDimensions = {
          width: 6,
          length: 9,
          height: 3
        };

        var weightPounds = shippingWeight;

        // Once box is set check ship country. If it is international, ship it manually.
        if (country == 'US') {
          // Validate Address
          var addressOk = getUspsRates.validateAddress(addr1, addr2, city, state, zip, country);

          if (addressOk) {
            log.debug({
              title: 'RUNNING GETUSPSRATES',
              details: 'Zip: ' + zip + ' | Weight (lbs): ' + weightPounds + ' | Box Dimensions: ' + boxDimensions
            });

            // Method will be selected taking account box size, box weight and customer
            // paid shipping cost
            // check if weight exceeds 1 lb 
            var i = 0;
            if (parseFloat(weightPounds) >= 1) {
              var i = 1;
            }
            log.debug({
              title: 'TOTAL WEIGHT | INDEX',
              details: weightPounds + ' | ' + i
            });
            var method = shipMethods[shipMethodNames[i]];
            var boxData = {
              carrierPackaging: shipMethods[shipMethodNames[i]].packaging,
              customBoxDimensions: boxDimensions
            }
            itemFulfill.setValue('custbody_sp_box_data', JSON.stringify(boxData));
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
     * @param {object} itemFulfill - Item Fulmillment Record
     * @param {object} method - Shipping Method
     * @param {decimal} shippingCost - Customer Paid Shipping Cost
     * @param {string} zip - Zip Code
     * @param {decimal} weightPounds - Package Weight in LBs
     * @param {object} boxDimensions - Box Dimensions
     * @param {integer} i - Current index
     */
    function setShipMethod(itemFulfill, method, shippingCost, zip, weightPounds, boxDimensions, i) {
      log.debug({
        title: 'RUNNING SET SHIP METHOD',
        details: 'Running setShipMethod'
      });
      try {
        var rate = getUspsRates.getRateByMethod(method.name, method.container, zip, weightPounds, boxDimensions);
        // var allRates = getUspsRates.getAllRates(zip, weightPounds, boxDimensions);
      } catch(e) {
        throw new Error(e.message);
      }
      // load record
      var createdFrom = itemFulfill.getValue('createdfrom');
      var salesOrder = loadRecord(createdFrom, 'SALES_ORDER');
      var subtotal = salesOrder.getValue('subtotal');
      log.debug({
        title: 'PAID SHIPPING COST | RATE | SUBTOTAL',
        details: shippingCost + ' | ' + rate + ' | ' + subtotal
      });
      // fails because md box is 13.20
      if (parseFloat(shippingCost) >= parseFloat(rate) || parseFloat(subtotal) >= 25.00) {
        try {
          itemFulfill.setValue('shipmethod', method.id);
        } catch (e) {
          log.debug({
            title: 'ERROR SETTING SHIP METHOD',
            details: JSON.stringify(e.message)
          });
          throw new Error(e.message);
        }
      } else {
        setShipMethod(itemFulfill, shipMethods[shipMethodNames[i + 1]], shippingCost, zip, weightPounds, boxDimensions, i + 1);
      }
    }

    /**
     * Loads a Record.
     * @param {string} id - The Record's Internal ID
     * @param {string} type - The Record's Type
     * @returns {object} - The Record
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