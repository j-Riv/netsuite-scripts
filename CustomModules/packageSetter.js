/**
 * packageSetter.js
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define(['N/log'],
  function (log) {

    function setPackage(itemFulfill) {
      log.debug({
        title: 'SETTING PACKAGE',
        details: 'Running set package'
      });

      var boxData = itemFulfill.getValue('custbody_sp_box_data');
      boxData = JSON.parse(boxData);
      log.debug({
        title: 'BOX DATA',
        details: JSON.stringify(boxData)
      });

      if (typeof boxData == 'object') {
        try {
          itemFulfill.setValue('memo', 'Hello, from Package Selector CM!');
          var shipMethod = itemFulfill.getValue('shipmethod');
          var status = itemFulfill.getValue('shipstatus');

          // if status picked or packed
          if (status == 'A' || status == 'B') {
            // itemFulfill.setValue('shipstatus', 'C');
            // itemFulfill.setValue('generateintegratedshipperlabel', true);

            // Add a new line item to package sublist
            itemFulfill.selectLine({
              sublistId: 'packageusps',
              line: 0
            });
            itemFulfill.setCurrentSublistValue({
              sublistId: 'packageusps',
              fieldId: 'packagingusps',
              value: boxData.carrierPackaging
            });
            itemFulfill.setCurrentSublistValue({
              sublistId: 'packageusps',
              fieldId: 'packagewidthusps',
              value: boxData.customBoxDimensions.width
            });
            itemFulfill.setCurrentSublistValue({
              sublistId: 'packageusps',
              fieldId: 'packagelengthusps',
              value: boxData.customBoxDimensions.length
            });
            itemFulfill.setCurrentSublistValue({
              sublistId: 'packageusps',
              fieldId: 'packageheightusps',
              value: boxData.customBoxDimensions.height
            });
            // references
            // customer
            var customer = itemFulfill.getValue('entity');
            itemFulfill.setCurrentSublistValue({
              sublistId: 'packageusps',
              fieldId: 'reference1usps',
              value: customer
            });
            // sales order
            var salesOrder = itemFulfill.getValue('custbody_sp_order_number');
            itemFulfill.setCurrentSublistValue({
              sublistId: 'packageusps',
              fieldId: 'reference2usps',
              value: salesOrder
            });

            // Commit Line
            itemFulfill.commitLine({
              sublistId: 'packageusps'
            });

            log.debug({
              title: 'Sublists',
              details: itemFulfill.getSublists()
            });

            log.debug({
              title: 'Package List',
              details: itemFulfill.getSublist({
                sublistId: 'packageusps'
              })
            });

            // update trans date

            log.debug({
              title: 'Ship Status Changed',
              details: 'Please check record for appropriate values'
            });
          }

        } catch (e) {
          log.debug({
            title: 'ERROR!',
            details: e.message
          });
        }
      } else {
        // Set manual fulfillment required
        itemFulfill.setValue('custbody_sp_manual_fulfillment_req', true);
      }
    }

    return {
      setPackage: setPackage
    }
  });