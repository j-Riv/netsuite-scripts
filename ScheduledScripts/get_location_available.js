/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/runtime', 'N/search', 'N/email'],
  function (runtime, search, email) {

    /**
     * Executes scheduled script
     */
    function execute() {
      // get params
      var location1 = runtime.getCurrentScript().getParameter('custscript_location_1');
      var location2 = runtime.getCurrentScript().getParameter('custscript_location_2');
      var formula1 = "CASE WHEN {inventorylocation} = '" + location1 + "' AND NVL({locationquantityavailable},0) = 0 THEN 1 ELSE 0 END";
      var formula2 = "CASE WHEN {inventorylocation} = '" + location2 + "' AND NVL({locationquantityavailable},0) > 0 THEN 1 ELSE 0 END";
      // create searches
      var location1Items = createSearch(formula1);
      var location2Items = createSearch(formula2);
      // create item obj
      var itemsObj = createItemsObj(location2Items);

      var items = [];
      location1Items.forEach(function (item) {
        var sku = item.getValue('custitem_sp_item_sku');
        var displayName = item.getValue('displayname');
        if (itemsObj[sku] && itemsObj[sku].quantityAvailable > 0) {
          items.push({
            sku: sku,
            displayName: displayName,
            available: itemsObj[sku].quantityAvailable
          });
        }
      });

      log.debug({
        title: 'RESULTS',
        details: JSON.stringify(items)
      });
      // send email
      sendEmail(location1, location2, items);
    }

    /**
     * Creates an item search and returns the results.
     * @param {string} formula - The SQL formula to use
     * @returns {array}
     */
    function createSearch(formula) {
      // create search
      var itemSearch = search.create({
        type: 'item',
        columns: [
          'custitem_sp_item_sku',
          'displayname',
          'locationquantityavailable'
        ]
      });
      // create filters
      itemSearch.filters = [
        search.createFilter({
          name: 'formulanumeric',
          operator: search.Operator.EQUALTO,
          values: [1],
          formula: formula
        })
      ];
      // run search
      var itemResultSet = itemSearch.run();
      var itemResults = itemResultSet.getRange({
        start: 0,
        end: 1000
      });

      log.debug({
        title: 'SEARCH RESULTS',
        details: JSON.stringify(itemResults)
      });

      return itemResults;
    }

    /**
     * Creates an object with the items SKU as the key.
     * @param {array} items - The Search Results
     * @returns {Object}
     */
    function createItemsObj(items) {
      var itemsObj = {};
      items.forEach(function (item) {
        var sku = item.getValue('custitem_sp_item_sku');
        var displayName = item.getValue('displayname');
        var quantityAvailable = item.getValue('locationquantityavailable');
        itemsObj[sku] = {
          displayName: displayName,
          quantityAvailable: parseInt(quantityAvailable)
        };
      });

      log.debug({
        title: 'ITEMS OBJECT',
        details: JSON.stringify(itemsObj)
      });

      return itemsObj;
    }

    /**
     * Creates and sends the email.
     * @param {string} location1 
     * @param {string} location2 
     * @param {array} items 
     */
    function sendEmail(location1, location2, items) {

      var html = '<p>The following items do not have available quantities in ' 
        + location1 + ', but are available at ' + location2 + '</p>'
        + '<table><tr><th>SKU</th><th>Name</th><th>Available</th></tr>';
      items.forEach(function (item) {
        html += '<tr><td>' + item.sku + '</td><td>' + item.displayName + '</td><td>' + item.available + '</td></tr>'
      });
      html += '</table>';

      log.debug({
        title: 'SENDING EMAIL HTML',
        details: html
      });

      email.send({
        author: 207,
        recipients: 258,
        replyTo: 'jriv@suavecito.com',
        bcc: [207,-5],
        subject: 'The following items can be transfered from ' + location2,
        body: html
      });
    }

    return {
      execute: execute
    };
  }); 