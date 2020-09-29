/**
 * getNewCustomerOrders.js
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/search', 'N/ui/serverWidget', 'N/log', './utils'],
  (search, serverWidget, log, utils) => {

    const execute = (form, start, end) => {
      const data = getCustomerSearchResults(start, end);
      return createSublist(form, data, 'new_customer_orders');
    }

    const getCustomerSearchResults = (start, end) => {

      // load search
      const customerSearch = search.load({
        id: 'customsearch_sp_new_customer_orders'
      });

      // create filters
      const startDate = search.createFilter({
        name: 'dateclosed',
        join: 'customer',
        operator: search.Operator.ONORAFTER,
        values: [start]
      });
      const endDate = search.createFilter({
        name: 'dateclosed',
        join: 'customer',
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
      let totalOrderCount = 0;
      let totalsOrderAmount = 0;
      pagedData.pageRanges.forEach(pageRange => {

        const page = pagedData.fetch({ index: pageRange.index });

        page.data.forEach(result => {

          log.debug({
            title: 'GET NEW CUSTOMER AVG ORDER RESULT',
            details: result
          });

          const orderCount = parseInt(result.getValue({ name: 'tranid', summary: search.Summary.COUNT }));
          const avgOrderAmount = parseFloat(result.getValue({ name: 'amount', summary: search.Summary.AVG }));
          const totalOrderAmount = parseFloat(result.getValue({ name: 'amount', summary: search.Summary.SUM }));

          const row = {
            salesRep: result.getText({ name: 'salesrep', summary: search.Summary.GROUP }),
            orderCount: orderCount,
            avgOrderAmount: utils.formatNumber(utils.round(avgOrderAmount, 2)),
            totalOrderAmount: utils.formatNumber(utils.round(totalOrderAmount, 2))
          };
          // push row
          customerResults.push(row);
          // totals
          totalOrderCount += orderCount;
          totalsOrderAmount += totalOrderAmount;

        });
      });

      const totalAvgOrderAmount = totalOrderCount > 0 
        ? utils.formatNumber(utils.round(totalsOrderAmount / totalOrderCount, 2))
        : '$0.00';

      const totalsRow = {
        salesRep: '<b>TOTAL</b>',
        orderCount: '<b>' + totalOrderCount + '</b>',
        avgOrderAmount: '<b>' + totalAvgOrderAmount + '</b>',
        totalOrderAmount: '<b>' + utils.formatNumber(utils.round(totalsOrderAmount, 2)) + '</b>'
      }
      // push
      customerResults.push(totalsRow);

      return {
        results: customerResults
      };

    }

    const createSublist = (form, data, widgetName) => {
      const sublist = form.addSublist({
        id: 'custpage_' + widgetName + '_sublist',
        type: serverWidget.SublistType.LIST,
        label: 'New Customer Orders'
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
        id: 'custpage_field_' + widgetName + '_avg_order_amount',
        type: serverWidget.FieldType.TEXT,
        label: 'Avg Order $'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_total_order_amount',
        type: serverWidget.FieldType.TEXT,
        label: 'Total Order $'
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
          id: 'custpage_field_' + widgetName + '_avg_order_amount',
          line: i,
          value: result.avgOrderAmount
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_total_order_amount',
          line: i,
          value: result.totalOrderAmount
        });
      }

      return form;

    } 

    return {
      _create: execute
    }
  });