/**
*
@NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 * @NModuleScope public
 *
*/
define(['N/record', 'N/log'],
  function (record, log) {

    // Shipping Methods - Production
    var fedEx2Day = '30611';
    var uspsPriority = '22001';
    var uspsFirstClass = '22000';
    var uspsPriorityEnvelope = '31089';
    var uspsPriorityLegalEnvelope = '31094';
    var uspsPriorityMdFlatRateBox = '31136';

    function testing(context) {
      var itemFulfill = context.newRecord;

      try {
        var shipMethod = itemFulfill.getValue('shipmethod');
        var status = itemFulfill.getValue('shipstatus');
        log.debug({
          title: 'Ship Method & Status',
          details: shipMethod + ' | ' + status
        });

        // if status picked or packed
        if (status == 'A' || status == 'B') {
          // itemFulfill.setValue('shipstatus', 'C');
          // itemFulfill.setValue('generateintegratedshipperlabel', true);

          // Add a new line item to package sublist
          itemFulfill.selectLine({ sublistId: 'packageusps', line: 0 });
          itemFulfill.setCurrentSublistValue({ sublistId: 'packageusps', fieldId: 'packagingusps', value: 23 });
          itemFulfill.setCurrentSublistValue({ sublistId: 'packageusps', fieldId: 'packagewidthusps', value: '8' });
          itemFulfill.setCurrentSublistValue({ sublistId: 'packageusps', fieldId: 'packagelengthusps', value: '11' });
          itemFulfill.setCurrentSublistValue({ sublistId: 'packageusps', fieldId: 'packageheightusps', value: '6' });
          // references
          // customer
          var customer = itemFulfill.getValue('entity');
          itemFulfill.setCurrentSublistValue({ sublistId: 'packageusps', fieldId: 'reference1usps', value: customer });
          // sales order
          var salesOrder = itemFulfill.getValue('custbody_sp_order_number');
          itemFulfill.setCurrentSublistValue({ sublistId: 'packageusps', fieldId: 'reference2usps', value: salesOrder });

          // Commit Line
          itemFulfill.commitLine({ sublistId: 'packageusps' });

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
            details: 'Ship status has been changed to USPS Priority and Packaging has been set to Medium Flat Rate Box, please save and print label.'
          });
        }

        return itemFulfill.getSublists();

      } catch (e) {
        log.debug({
          title: 'ERROR!',
          details: e.message
        });

        return false;
      }
    }

    return {
      onAction: testing
    }
  });