/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log'],
  function (currentRecord, dialog, log) {

    /**
     * Log script loaded
     */
    function pageInit() {
      // todo
      console.log('Client Script Loaded');
    }

    /**
     * Sets / Updates the total tax and refund total to match the attached
     * Cash Sale and or Sales Orders. NetSuite & Shopify / FarApp have different
     * tax rates. Sometimes these tax rates don't match. FarApp overwrites the
     * transaction tax rate and uses w/e Shopify sent. During a Cash Refund 
     * sometimes the orders don't match because NetSuite will re-calculate this
     * tax rate. This is a problem.
     */
    function setTax() {
      var cashRefund = currentRecord.get();
      var isTaxable = cashRefund.getValue('custbody_sp_customer_is_taxable');
      var total = cashRefund.getValue('total');
      var totalTax = cashRefund.getValue('taxTotal');

      if (isTaxable) {
        // get FarApp Data -- this is usually the problem
        var faData = JSON.parse(cashRefund.getValue('custbody_fa_order_total'));
        var faTotal = faData.orderTotal;
        var faTaxTotal = 0;

        log.debug({
          title: 'CURRENT VALUES',
          details: 'isTaxable: ' + isTaxable + ' | totalTax: ' + totalTax + ' | total: ' + total
        });

        // set tax total if it exists
        if (faData.taxTotal) { faTaxTotal = faData.taxTotal; }
        // update tax
        if (parseFloat(totalTax) != parseFloat(faTaxTotal)) {
          cashRefund.setValue({ fieldId: 'taxtotal', value: faTaxTotal });
        }
        // update total
        if (parseFloat(total) != parseFloat(faTotal)) {
          cashRefund.setValue({ fieldId: 'total', value: faTotal });
        }

        // display dialog
        dialog.alert({
          title: 'Tax / Total Updated',
          message: 'Please make sure the Cash Refund total matches the Cash Sale and or Sales Order attached before saving.'
        });
      } else {
        // not taxable, what are you doing :/
        dialog.alert({
          title: 'The Customer is not taxable',
          message: 'This Customer is not taxable, if you think this is an error please check the Customer Record.'
        });
      }
    }

    return {
      pageInit: pageInit,
      setTax: setTax
    };
  });