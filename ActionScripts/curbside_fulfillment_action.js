/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 * @NModuleScope public
 *
*/

define(['N/email', 'N/render'], 
  function (email, render) {
    /**
     * Sends an email whenever an item fulfillment with
     * shipping methods of Curbside Pickup, In Store Pickup
     * and Will Call are set to status shipped.
     * @param {Object} context
     * @returns {boolean} - true
     */
    function sendEmail(context) {
      // shipping methods
      var curbsidePickup = '31171';
      var inStorePickup = '22004';
      var willCall = '21989';

      var itemFulfill = context.newRecord;
      var shipMethod = itemFulfill.getValue('shipmethod');
      var customer = itemFulfill.getValue('entity');
      var shipStatus = itemFulfill.getValue('shipstatus');

      // curbside
      if (shipMethod == curbsidePickup || shipMethod == inStorePickup || shipMethod == willCall) {
        var method;
        var replyToEmail;
        var bccList;

        if (shipMethod == willCall) {
          method = 'Will Call ';
          replyToEmail = 'wholesale@suavecito.com';
          bccList = [207, 73560];
        } else {
          method = 'Curbside Pickup ';
          replyToEmail = 'store@suavecito.com';
          bccList = [207];
        }
        if (shipStatus == 'C') {
          var mergeResult = render.mergeEmail({
            templateId: 124,
            entity: null,
            recipient: null,
            supportCaseId: null,
            transactionId: itemFulfill.id,
            customRecord: null
          });

          var emailSubject = method + 'Order: ' + itemFulfill.getValue('custbody_sp_order_number');
          var emailBody = mergeResult.body;
          var timeStamp = new Date().getUTCMilliseconds();

          email.send({
            author: 264,
            recipients: customer,
            replyTo: replyToEmail,
            bcc: bccList,
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
  }
); 
 