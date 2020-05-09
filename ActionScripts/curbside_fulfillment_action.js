/**
*
@NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 * @NModuleScope public
 *
*/

define(['N/email', 'N/render'], function(email, render) {
    /**
     * Workflow action script that generates an email 
     * based on a NetSuite Email Template when the 
     * item fulfillment has been shipped and shipping method 
     * is either 'In Store Pickup' or 'Curbside Pickup'.
     * @param {object} context - the item fulfillment record
     */
    function sendEmail(context) {
        var curbsidePickup = '31171';
        var inStorePickup = '22004';
        var itemFulfill = context.newRecord;
        var shipMethod = itemFulfill.getValue('shipmethod');
        var customer = itemFulfill.getValue('entity');
        var shipStatus = itemFulfill.getValue('shipstatus');
  
        // curbside
        if (shipMethod == curbsidePickup || shipMethod == inStorePickup) {
            if (shipStatus == 'C') {
                var mergeResult = render.mergeEmail({
                        templateId: 124,
                        entity: null,
                        recipient: null,
                        supportCaseId: null, 
                        transactionId: itemFulfill.id,
                        customRecord: null
                    });

                var emailSubject = 'Curbside Pickup Order: ' + itemFulfill.getValue('custbody_sp_order_number'); 
                var emailBody = mergeResult.body; 
                var timeStamp = new Date().getUTCMilliseconds();
        
                email.send({
                    author: 264,
                    recipients: customer,
                    replyTo: 'store@suavecito.com',
                    bcc: [207],
                    subject: emailSubject,
                    body: emailBody,
                    transactionId: itemFulfill.id
                });   
            }
        }
        return true; 
    }

    return {
        onAction: sendEmail
    }
}); 
