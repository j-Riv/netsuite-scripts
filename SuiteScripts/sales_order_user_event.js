/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record'], function (record) {
  /**
   * 
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
        // check if line item has quantity
        // custom line items like discount and subtotal should not -- these will be skipped
        if (quantity) {
          var unit = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_weight_units', line: i });
          var weight = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_weight', line: i });

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
          // calculate total weight
          totalWeight = parseFloat(totalWeight) + parseFloat(lineWeight);
          // calculate total item count
          totalItems = parseInt(totalItems) + parseInt(quantity);
        }

      }
      totalWeight = round(totalWeight, 2);
      // set fields
      currentRecord.setValue({ fieldId: 'custbody_sp_total_items_weight', value: totalWeight });
      currentRecord.setValue({ fieldId: 'custbody_sp_total_items', value: totalItems });
      currentRecord.save({
        enableSourcing: true,
        ignoreMandatoryFields: false
      });
    }
  }
  return {
    afterSubmit: calculateTotalWeight
  }
});