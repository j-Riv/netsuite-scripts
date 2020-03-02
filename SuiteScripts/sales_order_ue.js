/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log'], function (record, log) {

  function beforeSubmit(context) {
    var currentRecord = context.newRecord;
    var marketplace = currentRecord.getValue({ fieldId: 'custbody_fa_channel' });
    if (marketplace !== '') {
      var salesRep;
      if (marketplace == 'Shopify') {
        // salesRep = 'Online Store';
        salesRep = 73559;
      }
      if (marketplace == 'Shopify-WholesaleShopify') {
        // salesRep = 'Partner Store';
        salesRep = 73560;
      }
      if (marketplace.includes('Amazon')) {
        // salesRep = 'Amazon Store';
        salesRep = 73562;
      }
      if (marketplace == 'eBay') {
        // salesRep = 'eBay Store';
        salesRep = 73561;
      }
      // set sales rep
      currentRecord.setValue({ fieldId: 'salesrep', value: salesRep });
    }
  }

  return {
    beforeSubmit: beforeSubmit
  }
});