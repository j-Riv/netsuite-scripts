function calculateTotalWeight() {
  // get record
  var record = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
  // get line count
  var lines = record.getLineItemCount('item');
  var totalWeight = 0;
  var totalItems = 0;
  
  for (var i = 1; i < lines + 1; i++) {
    // get weight unit (lb, oz, kg, g)
    var unit = record.getLineItemValue('item', 'custcol_sp_item_weight_units', i);
    var weight = record.getLineItemValue('item', 'custcol_sp_item_weight', i);
    var quantity = record.getLineItemValue('item', 'quantity', i);

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
    totalWeight = totalWeight + lineWeight;
    // calculate total item count
    totalItems = Number(totalItems) + Number(quantity);
  }
  // set fields
  record.setFieldValue('custbody_sp_total_items_weight', totalWeight);
  record.setFieldValue('custbody_sp_total_items', totalItems);
  // save record
  nlapiSubmitRecord(record);
}