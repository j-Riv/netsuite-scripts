/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/ui/serverWidget', 'N/search', 'N/file', 'N/log'],
  (runtime, serverWidget, search, file, log) => {

    /**
     * Handles Suitelet request
     * @param {Object} context 
     */
    const onRequest = context => {

      const request = context.request;
      const response = context.response;
      onGet(response);
    }

    /**
     * Handles Get Request and loads the saved search
     * @param {Object} response 
     */
    const onGet = response => {
      // Load saved search
      const retailReplenishmentSavedSearch = runtime.getCurrentScript().getParameter('custscript_retail_replenishment_search');
      const retailStoreSearch = search.load({
        id: retailReplenishmentSavedSearch
      });

      // add apparel filter
      // let defaultFilters = retailStoreSearch.filters;
      // const newFilter = {
      //   'name': 'custitem_sp_item_sku',
      //   'operator': search.Operator.STARTSWITH,
      //   'values': 'S'
      // };

      // defaultFilters.push(newFilter);
      // retailStoreSearch.filters = defaultFilters;

      const pagedData = retailStoreSearch.runPaged({
        pageSize: 1000
      });
      
      const itemResults = [];
      pagedData.pageRanges.forEach(function (pageRange) {
        let page = pagedData.fetch({ index: pageRange.index });
        page.data.forEach(function (result) {
          itemResults.push(result);
        });
      });

      log.debug({
        title: 'RESULTS FOUND!',
        details: JSON.stringify(itemResults.length)
      });

      // get ids to use with main warehouse item search
      const ids = [];
      for (i in itemResults) {
        // push id
        ids.push(itemResults[i].id);
      }

      log.debug({
        title: 'REPLENISHMENT ITEM IDS',
        details: JSON.stringify(ids)
      });

      // create main warehouse item search and return object
      const itemSearchValues = mainWarehouseSearch(ids);

      log.debug({
        title: 'MAIN WAREHOUSE ITEM SEARCH OBJECT',
        details: JSON.stringify(itemSearchValues)
      });

      // build array of objects for csv
      // create a copy and parse
      let retailStoreResultsJSON = JSON.stringify(retailStoreResults);
      retailStoreResultsJSON = JSON.parse(retailStoreResultsJSON);
      const items = [];
      for (j in retailStoreResultsJSON) {
        let item = retailStoreResultsJSON[j];
        const itemName = item.values.displayname;
        const sku = item.values.custitem_sp_item_sku;
        // get warehouse available from item search object
        const warehouseQuantityAvailable = itemSearchValues[item.id].warehouseAvailable;
        // calculate
        const storeQuantityAvailable = parseInt(item.values.formulanumeric);
        const storeQuantityMax = parseInt(item.values.formulanumeric_1);
        let quantityNeeded = storeQuantityMax - storeQuantityAvailable;

        if (warehouseQuantityAvailable != '' && warehouseQuantityAvailable > 0) {
          if (quantityNeeded > warehouseQuantityAvailable) {
            quantityNeeded = warehouseQuantityAvailable;
          }
          const replenish = {
            id: item.id,
            sku: sku,
            name: itemName.replace(',', ''),
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
      const csvFileId = createCSV(items);

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
      const page = createPage(items);
      response.writePage(page);

    }

    /**
     * Creates an item search and retrieves the Main Warehouse
     * Location Availability for each item.
     * @param {Array} ids The internal ids for items to search for
     * @returns {Object} Returns the object returned from createItemSearchObj
     */
    const mainWarehouseSearch = ids => {
      const itemSearch = search.create({
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
      const itemSearchResultSet = itemSearch.run();
      const itemSearchResults = itemSearchResultSet.getRange(0, 1000);
      // make a copy & parse
      let itemSearchValues = JSON.stringify(itemSearchResults);
      itemSearchValues = JSON.parse(itemSearchValues);
      // create the object
      return createItemSearchObj(itemSearchValues);
    }

    /**
     * Creates an the Main Warehouse Location Availability Object,
     * uses the internal id of the item as the key.
     * @param {Array} items 
     * @returns {Object}
     */
    const createItemSearchObj = items => {
      var obj = {};
      for (i in items) {
        let item = items[i];
        const warehouseAvailable = parseInt(item.values.locationquantityavailable);
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
     * @returns {string} The file's internal id
     */
    const createCSV = items => {
      const dir = parseInt(runtime.getCurrentScript().getParameter('custscript_retail_replenishment_dir'));
      const today = todaysDate();
      const rnd = generateRandomString();
      // create the csv file
      let csvFile = file.create({
        name: 'retail-store-replenishment-' + today + '_' + rnd + '.csv',
        contents: 'transferName,id,sku,name,storeQuantityAvailable,storeQuantityMax,'
          + 'warehouseQuantityAvailable,quantityNeeded,date\n',
        folder: dir,
        fileType: 'CSV'
      });

      // add the data
      for (i in items) {
        let item = items[i];
        csvFile.appendLine({
          value: 'Retail Store - ' + today + ',' + item.id + ',' + item.sku + ',' + item.name + ',' + item.storeQuantityAvailable + ','
            + item.storeQuantityMax + ',' + item.warehouseQuantityAvailable + ',' + item.quantityNeeded
            + ',' + today
        });
      }

      // save the file
      const csvFileId = csvFile.save();
      return csvFileId;
    }

    /**
     * Generates today's date in format DD/MM/YYYY
     * @returns {string} Today's date
     */
    const todaysDate = () => {
      const today = new Date();
      let dd = today.getDate();
      let mm = today.getMonth() + 1;
      const yyyy = today.getFullYear();
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
     * @returns {string} The random string
     */
    const generateRandomString = () => {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);;
    }

    /**
     * Creates an html table for results page
     * @param {string} itemCount 
     * @param {string} csvID 
     * @param {Object} items 
     * @returns {string} The html to render
     */
    const createResultsPage = (itemCount, csvID, items) => {
      const head = '<tr><th>ID</th>'
        + '<th>SKU</th>'
        + '<th>NAME</th>'
        + '<th>STORE QTY AVAILABLE</th>'
        + '<th>STORE QTY MAX</th>'
        + '<th>WAREHOUSE QTY AVAILABLE</th>'
        + '<th>QTY NEEDED</th></tr>';

      let tableData;
      for (let i in items) {
        let item = items[i];
        let tr = '<tr></tr><td> ' + item.id + '</td>'
          + '<td> ' + item.sku + '</td>'
          + '<td> ' + item.name + '</td>'
          + '<td> ' + item.storeQuantityAvailable + '</td>'
          + '<td> ' + item.storeQuantityMax + '</td>'
          + '<td> ' + item.warehouseQuantityAvailable + '</td>'
          + '<td> ' + item.quantityNeeded + '</td></tr>';
        tableData += tr;
      }

      const html = '<p>Results: ' + itemCount + '</p>'
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
     * @returns {Object} The Page to render 
     */
    const createPage = items => {
      const list = serverWidget.createList({ title: 'Retail Replenishment - ' + todaysDate() + ' | Total: ' + items.length });

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
        let item = items[i];
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