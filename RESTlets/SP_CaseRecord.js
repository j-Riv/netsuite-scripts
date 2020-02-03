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
     * Creates a Case Record and generates contact note
     * @param {*} context 
     */
    function post(context) {
      doValidation([context.recordType], ['recordtype'], 'POST');
      var rec = record.create({
        type: context.recordtype,
        isDynamic: true
      });

      rec.setValue('customform', Number(context.customForm));
      rec.setValue('company', Number(context.company));
      rec.setValue('profile', Number(context.profile));
      rec.setValue('priority', Number(context.priority));
      rec.setValue('status', Number(context.status));
      rec.setValue('origin', Number(context.origin));
      rec.setValue('category', Number(context.category));

      rec.setValue('title', context.title);
      rec.setValue('email', context.email);
      rec.setValue('incomingmessage', context.incomingMessage);
      rec.setValue('firstname', context.firstName);
      rec.setValue('lastname', context.lastName);
      rec.setValue('phone', context.phone);
      rec.setValue('quicknote', context.quickNote);

      var recordId = rec.save();

      // create note
      var note = record.create({
        type: record.Type.NOTE
      });

      note.setValue('activity', recordId);
      note.setValue('title', 'Contact Details');
      note.setValue('author', context.company);
      var noteContent = 'Name: ' + context.firstName + ' ' + 
        context.lastName + ' / Phone: ' + context.phone + 
        ' / Email: ' + context.email + ' / Submitted By: ' + context.email; 
      note.setValue('note', noteContent);

      var noteId = note.save();

      return String(recordId);
    }

    return {
      post: post
    };
  });