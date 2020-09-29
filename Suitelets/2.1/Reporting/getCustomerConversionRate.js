/**
 * getCustomerConversionRate.js
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/search', 'N/ui/serverWidget', 'N/log', './utils'],
  (search, serverWidget, log, utils) => {

    const execute = (form, start, end) => {
      const data = getCustomerSearchResults(start, end);
      return createSublist(form, data, 'customer_conversion');
    }

    const getCustomerSearchResults = (start, end) => {

      // load search
      const customerSearch = search.load({
        id: 'customsearch_sp_cust_conversion_rate'
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
      let totalAllLeads = 0;
      let totalAllConvertedLeads = 0;
      let totalAllAvgDaysToClose = 0;
      pagedData.pageRanges.forEach(pageRange => {

        const page = pagedData.fetch({ index: pageRange.index });

        page.data.forEach(result => {

          log.debug({
            title: 'GET CUSTOMER CONVERSION RESULT',
            details: result
          });

          const totalLeads = parseInt(result.getValue({ name: 'formulanumeric', summary: search.Summary.COUNT }));
          const convertedLeads = parseInt(result.getValue({ name: 'formulanumeric', summary: search.Summary.SUM }));
          const avgDaysToClose = parseFloat(result.getValue({ name: 'formulanumeric', summary: search.Summary.AVG }));

          const row = {
            salesRep: result.getText({ name: 'salesrep', summary: search.Summary.GROUP }),
            totalLeads,
            convertedLeads,
            conversionRate: result.getValue({ name: 'formulapercent', summary: search.Summary.MAX }),
            avgDaysToClose
          };
          // push row
          customerResults.push(row);
          
          // totals
          totalAllLeads += totalLeads;
          totalAllConvertedLeads += convertedLeads;
          totalAllAvgDaysToClose += avgDaysToClose;
        });
      });

      const totalAllConversionRate = totalAllConvertedLeads > 0 
        ? utils.round((totalAllConvertedLeads / totalAllLeads) * 100, 2)
        : '0.0';

      const totalAvgDaysToClose = customerResults.length > 0
        ? utils.round(totalAllAvgDaysToClose / customerResults.length, 2)
        : '0.0';

      const totalsRow = {
        salesRep: '<b>TOTAL</b>',
        totalLeads: '<b>' + totalAllLeads + '</b>',
        convertedLeads: '<b>' + totalAllConvertedLeads + '</b>',
        conversionRate: '<b>' + totalAllConversionRate + '%</b>',
        avgDaysToClose: '<b>' + totalAvgDaysToClose + '</b>'
      }
      // push totals
      customerResults.push(totalsRow);

      return {
        results: customerResults
      };

    }

    const createSublist = (form, data, widgetName) => {
      const sublist = form.addSublist({
        id: 'custpage_' + widgetName + '_sublist',
        type: serverWidget.SublistType.LIST,
        label: 'Customer Conversion'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_sales_rep',
        type: serverWidget.FieldType.TEXT,
        label: 'Assigned Sales Rep'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_num_of_leads',
        type: serverWidget.FieldType.TEXT,
        label: '# of Leads'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_converted_customers',
        type: serverWidget.FieldType.TEXT,
        label: 'Leads Converted'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_conversion_rate',
        type: serverWidget.FieldType.TEXT,
        label: 'Conversion Rate'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_avg_days_to_close',
        type: serverWidget.FieldType.TEXT,
        label: 'Avg Days to Close'
      });

      for (let i = 0; i < data.results.length; i++) {
        let result = data.results[i];

        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_sales_rep',
          line: i,
          value: result.salesRep
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_num_of_leads',
          line: i,
          value: result.totalLeads
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_converted_customers',
          line: i,
          value: result.convertedLeads
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_conversion_rate',
          line: i,
          value: result.conversionRate
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_avg_days_to_close',
          line: i,
          value: result.avgDaysToClose
        });
      }

      return form;

    } 

    return {
      _create: execute
    }
  });