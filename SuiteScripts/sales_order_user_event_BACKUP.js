/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log'], function (record, log) {
  /**
   * Rounds value to 2 decimals
   * @param {decimal} value - the value you want to round to
   * @param {integer} decimals - how many decimal places you want to round to 
   */
  function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  }

  /**
   * Calculates and sets the total order weight and total order item count
   * @param {*} context - form data 
   */
  function calculateTotalWeight(context) {
    // check for user event type
    if (context.type == 'create' || context.type == 'edit') {
      try {
        // get record
        var currentRecord = record.load({
          type: context.newRecord.type,
          id: context.newRecord.id
        });
        // get line count
        var lines = currentRecord.getLineCount({ sublistId: 'item' });
        var totalWeight = 0;
        var totalItems = 0;

        for (var i = 0; i < lines; i++) {
          // get weight unit (lb, oz, kg, g)
          var quantity = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
          var weight = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_weight', line: i });
          // check if line item has quantity
          // custom line items like discount and subtotal should not -- these will be skipped
          if (quantity && weight) {
            log.debug({
              title: 'Quantity of line ' + i,
              details: quantity
            });
            var unit = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_weight_units', line: i });

            log.debug({
              title: 'Weight',
              details: weight + ' ' + unit
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

            // calculate line weight
            var lineWeight = weight * quantity;
            log.debug({
              title: 'Line Weight',
              details: weight + ' ' + unit
            });
            // calculate total weight
            totalWeight = parseFloat(totalWeight) + parseFloat(lineWeight);
            // calculate total item count
            totalItems = parseInt(totalItems) + parseInt(quantity);
          }

        }
        totalWeight = round(totalWeight, 2);
        // set fields
        currentRecord.setValue({ fieldId: 'custbody_sp_total_items_weight', value: totalWeight });
        log.debug({
          title: 'Set Value: Total Items Weight (lbs):',
          details: totalWeight
        });
        currentRecord.setValue({ fieldId: 'custbody_sp_total_items', value: totalItems });
        log.debug({
          title: 'Set Value: Total Items:',
          details: totalItems
        });
        currentRecord.save({
          enableSourcing: true,
          ignoreMandatoryFields: false
        });
      } catch (e) {
        log.error({
          title: 'Error',
          details: e.message
        });
      }
    }
  }

  function beforeLoad(context) {
    // only create button in edit mode
    if (context.type !== context.UserEventType.VIEW) {
      context.form
        .addButton({
          id: 'custpage_calculate_handling',
          label: 'Calculate Handling',
          functionName: 'calculateHandling'
        });
      context.form.clientScriptModulePath = 'SuiteScripts/sales_order_client.js';
    }
  }

  return {
    beforeLoad: beforeLoad
    // afterSubmit: calculateTotalWeight
  }
});