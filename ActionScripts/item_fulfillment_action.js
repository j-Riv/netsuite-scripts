/**
*
@NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @NModuleScope public
 *
*/
define(['N/record', 'N/log', './ratePackageSelector/run', './ratePackageSelector/orderTotals'],
  function (record, log, main, orderTotals) {

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

        orderTotals._calc(itemFulfill);

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
        main._run(itemFulfill);

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

    return {
      onAction: onAction
    }
  });