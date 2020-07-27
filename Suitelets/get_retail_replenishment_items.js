/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/ui/serverWidget', 'N/search', 'N/file', 'N/log', './createTransferOrder'],
  function (runtime, serverWidget, search, file, log, spTransferOrder) {

    /**
     * Handles Suitelet request
     * @param {object} context 
     */
    function onRequest(context) {

      var request = context.request;
      var response = context.response;
      onGet(response);
    }

    /**
     * Handles Get Request and loads the saved search
     * @param {Object} response 
     */
    function onGet(response) {
      // Load saved search
      var retailReplenishmentSavedSearch = runtime.getCurrentScript().getParameter('custscript_retail_replenishment_search');
      var retailStoreSearch = search.load({
        id: retailReplenishmentSavedSearch
      });

      // add apparel filter
      // var defaultFilters = retailStoreSearch.filters;
      // var newFilter = {
      //   'name': 'custitem_sp_item_sku',
      //   'operator': search.Operator.STARTSWITH,
      //   'values': 'S'
      // };

      // defaultFilters.push(newFilter);
      // retailStoreSearch.filters = defaultFilters;

      var retailStoreResultSet = retailStoreSearch.run();
      var retailStoreResults = retailStoreResultSet.getRange(0, 1000);

      log.debug({
        title: 'RESULTS FOUND!',
        details: JSON.stringify(retailStoreResults.length)
      });

      // get ids to use with main warehouse item search
      var ids = [];
      for (var i in retailStoreResults) {
        // push id
        ids.push(retailStoreResults[i].id);
      }

      log.debug({
        title: 'REPLENISHMENT ITEM IDS',
        details: JSON.stringify(ids)
      });

      // create main warehouse item search and return object
      var itemSearchValues = mainWarehouseSearch(ids);

      log.debug({
        title: 'MAIN WAREHOUSE ITEM SEARCH OBJECT',
        details: JSON.stringify(itemSearchValues)
      });

      // build array of objects for csv
      // create a copy and parse
      var retailStoreResultsJSON = JSON.stringify(retailStoreResults);
      retailStoreResultsJSON = JSON.parse(retailStoreResultsJSON);
      var items = [];
      for (var j in retailStoreResultsJSON) {
        var item = retailStoreResultsJSON[j];
        var itemName = item.values.displayname;
        var sku = item.values.custitem_sp_item_sku;
        // get warehouse available from item search object
        var warehouseQuantityAvailable = itemSearchValues[item.id].warehouseAvailable;
        // calculate
        var storeQuantityAvailable = parseInt(item.values.formulanumeric);
        var storeQuantityMax = parseInt(item.values.formulanumeric_1);
        var quantityNeeded = storeQuantityMax - storeQuantityAvailable;

        if (warehouseQuantityAvailable != '' && warehouseQuantityAvailable > 0) {
          if (quantityNeeded > warehouseQuantityAvailable) {
            quantityNeeded = warehouseQuantityAvailable;
          }
          var replenish = {
            id: item.id,
            sku: sku,
            name: itemName.replace(',',''),
            storeQuantityAvailable: storeQuantityAvailable,
            storeQuantityMax: storeQuantityMax,
            warehouseItemID: itemSearchValues[j],
            warehouseQuantityAvailable: warehouseQuantityAvailable,
            quantityNeeded: quantityNeeded
          };

          itemToReplenish = replenish;

          items.push(itemToReplenish);
        }
      }

      // create CSV and save to file cabinet
      var csvFileId = createCSV(items);

      // create transfer order
      var memo = 'Retail Store - ' + todaysDate();
      spTransferOrder.create(3, 1, items, memo);

      // uncomment to write data object to browser (unformatted dump)
      // response.write(JSON.stringify({
      //   fileID: csvFileId, 
      //   itemCount: items.length, 
      //   items: items 
      // }));

      // uncomment to write html table
      // var html = createResultsPage(items.length, csvFileId, items);
      // response.write(html);

      // uncomment to create list and write to page
      var page = createPage(items);
      response.writePage(page);

    }

    /**
     * Creates an item search and retrieves the Main Warehouse
     * Location Availability for each item.
     * @param {array} ids - The internal ids for items to search for
     * @returns {Object} - Returns the object returned from createItemSearchObj
     */
    function mainWarehouseSearch(ids) {
      var itemSearch = search.create({
        type: 'item',
        columns: [
          'locationquantityavailable'
        ]
      });
      itemSearch.filters = [
        search.createFilter({
          name: 'inventorylocation',
          operator: search.Operator.IS,
          values: '1' // main warehouse
        }),
        search.createFilter({
          name: 'internalid',
          operator: search.Operator.IS,
          values: ids
        })
      ];
      var itemSearchResultSet = itemSearch.run();
      var itemSearchResults = itemSearchResultSet.getRange(0, 1000);
      // make a copy & parse
      var itemSearchValues = JSON.stringify(itemSearchResults);
      itemSearchValues = JSON.parse(itemSearchValues);
      // create the object
      return createItemSearchObj(itemSearchValues);
    }

    /**
     * Creates an the Main Warehouse Location Availability Object,
     * uses the internal id of the item as the key.
     * @param {array} items 
     * @returns {Object}
     */
    function createItemSearchObj(items) {
      var obj = {};
      for (var i in items) {
        var item = items[i];
        var warehouseAvailable = parseInt(item.values.locationquantityavailable);
        obj[item.id] = {
          warehouseAvailable: warehouseAvailable
        }
      }
      return obj;
    }

    /**
     * Creates a CSV file to be used to import and create a Transfer Order for
     * Retail Store Item Replenishment.
     * @param {Object} items 
     * @returns {string} - The file's internal id
     */
    function createCSV(items) {
      var dir = parseInt(runtime.getCurrentScript().getParameter('custscript_retail_replenishment_dir'));
      var today = todaysDate();
      var rnd = generateRandomString();
      // create the csv file
      var csvFile = file.create({
        name: 'retail-store-replenishment-' + today + '_' + rnd + '.csv',
        contents: 'transferName,id,sku,name,storeQuantityAvailable,storeQuantityMax,'
          + 'warehouseQuantityAvailable,quantityNeeded,date\n',
        folder: dir,
        fileType: 'CSV'
      });

      // add the data
      for (i in items) {
        var item = items[i];
        csvFile.appendLine({
          value: 'Retail Store - ' + today + ',' + item.id + ',' + item.sku + ',' + item.name + ',' + item.storeQuantityAvailable + ',' 
            + item.storeQuantityMax + ',' + item.warehouseQuantityAvailable + ',' + item.quantityNeeded
            + ',' + today
        });
      }

      // save the file
      var csvFileId = csvFile.save();
      return csvFileId;
    }

    /**
     * Generates today's date in format DD/MM/YYYY
     * @returns {string} - Today's date
     */
    function todaysDate() {
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth() + 1;
      var yyyy = today.getFullYear();
      if (dd < 10) {
        dd = '0' + dd;
      }
      if (mm < 10) {
        mm = '0' + mm;
      }
      return mm + '/' + dd + '/' + yyyy
    }

    /**
     * Generates a random string to be used during
     * CSV file naming as to not overwrite existing file.
     * @returns {string} - The random string
     */
    function generateRandomString() {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);;
    }

    /**
     * Creates an html table for results page
     * @param {string} itemCount 
     * @param {string} csvID 
     * @param {Object} items 
     * @returns {string} - The html to render
     */
    function createResultsPage(itemCount, csvID, items) {
      var head = '<tr><th>ID</th>'
        + '<th>SKU</th>'
        + '<th>NAME</th>'
        + '<th>STORE QTY AVAILABLE</th>'
        + '<th>STORE QTY MAX</th>'
        + '<th>WAREHOUSE QTY AVAILABLE</th>'
        + '<th>QTY NEEDED</th></tr>';

      var tableData;
      for (i in items) {
        var item = items[i];
        var tr = '<tr></tr><td> ' + item.id +  '</td>'
          + '<td> ' + item.sku + '</td>'
          + '<td> ' + item.name + '</td>'
          + '<td> ' + item.storeQuantityAvailable + '</td>'
          + '<td> ' + item.storeQuantityMax + '</td>'
          + '<td> ' + item.warehouseQuantityAvailable + '</td>'
          + '<td> ' + item.quantityNeeded + '</td></tr>';
        tableData += tr;
      }

      var html = '<p>Results: ' + itemCount + '</p>'
        + '<p>CSV File ID: ' + csvID + '</p>'
        + '<table>'
        + head
        + tableData
        + '</table>';

      return html;
    }

    /**
     * Creates a list widget for the results page
     * @param {Object} items
     * @returns {Object} - The Page to render 
     */
    function createPage(items) {
      var list = serverWidget.createList({ title: 'Retail Replenishment - ' + todaysDate() + ' | Total: ' + items.length });

      list.addColumn({
        id: 'column_id',
        type: serverWidget.FieldType.TEXT,
        label: 'ID',
        align: serverWidget.LayoutJustification.LEFT
      });
      list.addColumn({
        id: 'column_sku',
        type: serverWidget.FieldType.TEXT,
        label: 'SKU',
        align: serverWidget.LayoutJustification.LEFT
      });
      list.addColumn({
        id: 'column_name',
        type: serverWidget.FieldType.TEXT,
        label: 'Name',
        align: serverWidget.LayoutJustification.LEFT
      });
      list.addColumn({
        id: 'column_store_qty_available',
        type: serverWidget.FieldType.TEXT,
        label: 'Store Qty Available',
        align: serverWidget.LayoutJustification.LEFT
      });
      list.addColumn({
        id: 'column_store_qty_max',
        type: serverWidget.FieldType.TEXT,
        label: 'Store Qty Max',
        align: serverWidget.LayoutJustification.LEFT
      });
      list.addColumn({
        id: 'column_warehouse_qty_available',
        type: serverWidget.FieldType.TEXT,
        label: 'Warehouse Qty Available',
        align: serverWidget.LayoutJustification.LEFT
      });
      list.addColumn({
        id: 'column_qty_needed',
        type: serverWidget.FieldType.TEXT,
        label: 'Quantity Needed',
        align: serverWidget.LayoutJustification.LEFT
      });

      for (i in items) {
        var item = items[i];
        list.addRow({
          row: {
            column_id: item.id,
            column_sku: item.sku,
            column_name: item.name,
            column_store_qty_available: String(item.storeQuantityAvailable),
            column_store_qty_max: String(item.storeQuantityMax),
            column_warehouse_qty_available: String(item.warehouseQuantityAvailable),
            column_qty_needed: String(item.quantityNeeded)
          }
        });
      }

      return list;
    }


    return {
      onRequest: onRequest
    };
  });

// Result Object
// This could change as it depends on the loaded saved search results structure
var ex = [
  {
    recordType: "inventoryitem", // the item type
    id: "26727", // the internal id
    values: {
      formuladate: "7/1/2020", // date to be used for Transfer Order (today)
      formulatext: "Retail Store-7/1/2020", // memo to be used
      inventorylocation: [
        {
          value: "3",
          text: "Retail Store"
        }
      ],
      formulanumeric: "0", // store quantity available
      formulatext_1: "Receiving - Store", // RF Smart Bin Name
      formulanumeric_1: "4", // Store qty Max
      itemid: "8-bit-kids-tee-black : S299BL", // SKU
      displayname: "8-Bit Kid's Tee Black - L", // Display Name
      type: [
        {
          value: "InvtPart", // type
          text: "Inventory Item"
        }
      ],
      formulanumeric_2: "15", // total available across all locations
      formulanumeric_3: "4", // quantity to transfer based on need (Max - Available)
      isavailable: true
    },
  }
];