/**
 * getOnlineSalesByRegion.js
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/search', 'N/ui/serverWidget', 'N/log', './utils'],
  (search, serverWidget, log, utils) => {

    const execute = (form, start, end, newStart, newEnd) => {
      const westernID = 'customsearch_sp_ol_sales_by_reg_west';
      const centralID = 'customsearch_sp_ol_sales_by_reg_central';
      const easternID = 'customsearch_sp_ol_sales_by_reg_east';
      const westernData = getTransactionSearchResults(westernID, 'Western', start, end, newStart, newEnd);
      const centralData = getTransactionSearchResults(centralID, 'Central', start, end, newStart, newEnd);
      const easternData = getTransactionSearchResults(easternID, 'Eastern', start, end, newStart, newEnd);
      // combine
      const data = {};
      data.results = westernData.results.concat(centralData.results).concat(easternData.results);
      // totals
      let totalAmount = 0;
      let totalOrderCount = 0;
      let lastSalesTotal = 0;
      let lastTotalOrderCount = 0;
      let currentSalesTotal = 0;
      let currentTotalOrderCount = 0;
      data.results.forEach(result => {
        totalAmount += result.amount;
        totalOrderCount += result.orderCount;
        lastSalesTotal += result.lastSales;
        lastTotalOrderCount += result.lastOrderCount;
        currentSalesTotal += result.currentSales;
        currentTotalOrderCount += result.currentOrderCount;
      });

      const totalsRow = {
        region: '<b>TOTAL</b>',
        amount: totalAmount,
        orderCount: totalOrderCount,
        avgOrderAmount: utils.getAvg(totalAmount, totalOrderCount),
        salesGrowth: utils.getSalesGrowth(lastSalesTotal, currentSalesTotal),
        lastSales: lastSalesTotal,
        currentSales: currentSalesTotal,
        lastOrderCount: lastTotalOrderCount,
        currentOrderCount: currentTotalOrderCount,
        lastAvgOrderAmount: utils.getAvg(lastSalesTotal, lastTotalOrderCount),
        currentAvgOrderAmount: utils.getAvg(currentSalesTotal, currentTotalOrderCount)
      }
      // push totals
      data.results.push(totalsRow);
      
      return createSublist(form, data, 'online_sales');
    }

    const getTransactionSearchResults = (searchID, region, start, end, newStart, newEnd) => {

      // load search
      const transactionSearch = search.load({
        id: searchID
      });

      // create columns
      // current sales - date range = supplied dates
      const currentSales = search.createColumn({
        name: 'formulacurrency2',
        label: 'currentSales',
        formula: "NVL(sum(CASE WHEN {trandate} BETWEEN to_date('" + start + "', 'MM/DD/YYYY') AND to_date('" + end + "', 'MM/DD/YYYY') THEN {amount} END),0)",
        summary: search.Summary.MAX
      });
      // last sales - date range = days between supplied dates - start day and end day
      const lastSales = search.createColumn({
        name: 'formulacurrency1',
        label: 'lastSales',
        formula: "NVL(sum(CASE WHEN {trandate} BETWEEN to_date('" + newStart + "', 'MM/DD/YYYY') AND to_date('" + newEnd + "', 'MM/DD/YYYY') THEN {amount} END),0)",
        summary: search.Summary.MAX
      });
      // current sales count - date range = supplied dates
      const currentOrderCount = search.createColumn({
        name: 'formulanumeric2',
        label: 'currentOrderCount',
        formula: "NVL(sum(CASE WHEN {trandate} BETWEEN to_date('" + start + "', 'MM/DD/YYYY') AND to_date('" + end + "', 'MM/DD/YYYY') THEN 1 ELSE 0 END),0)",
        summary: search.Summary.MAX
      });
      // last order count - date range = days between supplied dates - start day and end day
      const lastOrderCount = search.createColumn({
        name: 'formulanumeric1',
        label: 'lastOrderCount',
        formula: "NVL(sum(CASE WHEN {trandate} BETWEEN to_date('" + newStart + "', 'MM/DD/YYYY') AND to_date('" + newEnd + "', 'MM/DD/YYYY') THEN 1 ELSE 0 END),0)",
        summary: search.Summary.MAX
      });

      // add columns to existing columns
      const transactionSearchColumns = transactionSearch.columns;
      transactionSearchColumns.push(lastSales);
      transactionSearchColumns.push(currentSales);
      transactionSearchColumns.push(lastOrderCount);
      transactionSearchColumns.push(currentOrderCount);

      // create filters
      const startDate = search.createFilter({
        name: 'trandate',
        operator: search.Operator.ONORAFTER,
        values: [newStart]
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
      pagedData.pageRanges.forEach(pageRange => {

        const page = pagedData.fetch({ index: pageRange.index });

        page.data.forEach(result => {

          log.debug({
            title: 'ONLINE SALES BY' + region.toUpperCase() + 'REGION RESULT',
            details: result
          });

          const totalSales = parseFloat(result.getValue({ name: 'amount', summary: search.Summary.SUM }));
          const totalAvgOrderAmount = parseFloat(result.getValue({ name: 'formulacurrency', summary: search.Summary.MAX }));
          const lastSales = parseFloat(result.getValue({ name: 'formulacurrency1', summary: search.Summary.MAX }));
          const currentSales = parseFloat(result.getValue({ name: 'formulacurrency2', summary: search.Summary.MAX }));
          const lastOrderCount = parseInt(result.getValue({ name: 'formulanumeric1', summary: search.Summary.MAX }));
          const currentOrderCount = parseInt(result.getValue({ name: 'formulanumeric2', summary: search.Summary.MAX }));

          const row = {
            region: region,
            amount: totalSales,
            orderCount: result.getValue({ name: 'internalid', summary: search.Summary.COUNT }),
            avgOrderAmount: totalAvgOrderAmount,
            salesGrowth: utils.getSalesGrowth(lastSales, currentSales),
            lastSales: lastSales,
            currentSales: currentSales,
            lastOrderCount,
            currentOrderCount,
            lastAvgOrderAmount: utils.getAvg(lastSales, lastOrderCount),
            currentAvgOrderAmount: utils.getAvg(currentSales, currentOrderCount)
          };
          // push row
          transactionResults.push(row);
        });
      });

      return {
        results: transactionResults
      };

    }

    const createSublist = (form, data, widgetName) => {
      const sublist = form.addSublist({
        id: 'custpage_' + widgetName + '_sublist',
        type: serverWidget.SublistType.LIST,
        label: 'Online $ by Region'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_online_region',
        type: serverWidget.FieldType.TEXT,
        label: 'Online Region'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_prev_sales',
        type: serverWidget.FieldType.TEXT,
        label: 'Previous Sales'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_prev_order_count',
        type: serverWidget.FieldType.TEXT,
        label: 'Previous Order Count'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_prev_avg_order_amount',
        type: serverWidget.FieldType.TEXT,
        label: 'Previous Avg Order Amount'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_current_sales',
        type: serverWidget.FieldType.TEXT,
        label: 'Current Sales'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_current_order_count',
        type: serverWidget.FieldType.TEXT,
        label: 'Current Order Count'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_current_avg_order_amount',
        type: serverWidget.FieldType.TEXT,
        label: 'Current Avg Order Amount'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_sales_growth',
        type: serverWidget.FieldType.TEXT,
        label: 'Sales Growth'
      });

      for (let i = 0; i < data.results.length; i++) {
        let result = data.results[i];

        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_online_region',
          line: i,
          value: result.region
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_prev_sales',
          line: i,
          value: utils.formatNumber(utils.round(result.lastSales, 2))
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_prev_order_count',
          line: i,
          value: result.lastOrderCount
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_prev_avg_order_amount',
          line: i,
          value: utils.formatNumber(utils.round(result.lastAvgOrderAmount, 2))
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_current_sales',
          line: i,
          value: utils.formatNumber(utils.round(result.currentSales, 2))
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_current_order_count',
          line: i,
          value: result.currentOrderCount
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_current_avg_order_amount',
          line: i,
          value: utils.formatNumber(utils.round(result.currentAvgOrderAmount, 2))
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_sales_growth',
          line: i,
          value: result.salesGrowth
        });
      }

      return form;

    } 

    return {
      _create: execute
    }
  });