/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/file', 'N/record', 'N/ui/serverWidget', 'N/log'],
  (search, file, record, serverWidget, log) => {

    /**
     * Handles Suitelet request
     * @param {Object} context 
     */
    const onRequest = context => {
      const request = context.request;
      const response = context.response;

      if (request.method === 'GET') {
        onGet(response);
      } else {
        onPost(request, response);
      }
    }

    /**
     * Handles Get Request and loads the saved search
     * @param {Object} response 
     */
    const onGet = response => {
      const results = getFiles();
      const page = createPage(results);
      response.writePage(page);
    }

    const onPost = (request, response) => {
      const folderID = 753;
      const files = request.parameters.custpage_files;
      const customerID = request.parameters.custpage_customer;

      response.write('Moving file(s): ' + files + ' and attaching to customer: ' + customerID);
      const fileIDs = files.split(',');
      fileIDs.forEach(fileID => {
        // load and change dir
        const fileObj = file.load({ id: Number(fileID) });
        response.write('Moving file: ' + fileID);
        fileObj.folder = Number(folderID);
        fileObj.save();
        // attach to customer
        response.write('Attaching file: ' + fileID + ' to ' + customerID);
        record.attach({
          record: {
            type: 'file',
            id: Number(fileID)
          },
          to: {
            type: 'customer',
            id: Number(customerID)
          }
        });
      });
      response.write('DONE!');
    }

    const getFiles = () => {
      const folder = 32814;
      const fileSearch = search.create({
        type: 'folder',
        columns: [
          search.createColumn({
            name: 'internalid'
          }),
          search.createColumn({
            name: 'name',
            join: 'file'
          }),
          search.createColumn({
            name: 'internalid',
            join: 'file'
          }),
          search.createColumn({
            name: 'url',
            join: 'file'
          })
        ],
        filters: [
          search.createFilter({
            name: 'internalid',
            operator: search.Operator.IS,
            values: folder
          })
        ]
      });

      const pagedData = fileSearch.runPaged({
        pageSize: 100
      });

      const fileResults = [];
      pagedData.pageRanges.forEach(function (pageRange) {
        var page = pagedData.fetch({ index: pageRange.index });
        page.data.forEach(function (result) {
          log.debug({
            title: 'RESTULT',
            details: result
          });
          fileResults.push({
            'id': result.getValue({ name: 'internalid' }),
            'fileid': result.getValue({ name: 'internalid', join: 'file' }),
            'filename': result.getValue({ name: 'name', join: 'file' }),
            'url': result.getValue({ name: 'url', join: 'file' })
          });
        })
      });

      log.debug({
        title: 'FILE RESULTS',
        details: JSON.stringify(fileResults)
      });

      return fileResults;
    }

    const createPage = results => {
      const form = serverWidget.createForm({ title: 'Map Agreements' });
      log.debug({
        title: 'RESULTS LENGTH',
        details: results.length
      });
      if (results.length > 1) {
        form.clientScriptModulePath = 'SuiteScripts/agreements_client.js';
        form.addSubmitButton({
          label: 'Attach'
        });

        form.addField({
          id: 'custpage_message',
          type: serverWidget.FieldType.INLINEHTML,
          label: ' '
        }).updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
        }).updateBreakType({
          breakType: serverWidget.FieldBreakType.STARTROW
        }).defaultValue = 'Please add the customers internal id number below and select the file(s) to attach.';

        form.addField({
          id: 'custpage_customer',
          label: 'Customer Internal ID',
          type: serverWidget.FieldType.TEXT
          }).updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
          }).updateBreakType({
            breakType: serverWidget.FieldBreakType.STARTROW
          }).setHelpText({
            help: 'You can grab the customers internal id by going to the customer record and getting the id from the url. (ex: id=1102)'
          });

        form.addField({
          id: 'custpage_files',
          label: 'Files to Move & Attach',
          type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        const sublist = form.addSublist({
          id: 'custpage_agreements_sublist',
          type: 'list',
          label: 'Sublist'
        });

        sublist.addField({ 
          id: 'custpage_result_checkbox',
          type: 'checkbox',
          label: 'Select' 
        });
        sublist.addField({
          id: 'custpage_result_folderid',
          type: 'text',
          label: 'Folder ID'
        });
        // }).updateDisplayType({
        //   displayType: serverWidget.FieldDisplayType.ENTRY
        // });
        sublist.addField({ 
          id: 'custpage_result_fileid', 
          type: 'text', 
          label: 'File ID' 
        });
        sublist.addField({
          id: 'custpage_result_filename',
          type: 'text',
          label: 'Filename'
        });
        sublist.addField({
          id: 'custpage_result_url',
          type: 'text',
          label: 'Preview'
        });

        results.forEach(function(result, index) {
          sublist.setSublistValue({
            id: 'custpage_result_folderid',
            line: index,
            value: result.id
          });
          sublist.setSublistValue({
            id: 'custpage_result_fileid',
            line: index,
            value: result.fileid
          });
          sublist.setSublistValue({
            id: 'custpage_result_filename',
            line: index,
            value: result.filename
          });
          sublist.setSublistValue({
            id: 'custpage_result_url',
            line: index,
            value: '<a href="' + result.url + '" target="_blank">Preview</a>'
          });
        });

      } else {
        form.addField({
          id: 'custpage_message',
          type: serverWidget.FieldType.INLINEHTML,
          label: ' '
        }).defaultValue = 'There are currently no MAP Agreements to attach.';
      }

      return form;
    }

    return {
      onRequest: onRequest
    };
  });