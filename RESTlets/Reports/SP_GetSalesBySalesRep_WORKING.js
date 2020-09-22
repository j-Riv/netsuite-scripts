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
      // add filter
      const startDate = search.createFilter({
        name: 'trandate',
        operator: search.Operator.ONORAFTER,
        values: ['8/31/2020']
        // values: [context.start]
      });
      const endDate  = search.createFilter({
        name: 'trandate',
        operator: search.Operator.ONORBEFORE,
        values: ['9/4/2020']
        // values: [context.end]
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
            avgOrderAmount: result.getValue({ name: 'formulacurrency', summary: search.Summary.MAX })
          });
        });
      });

      log.debug({
        title: 'TRANSACTION RESULTS',
        details: JSON.stringify(transactionResults)
      });

      return transactionResults;

    }

    return {
      post: post
    };
  });