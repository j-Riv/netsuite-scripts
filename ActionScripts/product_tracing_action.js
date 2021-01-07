/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @NModuleScope public
 *
*/
define(['N/record'],
  record => {
    /**
     * Checks a box if requirements are met.
     * @param {Object} context 
     * @returns {boolean}
     */
    const addTracing = context => {
      const salesRecord = context.newRecord;
      const lines = salesRecord.getLineCount({ sublistId: 'item' });
      let quantity = 0;
      // reset
      salesRecord.setValue('custbody_sp_req_tracing', false);

      for (let i = 0; i < lines; i++) {
        const id = parseInt(salesRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_id', line: i }));

        if (id === 24867 || id === 24874) {
          quantity += parseInt(salesRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }));
        }

        if (id === 30154 || id === 30155) {
          quantity += parseInt(salesRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i })) * 12;
        }

        if (quantity >= 160) {
          salesRecord.setValue('custbody_sp_req_tracing', true);
        }
      }

      return salesRecord.getValue('custbody_sp_req_tracing');
    }
    return {
      onAction: addTracing
    }
  });