/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime'],
  function (search, record, email, runtime) {
    function execute(context) {
      // if (context.type !== context.InvocationType.ON_DEMAND)
      //     return;
      var searchId = runtime.getCurrentScript().getParameter("custscript_searchid");
      try {
        search.load({
          id: searchId
        }).run().each(function (result) {
          log.debug({
            details: 'updating:' + result.id
          });
          // do shit
          // get record
          var salesRecord = record.load({
            type: record.Type.SALES_ORDER,
            id: result.id,
            isDynamic: true,
          });
          // get line count
          var lines = salesRecord.getLineCount({ sublistId: 'item' });
          var totalWeight = 0;
          var totalItems = 0;

          for (var i = 0; i < lines; i++) {
            log.debug({
              details: 'checking line: ' + i
            });
            // get weight unit (lb, oz, kg, g)
            var quantity = salesRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
            var weight = salesRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_weight', line: i });

            // check if line item has quantity
            // custom line items like discount and subtotal should not -- these will be skipped
            if (quantity && weight) {
              var unit = salesRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_weight_units', line: i });
              log.debug({
                details: 'converting ' + unit + ' to lb...'
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
                details: 'setting converted item weight'
              });
              var convertedWeight = round(weight, 3);
              var currentLine = salesRecord.selectLine({ sublistId: 'item', line: i });
              currentLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_converted_item_weight', value: convertedWeight, ignoreFieldChange: false });
              salesRecord.commitLine({ sublistId: 'item' });

              // calculate line weight
              var lineWeight = weight * quantity;
              // calculate total weight
              totalWeight = parseFloat(totalWeight) + parseFloat(lineWeight);
              // totalWeight = round(totalWeight, 2);
              // // set fields
              // salesRecord.setValue({ fieldId: 'custbody_sp_total_items_weight', value: totalWeight });

              var itemType = salesRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_type', line: i });

              // load  item record
              if (itemType == 'Kit/Package') {
                log.debug({
                  details: 'item is of type kit/package looking at components to get accurate item quantites...'
                });
                var itemId = salesRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_id', line: i });
                var loadedItem = record.load({
                  type: record.Type.KIT_ITEM,
                  id: Number(itemId)
                });
                var components = loadedItem.getLineCount({ sublistId: 'member' });

                var totalComponents = 0;
                for (var j = 0; j < components; j++) {
                  log.debug({
                    details: 'checking componenet ' + j
                  });
                  var componentQuantity = loadedItem.getSublistValue({ sublistId: 'member', fieldId: 'quantity', line: j });
                  totalComponents += componentQuantity;
                }
                // calculate total item count for kit items
                quantity = quantity * totalComponents;
              }
              // calculate total item count
              totalItems = parseInt(totalItems) + parseInt(quantity);
            }

          }
          // set total weight
          totalWeight = round(totalWeight, 2);
          // set fields
          salesRecord.setValue({ fieldId: 'custbody_sp_total_items_weight', value: totalWeight });
          // set total item count
          salesRecord.setValue({ fieldId: 'custbody_sp_total_items', value: totalItems });

          log.debug({
            details: 'Total order weight: ' + totalWeight + ' lb(s) | Total order item count: ' + totalItems
          });

          log.debug({
            details: 'DONE!'
          });

          salesRecord.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });

          return true;
        });
      } catch (e) {
        var subject = 'Fatal Error: Unable to update Sales Order';
        var authorId = 207;
        var recipientEmail = 'jriv@suavecito.com';
        email.send({
          author: authorId,
          recipients: recipientEmail,
          subject: subject,
          body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e)
        });
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

    return {
      execute: execute
    };
  }); 