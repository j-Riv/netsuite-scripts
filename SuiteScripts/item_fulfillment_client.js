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
     * Ex:
     * - Sets Saturday delivery if ship day is Thursday.
     * - Sets ship date as next business day if shipping on a Saturday or after 4:45pm.
     */
    function pageInit() {
      // on page load
      console.log('FedEx Client Script Loaded');
      var itemFulfill = currentRecord.get();
      var status = itemFulfill.getValue('shipstatus');
      // check if fedex express 2day
      if (itemFulfill.getValue('shipmethod') == '30611') {
        var isShipNextDay = '';
        var shipDay;
        // check day
        var date = new Date();
        var day = date.getDay();
        var hour = date.getHours();
        var minutes = date.getMinutes();
        console.log('Day: ' + day + ' | Hour: ' + hour);
        try {
          // if status picked or packed
          if (status == 'A' || status == 'B') {
            itemFulfill.setValue('shipstatus', 'C');
            itemFulfill.setValue('generateintegratedshipperlabel', true);
            // if thursday set saturday delivery
            if (day == '4') {
              itemFulfill.setValue('saturdaydeliveryfedex', true);
              var msg = 'Saturday Delivery has been selected and the status has changed to SHIPPED.';
            } else if (day == '6') {
              shipDay = shipNextDay(true);
              isShipNextDay = ' Since it\'s a Saturday, the ship date has been changed automatically to: ' + shipDay + ' Make sure it\'s correct.';
            } else {
              if (hour >= '16' && minutes >= '45') {
                shipDay = shipNextDay(true);
                isShipNextDay = ' It\'s after 4:45 PM the ship date has been changed automatically to: ' + shipDay + ' Make sure it\'s correct.';
              }
              var msg = 'Status has changed to SHIPPED.';
            }

            dialog.alert({
              title: 'Ship Status Changed',
              message: msg + isShipNextDay + ' Please save and print the label.'
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
      // check day
      var date = new Date();
      var day = date.getDay();
      console.log('Day: ' + day);

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

    /**
     * Changes the carrier settings for next day shipping, based on the next business day.
     */
    function shipNextDay(hideDialog) {
      console.log('Next Day Shipping has been selected');
      console.log('FedEx Client Script Loaded');
      var itemFulfill = currentRecord.get();
      // check if fedex express 2day
      if (itemFulfill.getValue('shipmethod') == '30611') {
        try {
          var today = new Date();
          var shipDay = new Date(today);
          var daysToAdd;
          var day = shipDay.getDay();
          if (day == 5) {
            daysToAdd = 3;
          } else if (day == 6) {
            daysToAdd = 2;
          } else {
            daysToAdd = 1;
          }

          shipDay.setDate(shipDay.getDate() + daysToAdd);
          shipDay.setHours(0);
          shipDay.setMinutes(0);
          shipDay.setSeconds(0);
          itemFulfill.setValue('shipdatefedex', shipDay);

          if (!hideDialog) {
            dialog.alert({
              title: 'Ship Date Changed',
              message: 'The ship date has been changed to: ' + shipDay + ' Please make sure it\'s correct and save.'
            });
          }
          return shipDay;
        } catch (e) {
          console.log(e.message);
        }
      } else {
        dialog.alert({
          title: 'Error:',
          message: 'In order to change the ship date you must first select FedEx 2Day Express as the ship method.'
        });
      }
    }

    return {
      pageInit: pageInit,
      fedexExpress: fedexExpress,
      shipNextDay: shipNextDay
    };
  }); 