/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */

define(['N/search'], 
  function (search) {

    function post(context) {
      var customerSearchResult = search.create({
        type: search.Type.CUSTOMER,
        filters: [{ name: context.fieldName, operator: 'is', values: context.fieldValue }]
      }).run().getRange({ start: 0, end: 1 });

      var customerInternalId = customerSearchResult[0].id;

      return String(customerInternalId);
    }

    return {
      post: post
    };
  }); 