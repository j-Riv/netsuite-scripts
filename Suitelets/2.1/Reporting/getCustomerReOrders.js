/**
 * getCustomerReOrders.js
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/search', 'N/ui/serverWidget', 'N/log', './utils'],
  (search, serverWidget, log, utils) => {

    const execute = (form, start, end) => {
      const data = getTransactionSearchResults(start, end);
      return createSublist(form, data, 'customer_reorder');
    }

    const getTransactionSearchResults = (start, end) => {

      // load search
      const transactionSearch = search.load({
        id: 'customsearch_sp_customer_re_orders'
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
      let totalOrderCount = 0;
      let totalsOrderAmount = 0;
      pagedData.pageRanges.forEach(pageRange => {

        const page = pagedData.fetch({ index: pageRange.index });

        page.data.forEach(result => {

          log.debug({
            title: 'CUSTOMER REORDER RESULT',
            details: result
          });

          const orderCount = result.getValue({ name: 'tranid', summary: search.Summary.COUNT });
          const avgAmount = parseFloat(result.getValue({ name: 'amount', summary: search.Summary.AVG }));
          const totalAmount = parseFloat(result.getValue({ name: 'amount', summary: search.Summary.SUM }));;

          const row = {
            salesRep: result.getText({ name: 'salesrep', summary: search.Summary.GROUP }),
            orderCount,
            avgAmount: utils.formatNumber(utils.round(avgAmount, 2)),
            totalAmount: utils.formatNumber(utils.round(totalAmount, 2))
          };
          // push row
          transactionResults.push(row);

          // totals
          totalOrderCount += parseInt(orderCount);
          totalsOrderAmount += totalAmount;
        });
      });

      const totalAvgOrderAmount = totalOrderCount > 0
        ? utils.formatNumber(utils.round(totalsOrderAmount / totalOrderCount, 2))
        : '$0.00';

      const totalsRow = {
        salesRep: '<b>TOTAL</b>',
        orderCount: '<b>' + totalOrderCount + '</b>',
        avgAmount: '<b>' + totalAvgOrderAmount + '</b>',
        totalAmount: '<b>' + utils.formatNumber(totalsOrderAmount) + '</b>'
      }
      // push row
      transactionResults.push(totalsRow);

      return {
        results: transactionResults
      };

    }

    const createSublist = (form, data, widgetName) => {
      const sublist = form.addSublist({
        id: 'custpage_' + widgetName + '_sublist',
        type: serverWidget.SublistType.LIST,
        label: 'Customer Retention'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_sales_rep',
        type: serverWidget.FieldType.TEXT,
        label: 'Sales Rep'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_num_of_orders',
        type: serverWidget.FieldType.TEXT,
        label: '# of Orders'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_avg_amount',
        type: serverWidget.FieldType.TEXT,
        label: 'Avg $$'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_total_amount',
        type: serverWidget.FieldType.TEXT,
        label: 'Total $$'
      });

      for (let i = 0; i < data.results.length; i++) {
        let result = data.results[i];

        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_sales_rep',
          line: i,
          value: result.salesRep
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_num_of_orders',
          line: i,
          value: result.orderCount
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_avg_amount',
          line: i,
          value: result.avgAmount
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_total_amount',
          line: i,
          value: result.totalAmount
        });
      }

      return form;

    }

    return {
      _create: execute
    }
  });