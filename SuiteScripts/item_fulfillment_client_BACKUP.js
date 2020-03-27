/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log'],
  function (currentRecord, dialog, log) {
    // fedex expreess 2day
    // production: 30611
    // sandbox: 30588
    function pageInit() {
      // on page load
      console.log('FedEx Client Script Loaded');
      var itemFulfill = currentRecord.get();
      var status = itemFulfill.getValue('shipstatus');
      // check if fedex express 2day
      if (itemFulfill.getValue('shipmethod') == '30611') {
        try {
          // if status: picked
          if (status == 'A') {
            itemFulfill.setValue('shipstatus', 'B');
            itemFulfill.setValue('generateintegratedshipperlabel', true);
            dialog.alert({
              title: 'Ship Status Changed',
              message: 'Ship status has changed from Picked to PACKED. Please save record and press mark shipped. Then print label.'
            });
          }
          // if status: packed
          if (status == 'B') {
            itemFulfill.setValue('shipstatus', 'B');
            itemFulfill.setValue('generateintegratedshipperlabel', true);
            dialog.alert({
              title: 'Ship Status Changed',
              message: 'Please save record and press mark shipped. Then print label.'
            });
          }
        } catch (e) {
          console.log(e.message);
        }
      }
    }

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
        itemFulfill.setValue('shipstatus', 'B');
        itemFulfill.setValue('generateintegratedshipperlabel', true);

      } catch (e) {
        console.log(e.message);
      }
    }

    return {
      pageInit: pageInit,
      fedexExpress: fedexExpress
    };
  }); 