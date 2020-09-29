/**
 * getSalesRepQuoteConversion.js
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/search', 'N/ui/serverWidget', 'N/log', './utils'],
  (search, serverWidget, log, utils) => {

    const execute = (form, start, end) => {
      const data = getTransactionSearchResults(start, end);
      return createSublist(form, data, 'quote_conversion');
    }

    const getTransactionSearchResults = (start, end) => {

      // load search
      const transactionSearch = search.load({
        id: 'customsearch_sp_rep_quote_conv_rate'
      });

      // create filters
      const startDate = search.createFilter({
        name: 'trandate',
        operator: search.Operator.ONORAFTER,
        values: [start]
      });
      const endDate = search.createFilter({
        name: 'trandate',
        operator: search.Operator.ONORBEFORE,
        values: [end]
      });
      // add filters to existing filters
      const transactionSearchFilters = transactionSearch.filters;
      transactionSearchFilters.push(startDate);
      transactionSearchFilters.push(endDate);

      const pagedData = transactionSearch.runPaged({
        pageSize: 1000
      });

      const transactionResults = [];
      let totalQuoteCount = 0;
      let totalConvertedQuotes = 0;
      let totalAmount = 0;
      pagedData.pageRanges.forEach(pageRange => {

        const page = pagedData.fetch({ index: pageRange.index });

        page.data.forEach(result => {

          log.debug({
            title: 'RESULT',
            details: result
          });
          
          const totalQuotes = parseInt(result.getValue({ name: 'tranid', summary: search.Summary.COUNT }));
          const convertedQuotes = parseInt(result.getValue({ name: 'formulanumeric', summary: search.Summary.SUM }));
          const amount = parseFloat(result.getValue({ name: 'amount', summary: search.Summary.SUM }));

          const row = {
            salesRep: result.getText({ name: 'salesrep', summary: search.Summary.GROUP }),
            totalQuotes,
            convertedQuotes,
            conversionRate: utils.round(parseFloat(result.getValue({ name: 'formulapercent', summary: search.Summary.MAX })), 2) + '%',
            amount: utils.formatNumber(utils.round(amount, 2))
          };
          // push row
          transactionResults.push(row);
          // totals
          totalQuoteCount += totalQuotes;
          totalConvertedQuotes += convertedQuotes;
          totalAmount += amount;
        });
      });

      const totalConversionRate = totalQuoteCount > 0
        ? utils.round((totalConvertedQuotes / totalQuoteCount) * 100, 2)
        : 0;

      const totalsRow = {
        salesRep: '<b>TOTAL</b>',
        totalQuotes: '<b>' + totalQuoteCount + '</b>',
        convertedQuotes: '<b>' + totalConvertedQuotes + '</b>',
        conversionRate: '<b>' +  totalConversionRate +'%</b>',
        amount: '<b>' + utils.formatNumber(utils.round(totalAmount, 2)) + '</b>'
      }
      // push totals
      transactionResults.push(totalsRow);

      return {
        results: transactionResults
      };

    }

    const createSublist = (form, data, widgetName) => {
      const sublist = form.addSublist({
        id: 'custpage_' + widgetName + '_sublist',
        type: serverWidget.SublistType.LIST,
        label: 'Quote Conversion'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_sales_rep',
        type: serverWidget.FieldType.TEXT,
        label: 'Sales Rep'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_total_quotes',
        type: serverWidget.FieldType.TEXT,
        label: 'Total Quotes'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_converted_quotes',
        type: serverWidget.FieldType.TEXT,
        label: 'Converted Quotes'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_conversion_percentage',
        type: serverWidget.FieldType.TEXT,
        label: 'Conversion %'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_total_sales',
        type: serverWidget.FieldType.TEXT,
        label: 'Total $'
      });

      for (let i = 0; i < data.results.length; i++) {
        let result = data.results[i];

        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_sales_rep',
          line: i,
          value: result.salesRep
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_total_quotes',
          line: i,
          value: result.totalQuotes
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_converted_quotes',
          line: i,
          value: result.convertedQuotes
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_conversion_percentage',
          line: i,
          value: result.conversionRate
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_total_sales',
          line: i,
          value: result.amount
        });
      }

      return form;

    } 

    return {
      _create: execute
    }
  });