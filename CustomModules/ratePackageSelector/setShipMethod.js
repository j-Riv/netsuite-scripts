/**
 * setShipMethod.js
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/record', 'N/log', './usps/getRateByService'],
  function (record, log, uspsGetRates) {

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
     * Sets the shipping method on the Item Fulfillment Record.
     * @param {Object} itemFulfill - Item Fulmillment Record
     * @param {Object} method - Shipping Method
     * @param {decimal} shippingCost - Customer Paid Shipping Cost
     * @param {string} zip - Zip Code
     * @param {decimal} weightPounds - Package Weight in LBs
     * @param {Object} boxDimensions - Box Dimensions
     * @param {integer} i - Current index
     */
    function setShipMethod(itemFulfill, method, shippingCost, zip, weightPounds, boxDimensions, i) {
      log.debug({
        title: 'RUNNING SET SHIP METHOD',
        details: 'Running setShipMethod'
      });
      try {
        var rate = parseFloat(uspsGetRates._get(method.service, method.container, zip, weightPounds, boxDimensions));
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
      _set: setShipMethod
    }
  });