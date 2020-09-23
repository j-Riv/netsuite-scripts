/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/runtime', 'N/record', 'N/search', 'N/error'],
  function (runtime, record, search, error) {
    /**
     * Executes the Search and returns the data.
     * @param {Object} context - The Post Body
     */
    const post = context => {
      log.debug({
        title: 'THE POST BODY',
        details: 'Start Date: ' + context.start + ' | End Date: ' + context.end
      });
      // load search
      const searchID = runtime.getCurrentScript().getParameter('custscript_get_sales_sales_rep_search');
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
      // sales growth = current sales - last sales / last sales
      const salesGrowth = search.createColumn({
        name: 'formulapercent',
        // formula: "NVL(sum(CASE WHEN {trandate} BETWEEN to_date('8/31/2020', 'MM/DD/YYYY') AND to_date('9/4/2020', 'MM/DD/YYYY') THEN {amount} END),0)",
        formula: "((NVL(sum(CASE WHEN {trandate} BETWEEN to_date('" + start + "', 'MM/DD/YYYY') AND to_date('" + end + "', 'MM/DD/YYYY') THEN {amount} END),0) - " +
          "NVL(sum(CASE WHEN {trandate} BETWEEN to_date('" + newStart + "', 'MM/DD/YYYY') AND to_date('" + newEnd + "', 'MM/DD/YYYY') THEN {amount} END),0)) / " +
          "NVL(sum(CASE WHEN {trandate} BETWEEN to_date('" + newStart + "', 'MM/DD/YYYY') AND to_date('" + newEnd + "', 'MM/DD/YYYY') THEN {amount} END),1))",
        summary: search.Summary.MAX
      });
      // add columns to existing columns
      const transactionSearchColumns = transactionSearch.columns;
      transactionSearchColumns.push(lastSales);
      transactionSearchColumns.push(currentSales);
      transactionSearchColumns.push(lastOrderCount);
      transactionSearchColumns.push(currentOrderCount);
      transactionSearchColumns.push(salesGrowth);

      // create filters
      const startDate = search.createFilter({
        name: 'trandate',
        operator: search.Operator.ONORAFTER,
        values: [newStart]
      });
      const endDate  = search.createFilter({
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
            title: 'RESULT',
            details: JSON.stringify(result)
          });

          const lastSales = result.getValue({ name: 'formulacurrency1', summary: search.Summary.MAX });
          const currentSales = result.getValue({ name: 'formulacurrency2', summary: search.Summary.MAX });
          const lastOrderCount = result.getValue({ name: 'formulanumeric1', summary: search.Summary.MAX });
          const currentOrderCount = result.getValue({ name: 'formulanumeric2', summary: search.Summary.MAX });

          transactionResults.push({
            salesRep: result.getText({ name: 'salesrep', summary: search.Summary.GROUP }),
            amount: result.getValue({ name: 'amount', summary: search.Summary.SUM }),
            orderCount: result.getValue({ name: 'internalid', summary: search.Summary.COUNT }),
            avgOrderAmount: result.getValue({ name: 'formulacurrency', summary: search.Summary.MAX }),
            salesGrowth: result.getValue({ name: 'formulapercent', summary: search.Summary.MAX }),
            lastSales,
            currentSales,
            lastOrderCount,
            currentOrderCount,
            lastAvgOrderAmount: getAvg(lastSales,lastOrderCount),
            currentAvgOrderAmount: getAvg(currentSales,currentOrderCount)
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

    /**
     * Calculates the date difference between 2 dates and 
     * returns 2 new dates.
     * @param {string} start - The start date
     * @param {string} end - The end date
     * @returns {Object}
     */
    const dateDiff = (start, end) => {
      const date1 = new Date(start);
      const date2 = new Date(end);
      const diffTime = date2.getTime() - date1.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24) + 1;

      return {
        newStart: formatDate(new Date(date1.setDate(date1.getDate() - diffDays))),
        newEnd: formatDate(new Date(date2.setDate(date2.getDate() - diffDays)))
      }

    }

    /**
     * Formats a date to MM/DD/YYYY.
     * @param {Object} date - The date object 
     * @returns {string} - Formatted date
     */
    const formatDate = date => {
      const m = date.getMonth() + 1;
      const d = date.getDate();
      const y = date.getFullYear();

      return m + '/' + d + '/' + y;
    }

    /**
     * Calculates the average.
     * @param {number} dividend 
     * @param {number} divisor
     * @returns {number} 
     */
    const getAvg = (dividend, divisor) => {
      dividend = parseFloat(dividend);
      divisor = parseFloat(divisor);
      if (divisor !== 0) {
        return round(dividend / divisor, 2);
      } else {
        return '0';
      }
    }

    /**
     * Rounds value to 2 decimals
     * @param {decimal} value - the value you want to round to
     * @param {integer} decimals - how many decimal places you want to round to 
     */
    const round = (value, decimals) => {
      return String(Number(Math.round(value + 'e' + decimals) + 'e-' + decimals));
    }

    return {
      post: post
    };
  });