/**
*
@NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 * @NModuleScope public
 *
*/
define(['N/log', './packageSetter'],
  function (log, packageSetter) {

    function onAction(context) {
      try {
        var itemFulfill = context.newRecord;
        packageSetter.setPackage(itemFulfill);

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