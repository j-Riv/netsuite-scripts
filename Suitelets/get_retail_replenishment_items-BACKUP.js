/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/file', 'N/log'],
  function (search, file, log) {

    function onRequest(context) {

      var request = context.request;
      var response = context.response;
      onGet(response);
    }

    function onGet(response) {
      // Load saved search
      var retailStoreSearch = search.load({
        id: 'customsearch_sp_retail_store_rf_smart__2'
      });

      var retailStoreResultSet = retailStoreSearch.run();
      var retailStoreResults = retailStoreResultSet.getRange(0, 1000);

      log.debug({
        title: 'Results Found!',
        details: JSON.stringify(retailStoreResults.length)
      });

      // get ids to use with search
      var ids = [];
      for (var i in retailStoreResults) {
        // push id
        ids.push(retailStoreResults[i].id);
      }

      log.debug({
        title: 'REPLENISHMENT ITEM IDS',
        details: JSON.stringify(ids)
      });

      // create item search
      var itemSearch = search.create({
        type: 'item',
        // columns: [
        //   'locationquantityavailable'
        // ]
        columns: [
          search.createColumn({
            name: 'locationquantityavailable',
            sort: search.Sort.ASC
          })
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
      // make a copy
      var itemSearchValues = JSON.stringify(itemSearchResults);
      itemSearchValues = JSON.parse(itemSearchValues);

      log.debug({
        title: 'ITEM SEARCH VALUES',
        details: JSON.stringify(itemSearchValues)
      });

      // build object
      var items = [];
      for (var j in retailStoreResults) {
        // create copy
        var item = JSON.stringify(retailStoreResults[j]);
        item = JSON.parse(item);
        var itemName = item.values.displayname;
        var sku = item.values.itemid;
        sku = sku.split(':');
        var warehouseQuantityAvailable = parseInt(itemSearchValues[j].values.locationquantityavailable);
        // needed values
        var storeQuantityAvailable = parseInt(item.values.formulanumeric);
        var storeQuantityMax = parseInt(item.values.formulanumeric_1);

        var quantityNeeded = storeQuantityMax - storeQuantityAvailable;

        if (warehouseQuantityAvailable) {
          if (quantityNeeded > warehouseQuantityAvailable) {
            quantityNeeded = warehouseQuantityAvailable;
          }
          var replenish = {
            id: item.id,
            sku: sku[1],
            name: itemName,
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

      // var csvFileId = createCSV(items);
      var csvFileId = 'no';

      response.write(JSON.stringify({ fileID: csvFileId, itemCount: items.length, items: items }));

    }

    function createCSV(items) {
      var today = todaysDate();
      // create the csv file
      var csvFile = file.create({
        name: 'retail-store-replenishment-' + today + '.csv',
        contents: 'id,sku,name,storeQuantityAvailable,storeQuantityMax,'
          + 'warehouseQuantityAvailable,quantityNeeded,date\n',
        folder: 2708,
        fileType: 'CSV'
      });

      // add the data
      for (i in items) {
        var item = items[i];
        csvFile.appendLine({
          value: item.id + ',' + item.sku + ',' + item.name + ',' + item.storeQuantityAvailable + ',' 
            + item.storeQuantityMax + item.warehouseQuantityAvailable + ',' + item.quantityNeeded
            + ',' + today
        });
      }

      // save the file
      var csvFileId = csvFile.save();
      return csvFileId;
    }

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


    return {
      onRequest: onRequest
    };
  });

// Result Object
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