/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */

define(['N/search'],
  function (search) {
    function getPickingTicketIds(context) {

      var mySearch = search.load({
        id: 'customsearch949'
      });

      var resultSet = mySearch.run()
      
      var results = resultSet.getRange(0, 1000);

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
      get: getPickingTicketIds
    };
  });