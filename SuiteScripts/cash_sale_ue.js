/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log'], function (record, log) {

  function afterSubmit(context) {
    var giftCardId = 22021;
    log.debug({
      title: 'RUNNING CS AFTER SUBMIT',
      details: 'shit ran'
    });
    var currentRecord = context.newRecord;
    var lines = currentRecord.getLineCount({ sublistId: 'item' });
    log.debug({
      title: "LINES",
      details: lines,
    });
    for (var i = 0; i < lines; i++) {

      // currentRecord.selectLine({ sublistId: 'item', line: i });
      var itemInternalId = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
      if (parseInt(itemInternalId) == giftCardId) {
        var giftCardCode = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'giftcertnumber', line: i });

        if (giftCardCode == '') {
          var giftCardCode = 'shopify1';
          currentRecord.setSublistValue({ sublistId: 'item', fieldId: 'giftcertnumber', line: i, value: giftCardCode });
        }
      }
    }
  }

  return {
    beforeSubmit: afterSubmit
  }
});
