/**
*
@NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 * @NModuleScope public
 *
*/
define(['N/record', 'N/log', './packageSelector'],
  function (record, log, packageSelector) {

    // Shipping Methods - Production
    // var fedEx2Day = '30611';
    // var uspsPriority = '22001';
    // var uspsFirstClass = '22000';
    // var uspsPriorityEnvelope = '31089';
    // var uspsPriorityLegalEnvelope = '31094';
    // var uspsPriorityMdFlatRateBox = '31136';
    // // Flat Rate Shipping Costs
    // var uspsFlatRateEnvelopeCost = 7.15;
    // var uspsFlatRateLegalEnvelopeCost = 7.45;
    // var uspsMediumFlatRateBox = 13.20;
    // var uspsLargeFlatRateBox = 18.30;
    // // Boxes
    // var smallMembership = { width: 6, length: 9, height: 3, weight: .254 };
    // var largeMembership = { width: 6, length: 12, height: 3, weight: .3 };
    // var uspsCube = { width: 7, length: 7, height: 6, weight: .254 };
    // var box1 = { width: 10, length: 12, height: 6, weight: .58 };
    // var box2 = { width: 12, length: 12, height: 10, weight: .881 };
    // var box3 = { width: 12, length: 15, height: 12, weight: 1.071 };
    // var box4 = { width: 14, length: 18, height: 14, weight: 1.411 };
    // var box5 = { width: 15, length: 20, height: 15, weight: 1.522 };
    // // USPS Methods
    // var priorityMail = 'PRIORITY';

    // // USPS Priority Container Types
    // var parcel = 'VARIABLE';
    // var flatRateEnvelope = 'FLAT RATE ENVELOPE';
    // var legalFlatRateEnvelope = 'LEGAL FLAT RATE ENVELOPE';
    // var smallFlatRateBox = 'SM FLAT RATE BOX';
    // var mediumFlatRateBox = 'MD FLAT RATE BOX';
    // var largeFlatRateBox = 'LG FLAT RATE BOX';
    

    function onAction(context) {
      try {
        var itemFulfill = context.newRecord;
        packageSelector.setPackage(itemFulfill);



        // var createdFrom = itemFulfill.getValue('createdfrom');
        // var tranId = itemFulfill.getValue('tranid');
        // // Address
        // var shippingAddress = itemFulfill.getSubrecord('shippingaddress');
        // var addr1 = shippingAddress.getValue('addr1');
        // var addr2 = shippingAddress.getValue('addr2');
        // var city = shippingAddress.getValue('city');
        // var state = shippingAddress.getValue('state');
        // var country = shippingAddress.getValue('country');
        // var zip = shippingAddress.getValue('zip');
        
        // var shippingCost = itemFulfill.getValue('shippingcost');
        // var shippingWeight = itemFulfill.getValue('custbody_sp_total_items_weight');
        // var totalItemCount = itemFulfill.getValue('custbody_sp_total_items');

        // log.debug({
        //   title: 'SHIPPING COST, WEIGHT, ITEM COUNT',
        //   details: shippingCost + '|' + shippingWeight + '|' + totalItemCount
        // });

        // // Calculate box + Rate
        // var boxDimensions = {
        //   width: 6,
        //   length: 9,
        //   height: 3
        // };
        // // Method will be selected taking account box size, box weight and customer
        // // paid shipping cost
        // var method = 'PRIORITY COMMERCIAL';
        // var weightPounds = shippingWeight;
        // var containerType = '';
        
        // // Once box is set check ship country. If it is international, ship it manually.
        // if (country == 'US') {
        //   // Validate Address
        //   var addressOk = getUspsRates.validateAddress(addr1, addr2, city, state, zip, country);

        //   if (addressOk) {
        //     log.debug({
        //       title: 'RUNNING GETUSPSRATES',
        //       details: 'Zip: ' + zip + ' | Method: ' + method + ' | Container: ' + containerType
        //         + ' | Weight (lbs): ' + weightPounds + ' | Box Dimensions: ' + boxDimensions
        //     });

        //     var rate = getUspsRates.getRates(zip, method, containerType, weightPounds, boxDimensions);
        //   } else {
        //     log.error({
        //       title: 'ADDRESS IS UNACCEPTABLE',
        //       details: tranId + ' This order will have to be manually shipped'
        //     });
        //     itemFulfill.setValue('custbody_sp_manual_fulfillment_req', true);
        //   }
        // } else {
        //   // Maybe? Set field for searching errored item fulfillments, for manual shipment
        //   log.debug({
        //     title: 'ITEM FULFILLMENT',
        //     details: tranId + ' This order will have to be manually shipped'
        //   });
        //   itemFulfill.setValue('custbody_sp_manual_fulfillment_req', true);
        // }

        log.debug({
          title: 'ON PACKED SCRIPT',
          details: 'HELLO THERE SIR'
        });

      } catch (e) {
        log.error({
          title: 'ON PACKED ACTION ERROR!',
          details: tranId + ' | ' + e.message
        });

        return false;
      }
    }

    return {
      onAction: onAction
    }
  });