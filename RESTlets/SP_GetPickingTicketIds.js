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
      var savedSearch;
      if (context.getPrinted) {
        // gets all picking tickets from all open sales orders
        savedSearch = 'customsearch949';
      } else {
        // gets picking tickets that have not been printed 
        // from open sales orders
        savedSearch = 'customsearch955';
      }

      // set marketplace
      var marketplace;
      var operator;
      if (context.marketplace) {
        marketplace = context.marketplace;
        operator = 'is';
      } else {
        marketplace = '';
        operator = 'isempty';
      }

      // load saved search
      var mySearch = search.load({
        id: savedSearch
      });

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