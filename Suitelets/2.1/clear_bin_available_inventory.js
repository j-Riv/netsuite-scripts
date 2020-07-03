/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/ui/serverWidget', 'N/search', 'N/file', 'N/log'],
  (runtime, serverWidget, search, file, log) => {

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
      // Handle getting the bin internal id
      const binSearch = search.create({
        type: 'bin',
        columns: [
          'internalid',
          'location'
        ]
      });
      binSearch.filters = [
        search.createFilter({
          name: 'binnumber',
          operator: search.Operator.IS,
          values: request.parameters.bin_number
        })
      ];
      const searchResults = binSearch.run();
      const searchValues = searchResults.getRange({
        start: 0,
        end: 1
      });

      const savedSearchID = runtine.getCurrentScript().getParameter('custscript_bin_available_items_search_id');
      const savedSearch = search.load({
        id: savedSearchID
      });
      const Form = serverWidget.createForm({
        title: `Clear Bin's Available Inventory`
      });
      const FormFieldGroup = Form.addFieldGroup({
        id: 'group_1',
        label: 'The Form'
      });
      const DataFieldGroup = Form.addFieldGroup({
        id: 'group_2',
        label: 'The Data'
      });
      const BinField = Form.addField({
        id: 'bin_number',
        label: 'Bin Number',
        type: serverWidget.FieldType.TEXT,
        container: 'group_1'
      });
      const Button = Form.addSubmitButton({
        label: 'Submit',
        container: 'group_1'
      });
      const P = Form.addField({
        id: 'p1',
        label: 'A paragraph',
        type: serverWidget.FieldType.INLINEHTML,
        container: 'group_2'
      });
      const ID = Form.addField({
        id:'p2',
        label: 'Bin ID',
        type: serverWidget.FieldType.INLINEHTML,
        container: 'group_2'
      });
      P.defaultValue = `<p>Hello, World!</p>`;
      ID.defaultValue = `<p>${searchValues[0].id}</p>`;
      log.debug({
        title: 'Search Result Values',
        details: searchValues
      });
      response.writePage(Form);
    }

    return { onRequest: onRequest };
  }
)