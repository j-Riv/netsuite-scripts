/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/record', 'N/error'],
  function (record, error) {
    /**
     * Validates arguments
     * @param {array} args - the record type and optional record id
     * @param {*} argNames - what to check against
     * @param {*} methodName - (GET, DELETE, POST, PUT) 
     */
    function doValidation(args, argNames, methodName) {
      for (var i = 0; i < args.length; i++)
        if (!args[i] && args[i] !== 0)
          throw error.create({
            name: 'MISSING_REQ_ARG',
            message: 'Missing a required argument: [' + argNames[i] + '] for method: ' + methodName
          });
    }

    /**
     * Loads standard records
     * @param {*} context - post body 
     */
    function post(context) {
      doValidation([context.recordtype, context.id], ['recordtype', 'id'], 'POST');
      return JSON.stringify(record.load({
        type: context.recordtype,
        id: context.id
      }));
    }

    return {
      post: post
    };
  });