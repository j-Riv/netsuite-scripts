/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log'],
  function (currentRecord, dialog, log) {
    // fedex expreess 2day
    // production: 30611 | Sandbox: 30588
    /**
     * On page load it checks the item fulfillment ship method
     * if method is FedEx 2 Day Express then it checks the status,
     * depending on the status it automatically selects the 
     * appropriate fields.
     */
    function pageInit() {
      // on page load
      console.log('FedEx Client Script Loaded');
      var itemFulfill = currentRecord.get();
      var status = itemFulfill.getValue('shipstatus');
      // check if fedex express 2day
      if (itemFulfill.getValue('shipmethod') == '30611') {
        // check day
        var date = new Date();
        var day = date.getDay();
        console.log('Day: ' + day);
        try {
          // if status picked or packed
          if (status == 'A' || status == 'B') {
            itemFulfill.setValue('shipstatus', 'C');
            itemFulfill.setValue('generateintegratedshipperlabel', true);
            // if thursday set saturday delivery
            if (day == '4') {
              itemFulfill.setValue('saturdaydeliveryfedex', true);
              var msg = 'Saturday Delivery has been selected and the status has changed to SHIPPED. Please print the label.';
            } else {
              var msg = 'Status has changed to SHIPPED. Please print the label.';
            }
            dialog.alert({
              title: 'Ship Status Changed',
              message: msg
            });
          }
        } catch (e) {
          console.log(e.message);
        }
      }
    }

    /**
     * Automates the manual process of selecting FedEx 2 Day Express
     */
    function fedexExpress() {
      console.log('FedEx Express button selected');
      var itemFulfill = currentRecord.get();
      console.log(itemFulfill);

      try {
        // change shipment method -- reloads
        var shipmethod = itemFulfill.getValue('shipmethod');
        console.log('Ship method');
        console.log(shipmethod);
        if (shipmethod != '30611') {
          itemFulfill.setValue('shipmethod', '30611');
        }
      } catch (e) {
        console.log(e.message);
      }
    }

    return {
      pageInit: pageInit,
      fedexExpress: fedexExpress
    };
  }); 