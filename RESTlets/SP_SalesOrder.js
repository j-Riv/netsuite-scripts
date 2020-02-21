/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/record','N/search', 'N/error'],
  function (record, search, error) {
    /**
     * Validates arguments
     * @param {array} args - the record type and optional record id
     * @param {*} argNames - what to check against
     * @param {*} methodName - (GET, DELETE, POST, PUT) 
     */
    function doValidation(args, argNames, methodName) {
      for (var i = 0; i < args.length; i++)
        if (!args[i] && args[i] !== 0)
          throw error.create({
            name: 'MISSING_REQ_ARG',
            message: 'Missing a required argument: [' + argNames[i] + '] for method: ' + methodName
          });
    }
    /**
     * Creates a Sales Order Record
     * @param {*} context 
     */
    function post(context) {
      doValidation([context.recordType], ['recordtype'], 'POST');

      // get customer
      var customerSearchResult = search.create({
        type: search.Type.CUSTOMER,
        filters: [{ name: 'email', operator: 'is', values: context.email }]
      }).run().getRange({ start: 0, end: 1 });

      var customerId;
      if (customerSearchResult[0]) {
        customerId = customerSearchResult[0].id;
      } else {
        // create customer
        var customerRecord = record.create({
          type: 'customer',
          isDynamic: true
        });
      }

      // create sales order
      var salesOrder = record.create({
          type: record.Type.SALES_ORDER,
          isDynamic: true,
          defaultValues: {
            entity: context.customerId
          }
        });

      var items = context.items;
      items.forEach(function (item) {
        // get item id
        var itemSearchResult = search.create({
          type: search.Type.CUSTOMER,
          filters: [{ name: 'itemid', operator: 'is', values: item.sku }]
        }).run().getRange({ start: 0, end: 1 });

        if (itemSearchResult[0]) {
          var itemId = itemSearchResult[0].id;
          // add a line to sublist item
          salesOrder.selectNewLine({ sublistId: 'item' });

          salesOrder.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            value: itemId // internal id
          });

          salesOrder.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: item.quantity
          });
        } else {
          return { Error: '(' + item.sku + ') item does not exist.'}
        }
      });

      salesOrder.commitLine({ sublistId: 'item' });

      try {
        var recordId = salesOrder.save({
            ignoreMandatoryFields: true
          });
        return String(recordId);
      } catch(e) {
        console.log('Error: ' + e.message);
      }
    }

    return {
      post: post
    };
  });