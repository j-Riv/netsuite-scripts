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

      var data = {
        customer: false
      };

      if (customerSearchResult[0]) {
        data.customer = true;
        data.id = customerSearchResult[0].id;
      };

      return JSON.stringify(data);
    }

    return {
      post: post
    };
  }); 