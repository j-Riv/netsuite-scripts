/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/error'],
  function (currentRecord, dialog, error) {

    function pageInit(context) {
      // todo
      console.log('Client Script Loaded');
    }

    function fieldChanged(context) {
      var salesRecord = currentRecord.get();
      if (context.fieldId == 'shippingcost') {
        var shipMethod = salesRecord.getValue('shipmethod');
        if (salesRecord.getValue('custbody_fa_channel') == "") {
          // Amazon FBA (21719), In Store Pickup (22004), Will Call (21989)
          if (shipMethod !== 21719 || shipMethod !== 22004 || shipMethod !== 21989 ) {
            calculateHandling();
          }
        }
      }
    }

    /**
     * Rounds value to 2 decimals
     * @param {decimal} value - the value you want to round to
     * @param {integer} decimals - how many decimal places you want to round to 
     */
    function round(value, decimals) {
      return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }

    /**
     * Calculates handling for manual Sales Orders
     * @param {*} context - form
     */
    function calculateHandling() {
      var salesRecord = currentRecord.get();
      // check for marketplace
      if (salesRecord.getValue('custbody_fa_channel') == "") {
        // check for ship method returns ID
        var shipMethod = salesRecord.getValue('shipmethod');
        if (shipMethod !== '') {
          var shipState = salesRecord.getValue('shipstate');
          var UsRegion1 = [
            'AZ', 'CA', 'ID', 'NV', 'UT'
          ];
          var UsRegion2 = [
            'AR', 'CO', 'KS', 'MO', 'MT', 'NE', 'NM', 'OK', 'OR', 'TX', 'WA', 'WY'
          ];
          var UsRegion3 = [
            'AL', 'DE', 'FL', 'GA', 'IL', 'IN', 'IA', 'KY', 'LA', 'MD', 'MA', 'MI', 'MN', 'MS', 'NC', 'ND', 'OH', 'SC', 'SD', 'TN', 'VA', 'WV', 'WI'
          ];
          var UsRegion4 = [
            'CT', 'DC', 'ME', 'NH', 'NJ', 'NY', 'RI', 'VT', 'GU', 'VI'
          ];
          var UsRegion5 = [
            'AK', 'HI', 'PR', 'AS'
          ];

          var shippingCost = parseFloat(salesRecord.getValue('shippingcost'));
          var handlingCost = 0;
          if (UsRegion1.includes(shipState)) {
            handlingCost = parseFloat(shippingCost) * .7;
          } else if (UsRegion2.includes(shipState)) {
            hadnlingCost = parseFloat(shippingCost) * .6;
          } else if (UsRegion3.includes(shipState)) {
            hadnlingCost = parseFloat(shippingCost) * .5;
          } else if (UsRegion4.includes(shipState)) {
            hadnlingCost = parseFloat(shippingCost) * .25;
          } else if (UsRegion5.includes(shipState)) {
            hadnlingCost = parseFloat(shippingCost) * .25;
          } else {
            handlingCost = 0.00;
          }
          salesRecord.setValue('handlingcost', round(handlingCost, 2));
        } else {
          dialog.alert({
            title: 'Ship Method Error',
            message: 'Error: Please select a Ship Method'
          });
        }
      } else {
        dialog.alert({
          title: 'Handling Cost Error',
          message: 'Error: Sales Channel ' + salesRecord.getValue('custbody_fa_channel') + ', FarApp has already added the handling cost to the shipping cost. Please do not add it again.'
        });
      }
    }

    return {
      pageInit: pageInit,
      fieldChanged: fieldChanged,
      calculateHandling: calculateHandling
    };
  }); 