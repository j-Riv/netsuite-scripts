/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/record', 'N/search', 'N/error'],
  function (record, search, error) {

    function post(context) {
      log.debug({
        title: 'THE POST BODY',
        details: 'Start Date: ' + context.start + ' | End Date: ' + context.end
      });
      // load search
      const searchID = 'customsearch_sp_sales_by_rep';
      const transactionSearch = search.load({
        id: searchID
      });

      // calculate dates
      const start = context.start;
      const end = context.end;
      const { newStart, newEnd } = dateDiff(start, end);

      log.debug({
        title: 'DATES',
        details: 'Start Date: ' + start + ' | End Date: ' + end + 'New Start Date: ' + newStart + ' | New End Date: ' + newEnd
      });

      // add column
      const currentSales = search.createColumn({
        name: 'formulacurrency2',
        label: 'currentSales',
        formula: "NVL(sum(CASE WHEN {trandate} BETWEEN to_date('" + start + "', 'MM/DD/YYYY') AND to_date('" + end + "', 'MM/DD/YYYY') THEN {amount} END),0)",
        summary: search.Summary.MAX
      });
      const lastSales = search.createColumn({
        name: 'formulacurrency1',
        label: 'lastSales',
        formula: "NVL(sum(CASE WHEN {trandate} BETWEEN to_date('" + newStart + "', 'MM/DD/YYYY') AND to_date('" + newEnd + "', 'MM/DD/YYYY') THEN {amount} END),0)",
        summary: search.Summary.MAX
      });
      const salesGrowth = search.createColumn({
        name: 'formulapercent',
        // formula: "NVL(sum(CASE WHEN {trandate} BETWEEN to_date('8/31/2020', 'MM/DD/YYYY') AND to_date('9/4/2020', 'MM/DD/YYYY') THEN {amount} END),0)",
        formula: "((NVL(sum(CASE WHEN {trandate} BETWEEN to_date('" + start + "', 'MM/DD/YYYY') AND to_date('" + end + "', 'MM/DD/YYYY') THEN {amount} END),0) - " +
          "NVL(sum(CASE WHEN {trandate} BETWEEN to_date('" + newStart + "', 'MM/DD/YYYY') AND to_date('" + newEnd + "', 'MM/DD/YYYY') THEN {amount} END),0)) / " +
          "NVL(sum(CASE WHEN {trandate} BETWEEN to_date('" + newStart + "', 'MM/DD/YYYY') AND to_date('" + newEnd + "', 'MM/DD/YYYY') THEN {amount} END),1))",
        summary: search.Summary.MAX
      });
      const transactionSearchColumns = transactionSearch.columns;
      transactionSearchColumns.push(lastSales);
      transactionSearchColumns.push(currentSales);
      transactionSearchColumns.push(salesGrowth);

      // add filter
      const startDate = search.createFilter({
        name: 'trandate',
        operator: search.Operator.ONORAFTER,
        // values: ['8/31/2020']
        values: [newStart]
      });
      const endDate  = search.createFilter({
        name: 'trandate',
        operator: search.Operator.ONORBEFORE,
        // values: ['9/4/2020']
        values: [end]
      });
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
            title: 'RESULT',
            details: JSON.stringify(result)
          });

          transactionResults.push({
            salesRep: result.getText({ name: 'salesrep', summary: search.Summary.GROUP }),
            amount: result.getValue({ name: 'amount', summary: search.Summary.SUM }),
            orderCount: result.getValue({ name: 'internalid', summary: search.Summary.COUNT }),
            avgOrderAmount: result.getValue({ name: 'formulacurrency', summary: search.Summary.MAX }),
            salesGrowth: result.getValue({ name: 'formulapercent', summary: search.Summary.MAX }),
            lastSales: result.getValue({ name: 'formulacurrency1', summary: search.Summary.MAX }),
            currentSales: result.getValue({ name: 'formulacurrency2', summary: search.Summary.MAX })
          });
        });
      });

      log.debug({
        title: 'TRANSACTION RESULTS',
        details: JSON.stringify(transactionResults)
      });

      return {
        lastDateRange: newStart + ' - ' + newEnd,
        currentDateRange: start + ' - ' + end,
        results: transactionResults
      };

    }

    function dateDiff(start, end) {
      const date1 = new Date(start);
      const date2 = new Date(end);
      const diffTime = date2.getTime() - date1.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24) + 1;

      return {
        newStart: formatDate(new Date(date1.setDate(date1.getDate() - diffDays))),
        newEnd: formatDate(new Date(date2.setDate(date2.getDate() - diffDays)))
      }

    }

    function formatDate(date) {
      const m = date.getMonth() + 1;
      const d = date.getDate();
      const y = date.getFullYear();

      return m + '/' + d + '/' + y;
    }

    return {
      post: post
    };
  });