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

    /**
     * Do shit
     * @param {object} context 
     */
    function calculateTotalWeightCount(itemFulfill) {
      try {
        // get record
        // var itemFulfill = context.newRecord;
        // get line count
        var lines = itemFulfill.getLineCount({ sublistId: 'item' });
        var totalWeight = 0;
        var totalItems = 0;

        for (var i = 0; i < lines; i++) {
          log.debug({
            details: 'Checking Items'
          });
          var itemType = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_type', line: i });
          if (itemType != 'Kit/Package') {
            // get weight unit (lb, oz, kg, g)
            var quantity = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
            var weight = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_weight', line: i });

            // check if line item has quantity
            // custom line items like discount and subtotal should not -- these will be skipped
            // if (quantity && weight) {
            var unit = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_weight_units', line: i });
            log.debug({
              title: 'Conversion',
              details: 'converting ' + unit + ' to lb... with qty: ' + quantity
            });
            if (unit === 'oz') {
              // convert oz to lbs
              weight = weight * 0.0625;
            } else if (unit === 'kg') {
              // convert oz to kg
              weight = weight * 2.20462;
            } else if (unit === 'g') {
              // convert oz to g
              weight = weight * 0.00220462;
            } else {
              weight = weight * 1;
            }

            // set line weight
            log.debug({
              details: 'Setting converted weight'
            });
            var convertedWeight = round(weight, 3);
            var currentLine = itemFulfill.selectLine({ sublistId: 'item', line: i });
            currentLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_converted_item_weight', value: convertedWeight, ignoreFieldChange: false });
            itemFulfill.commitLine({ sublistId: 'item' });

            // calculate total item count
            totalItems = parseInt(totalItems) + parseInt(quantity);
            // calculate line weight
            var lineWeight = weight * quantity;
            // calculate total weight
            totalWeight = parseFloat(totalWeight) + parseFloat(lineWeight);

            log.debug({
              title: 'Total Weight for item ' + i,
              details: totalWeight + ' lb.'
            });
            // }
          } else {
            log.debug({
              title: 'Item is of type kit/package',
              details: 'Excluding from count since components are listed at line item.'
            });
          }
        }
        // set total weight
        totalWeight = round(totalWeight, 2);
        // set fields
        itemFulfill.setValue({ fieldId: 'custbody_sp_total_items_weight', value: totalWeight });
        // set total item count
        itemFulfill.setValue({ fieldId: 'custbody_sp_total_items', value: totalItems });

        log.debug({
          title: 'DONE!',
          details: 'Total order weight: ' + totalWeight + ' lb(s) | Total order item count: ' + totalItems
        });

        return true;

      } catch (e) {
        log.debug({
          title: 'ERROR!',
          details: e.message
        });

        return false;
      }
    }

    /**
     * Rounds value to 2 decimals
     * @param {decimal} value - the value you want to round to
     * @param {integer} decimals - how many decimal places you want to round to 
     */
    function round(value, decimals) {
      return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }

    function onAction(context) {
      var itemFulfill = context.newRecord;
      try {
        // testing output
        var lines = itemFulfill.getLineCount({ sublistId: 'item' });
        log.debug({
          title: 'Item Fulfillment',
          details: 'There were ' + lines + ' lines in IT.'
        });
        for (var i = 0; i < lines; i++) {
          var quantity = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
          var itemName = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'itemname', line: i });
          log.debug({
            title: 'Line ' + i,
            details: itemName + ' x ' + quantity
          });
        }
        // change shipment method -- reloads
        var shipmethod = itemFulfill.getValue('shipmethod');

        if (shipmethod != uspsPriorityMdFlatRateBox) {
          itemFulfill.setValue('shipmethod', uspsPriorityMdFlatRateBox);
        }

      } catch (e) {
        log.debug({
          title: 'ERROR!',
          details: e.message
        });

        // do shit
        itemFulfill.setValue('shipstatus', 'B', true);

        log.debug({
          title: 'Catch',
          details: itemFulfill.getValue('shipmethod') + ' | ' + itemFulfill.getValue('shipstatus')
        })

        log.debug({
          title: 'Package',
          details: itemFulfill.getSublists()
        });

        log.debug({
          title: 'Running Calculate Function',
          details: 'Will calculate total weight and item count...'
        });

        calculateTotalWeightCount(itemFulfill);

        return itemFulfill.id;
      }
    }

    return {
      onAction: onAction
    }
  });