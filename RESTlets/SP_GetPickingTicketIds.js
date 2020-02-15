/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */

define(['N/search'],
  function (search) {
    /**
     * Gets sales order id(s) based on a saved search
     * Filters saved search based on marketplace
     * @param {Object} context - the post body
     */

    function getPickingTicketIds(context) {
      
      // set saved search
      var savedSearch = 'customsearch955';
      // if getPrinted - gets all picking tickets from all open sales orders
      // else gets picking tickets that have not been printed from sales orders
      if (context.getPrinted) {
        savedSearch = 'customsearch949';
      }

      // load saved search
      var mySearch = search.load({
        id: savedSearch
      });

      // set marketplace
      var marketplace;
      var operator;
      if (context.marketplace) {
        if (context.marketplace == 'netsuite') {
          // set marketplace to empty for in netsuite transactions
          marketplace = '';
          operator = 'isempty';
        } else {
          // set marketplace to appropriate FarApp marketplace
          marketplace = context.marketplace;
          operator = 'is';
        }
        // get filters
        var defaultFilters = mySearch.filters;
        // add new filters
        var newFilters = {
          'name': 'custbody_fa_channel',
          'operator': operator,
          'values': marketplace
        };
        defaultFilters.push(newFilters);
        mySearch.filters = defaultFilters;
      }

      // run search
      var resultSet = mySearch.run()
      // get result range
      var results = resultSet.getRange(0, 1000);

      // get internal ids
      var ids = [];
      for (var i in results) {
        var result = results[i];
        ids.push(result.id);
      }

      return {
        results: ids
      }
    }

    return {
      post: getPickingTicketIds
    };
  });