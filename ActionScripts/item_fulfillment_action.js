/**
*
@NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @NModuleScope public
 *
*/
define(['N/log', './ratePackageSelector/main', './ratePackageSelector/orderTotals'],
  function (log, main, orderTotals) {

    /**
     * Does some cool shit.
     * @param {Object} context 
     */
    function onAction(context) {
      // Get item fulfillment record
      var itemFulfill = context.newRecord;
      try {
        // Calculate total order weight (lb) & item count
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
          // Log only fulfilled items
          if (quantity < 0) {
            log.debug({
              title: 'LINE ' + i,
              details: itemName + ' x ' + quantity
            });
          }
        }

        // Run main package selector func
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
          title: 'CATCH SHIP METHOD',
          details: 'Ship Method: ' + itemFulfill.getValue('shipmethod') + 
            ' | Ship Status:' + itemFulfill.getValue('shipstatus')
        })
        // Log package lists should contain the usps package sublist
        log.debug({
          title: 'LISTS',
          details: itemFulfill.getSublists()
        });

        return itemFulfill.id;
      }
    }

    return {
      onAction: onAction
    }
  });