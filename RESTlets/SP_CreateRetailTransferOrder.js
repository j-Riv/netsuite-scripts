/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */

define(['N/record', 'N/search'],
  function (record, search) {

    function post(context) {
      // var customerSearchResult = search.create({
      //   type: search.Type.CUSTOMER,
      //   filters: [{ name: context.fieldName, operator: 'is', values: context.fieldValue }]
      // }).run().getRange({ start: 0, end: 1 });
      // // Used in controller
      // var data = {
      //   customer: false
      // };
      // // If customer found
      // if (customerSearchResult[0]) {
      //   data.customer = true;
      //   data.id = customerSearchResult[0].id;
      // };

      // return JSON.stringify(data);

      var loadedSearch = search.load({
        id: 'customsearch_sp_retail_store_rf_smart__2'
      });

      var searchResult = loadedSearch.run().getRange({
        start: 0,
        end: 500
      });

      for (var i = 0; i < searchResult.length; i++) {
        var totalAvailable = searchResult[i].getValue({
          name: 'Total Available'
        });
        var quantityToTransfer = searchResult[i].getValue({
          name: 'Quantity To Transfer'
        });
        var id = searchResult[i].getValue({
          name: 'Internal Id'
        });

        var loadedRecord = record.load({
          type: 'ITEM',
          id: id,
          isDynamic: true
        });
        
      }



    }

    return {
      post: post
    };
  }); 