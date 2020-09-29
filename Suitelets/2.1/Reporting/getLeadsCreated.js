/**
 * getLeadsCreated.js
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/search', 'N/ui/serverWidget', 'N/log'],
  (search, serverWidget, log) => {

    const execute = (form, start, end) => {
      const data = getCustomerSearchResults(start, end);
      return createSublist(form, data, 'leads_created');
    }

    const getCustomerSearchResults = (start, end) => {

      // load search
      const customerSearch = search.load({
        id: 'customsearch_sp_leads_created'
      });

      // create filters
      const startDate = search.createFilter({
        name: 'datecreated',
        operator: search.Operator.ONORAFTER,
        values: [start]
      });
      const endDate = search.createFilter({
        name: 'datecreated',
        operator: search.Operator.ONORBEFORE,
        values: [end]
      });
      // add filters to existing filters
      const customerSearchFilters = customerSearch.filters;
      customerSearchFilters.push(startDate);
      customerSearchFilters.push(endDate);

      const pagedData = customerSearch.runPaged({
        pageSize: 1000
      });

      const customerResults = [];
      let totalLeads = 0;
      pagedData.pageRanges.forEach(pageRange => {

        const page = pagedData.fetch({ index: pageRange.index });

        page.data.forEach(result => {

          log.debug({
            title: 'LEADS CREATED RESULT',
            details: result
          });

          const leadsCreated = result.getValue({ name: 'entityid', summary: search.Summary.COUNT });

          const row = {
            createdBy: result.getText({ name: 'name', join: 'systemnotes', summary: search.Summary.GROUP }),
            leadsCreated
          };
          // push row
          customerResults.push(row);
          
          // totals
          totalLeads += parseInt(leadsCreated);

        });
      });

      const totalsRow = {
        createdBy: '<b>TOTAL</b>',
        leadsCreated: '<b>' + totalLeads + '</b>'
      }
      // push row
      customerResults.push(totalsRow);

      return {
        results: customerResults
      };

    }

    const createSublist = (form, data, widgetName) => {
      const sublist = form.addSublist({
        id: 'custpage_' + widgetName + '_sublist',
        type: serverWidget.SublistType.LIST,
        label: 'Leads'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_created_by',
        type: serverWidget.FieldType.TEXT,
        label: 'Created By'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_leads_created',
        type: serverWidget.FieldType.TEXT,
        label: 'Entered / Created'
      });

      for (let i = 0; i < data.results.length; i++) {
        let result = data.results[i];

        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_created_by',
          line: i,
          value: result.createdBy
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_leads_created',
          line: i,
          value: result.leadsCreated
        });
      }

      return form;

    } 

    return {
      _create: execute
    }
  });