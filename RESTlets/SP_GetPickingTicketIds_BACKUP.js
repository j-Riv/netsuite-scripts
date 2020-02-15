/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */

define(['N/search'],
  function (search) {
    function getPickingTicketIds(context) {

      // search with formula
      var mySearch = search.load({
        id: 'customsearch949'
      });

      var resultSet = mySearch.run()

      var results = resultSet.getRange(0, 1000);
      var ids = [];
      for (var i in results) {
        var result = results[i].getValue(results[i].columns[0]);
        ids.push(result);
      }

      return {
        results: ids
      }
    }

    return {
      get: getPickingTicketIds
    };
  });