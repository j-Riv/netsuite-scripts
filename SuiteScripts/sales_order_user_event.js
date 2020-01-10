/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record'], function (record) {
  function calculateTotalWeight(context) {
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
      var unit = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_weight_units', line: i });
      var weight = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_weight', line: i });
      var quantity = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });

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
    // set fields
    currentRecord.setValue({ fieldId: 'custbody_sp_total_items_weight',value: totalWeight });
    currentRecord.setValue({ fieldId: 'custbody_sp_total_items',value: totalItems });
    currentRecord.save({
      enableSourcing: true,
      ignoreMandatoryFields: false
    });
  }
  return {
    afterSubmit: calculateTotalWeight
  }
});