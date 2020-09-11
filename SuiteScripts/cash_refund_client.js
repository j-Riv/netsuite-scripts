/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log', 'N/runtime'],
  function (currentRecord, dialog, log, runtime) {

    /**
     * Log script loaded
     */
    function pageInit() {

      console.log('Client Script Loaded');

      var cashRefund = currentRecord.get();
      var isTaxable = cashRefund.getValue('custbody_sp_customer_is_taxable');
      var totalTax = cashRefund.getValue('taxtotal');
      var faData = cashRefund.getValue('custbody_fa_order_total');

      if (faData) {
        faData = JSON.parse(faData);
        // If the Customer is Taxable & FarApp Order Data exist show the dialog
        if (typeof faData != 'undefined' && isTaxable && totalTax != '') {
          var faShipTaxRate = parseFloat(cashRefund.getValue('custbody_fa_shipping_tax'));
          var faShipTax = parseFloat(faData.shippingTax);
          var msg = 'This is an online order. ';

          if (!isNaN(faShipTaxRate) && faShipTax > 0) {
            msg += 'This order has a Shipping Tax Rate but no Tax Code. Please use the "Update Tax / Total" button before saving the record. ';
          }

          msg += 'If your processing a full refund, please make sure the Cash Refund total matches the Cash Sale ' +
            'and or Sales Order attached before saving. If it does not please use the "Update Tax / Total" button.';

          dialog.alert({
            title: 'TAXABLE ONLINE ORDER',
            message: msg
          });
        }
      }
    }

    /**
     * Sets / Updates the shipping tax code, shipping tax rate, total tax & 
     * refund total to match the attached Cash Sale & or Sales Order. NetSuite &
     * Shopify / FarApp calculate tax rates differently. Sometimes these tax rates
     * dont't match. FarAp overwrites the transaction tax rate and uses w/e Shopify
     * sent. During a Cash Refund sometimes the orders don't match because NetSuite
     * will re-calculate this tax rate. Other times it's because Shopify calculated
     * shipping tax while NetSuite did not. This is a problem
     */
    function updateRefund() {
      var cashRefund = currentRecord.get();
      var faOrder = cashRefund.getValue('custbody_fa_channel_order');
      var isTaxable = cashRefund.getValue('custbody_sp_customer_is_taxable');

      if (isTaxable) {
        var total = parseFloat(cashRefund.getValue('total'));
        var totalTax = parseFloat(cashRefund.getValue('taxtotal'));
        var discount = parseFloat(cashRefund.getValue('discounttotal'));
        // get FarApp Data
        var faData = cashRefund.getValue('custbody_fa_order_total');
        if (faData != '') {
          faData = JSON.parse(faData);
          var faShipTaxRate = parseFloat(cashRefund.getValue('custbody_fa_shipping_tax'));
          var faShipTax = parseFloat(faData.shippingTax);

          if (!isNaN(faShipTaxRate)) {
            if (parseFloat(cashRefund.getValue('shippingtax1rate')) != faShipTaxRate) {
              var taxCode = cashRefund.getSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: 0 });
              cashRefund.setValue({ fieldId: 'shippingtaxcode', value: taxCode, ignoreFieldChange: true });
              cashRefund.setValue({ fieldId: 'shippingtax1rate', value: faShipTaxRate });
              cashRefund.setValue({ fieldId: 'taxtotal', value: totalTax + faShipTax });
              var updatedTotal = (total + faShipTax) - discount;
              cashRefund.setValue({ fieldId: 'total', value: updatedTotal });
            }
            // log & display dialog
            logger(faOrder, total, updatedTotal, faShipTaxRate);
            dialog.alert({
              title: 'Tax / Total Updated',
              message: 'If your processing a full refund, please make sure the Cash Refund total matches the Cash Sale and or Sales Order attached before saving.'
            });
          } else {
            dialog.alert({
              title: 'No Shipping Tax Rate',
              message: 'FarApp did not provide a shipping tax rate for this order.'
            });
          }
        }

      } else {
        // not taxable, what are you doing :/
        dialog.alert({
          title: 'The Customer is not taxable',
          message: 'This Customer is not taxable, if you think this is an error please check the Customer Record.'
        });
      }
    }

    function logger(orderNumber, total, updatedTotal, shipTaxRate) {
      var currentUser = runtime.getCurrentUser();
      var details = 'USER: ' + currentUser.email + ' | ORDER: ' + orderNumber + ' | TOTAL: ' + total + 
        ' | UPDATED TOTAL: ' + updatedTotal + ' | SHIP TAX RATE: ' + shipTaxRate;
      console.log(details);
      log.debug({
        title: 'UPDATED ' + orderNumber,
        details: details
      });
    }

    return {
      pageInit: pageInit,
      updateRefund: updateRefund
    };
  });