/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/ui/serverWidget', 'N/search', 'N/log', 'N/record'],
  (runtime, serverWidget, search, log, record) => {

    /**
     * Handles Suitelet request
     * @param {object} context 
     */
    const onRequest = context => {
      const request = context.request;
      const response = context.response;
      if (request.method == 'GET') {
        onGet(response);
      } else if(request.method == 'POST') {
        onPost(request, response);
      }
    }

    /**
     * Generates the product form.
     * @param {object} response 
     */
    const onGet = (response) => {
      const Form = serverWidget.createForm({
        title: `Get Bin's Available Inventory`
      });
      const BinField = Form.addField({
        id: 'bin_number',
        label: 'Bin Number',
        type: serverWidget.FieldType.TEXT
      });
      const Button = Form.addSubmitButton({
        label: 'Submit'
      });

      response.writePage(Form);
    }

    /**
     * Returns the items in the bin
     * and generates a form for deleting them.
     * @param {object} request 
     * @param {object} response 
     */
    const onPost = (request, response) => {

      /**
       * Load the saved search
       */
      const savedSearchID = runtime.getCurrentScript().getParameter('custscript_bin_available_items_search_id');
      const savedSearch = search.load({
        id: savedSearchID
      });

      /**
       * Filter the saved search
       */
      const searchFilter = {
        name: 'formulanumeric',
        operator: search.Operator.EQUALTO,
        values: [1],
        formula: `CASE WHEN {binonhand.binnumber} = '${request.parameters.bin_number}' THEN 1 ELSE 0 END`
      }
      const savedSearchFilters = savedSearch.filters;
      savedSearchFilters.push(searchFilter);
      savedSearch.filters = savedSearchFilters;

      /**
       * Get the results of the saved search
       */
      const savedSearchResults = savedSearch.run().getRange(0, 1000);
      const savedSearchJSON = JSON.parse(JSON.stringify(savedSearchResults));

      log.debug({
        title: 'Saved Search',
        details: savedSearchResults
      });

      /**
       * Create Inventory Adjustment
       */
      const adjustInventory = () => {
        const adjustmentRecord = record.create({
          type: record.Type.INVENTORY_ADJUSTMENT,
          isDynamic: true
        });
        adjustmentRecord.setValue({
          fieldId: 'account',
          value: 213
        });
        adjustmentRecord.selectNewLine({
          sublistId: 'inventory'
        });
        adjustmentRecord.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'item',
          value: 24867
        });
        adjustmentRecord.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'adjustqtyby',
          value: -1
        });
        adjustmentRecord.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'location',
          value: 1
        });
        const subRecord = adjustmentRecord.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });
        subRecord.setCurrentSublistValue({
          sublistId: 'inventorydetail',
          fieldId: 'location',
          value: 1
        });
        subRecord.setCurrentSublistValue({
          sublistId: 'inventorydetail',
          fieldId: 'quantity',
          value: -1
        });
        const subSubRecord = subRecord.getCurrentSublistSubrecord({
          sublistId: 'inventoryassignment'
        });
        subSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'binnumber',
          value: 4113
        });
        subSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'quantity',
          value: -1
        })
      }
      adjustInventory();

      /**
       * Create the form
       */
      const Form = serverWidget.createForm({
        title: `Clear Bin's Available Inventory`
      });
      const Button = Form.addSubmitButton({
        label: 'Submit'
      });
      const DataFieldGroup = Form.addFieldGroup({
        id: 'group_2',
        label: 'The Data'
      });
      const Table = Form.addField({
        id: 'table',
        label: 'The table data',
        type: serverWidget.FieldType.INLINEHTML,
        container: 'group_2'
      });
      Table.defaultValue = `
        <table style="width: 100%">
          <tr>
            <td>SKU</td>
            <td>On Hand</td>
            <td>Available</td>
            <td> New On Hand</td>
          </tr>
          ${savedSearchJSON.map(record => 
            `<tr>
              <td>${record.values.itemid}</td>
              <td>${record.values['binOnHand.quantityonhand']}</td>
              <td>${record.values['binOnHand.quantityavailable']}</td>
              <td>${parseInt(record.values['binOnHand.quantityonhand']) - parseInt(record.values['binOnHand.quantityavailable'])}</td>
             </tr>
            `
          )}
        </table>
      `;
      response.writePage(Form);
    }

    return { onRequest: onRequest };
  }
)