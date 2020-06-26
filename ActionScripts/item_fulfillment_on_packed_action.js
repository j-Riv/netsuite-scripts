/**
*
@NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 * @NModuleScope public
 *
*/
define(['N/log', './ratePackageSelector/setPackage'],
  function (log, setPackage) {

    function onAction(context) {
      try {
        var itemFulfill = context.newRecord;
        setPackage._set(itemFulfill);

        log.debug({
          title: 'ON PACKED SCRIPT',
          details: 'HELLO THERE SIR'
        });

      } catch (e) {
        log.error({
          title: 'ON PACKED ACTION ERROR!',
          details: e.message
        });

        return false;
      }
    }

    return {
      onAction: onAction
    }
  });