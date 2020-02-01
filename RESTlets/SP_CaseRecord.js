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

    // Create a NetSuite record from request params
    function post(context) {
      doValidation([context.recordtype], ['recordtype'], 'POST');
      var rec = record.create({
        type: context.recordtype,
        isDynamic: true
      });

      rec.setValue('customform', Number(context.customform));
      rec.setValue('company', Number(context.company));
      rec.setValue('profile', Number(context.profile));
      rec.setValue('priority', Number(context.priority));
      rec.setValue('status', Number(context.status));
      rec.setValue('origin', Number(context.origin));
      rec.setValue('category', Number(context.category));

      rec.setValue('title', context.title);
      rec.setValue('email', context.email);
      rec.setValue('incomingmessage', context.incomingmessage);
      rec.setValue('firstname', context.firstname);
      rec.setValue('lastname', context.lastname);
      rec.setValue('phone', context.phone);
      rec.setValue('quicknote', context.quicknote);

      var recordId = rec.save();

      // create note
      var note = record.create({
        type: record.Type.NOTE
      });

      note.setValue('activity', recordId);
      note.setValue('title', 'Contact Details');
      note.setValue('author', context.company);
      var noteContent = 'Name: ' + context.firstname + ' ' + 
        context.lastname + ' / Phone: ' + context.phone + 
        ' / Email: ' + context.email + ' / Submitted By: ' + context.email; 
      note.setValue('note', noteContent);

      var noteId = note.save();

      return String(recordId);
    }

    return {
      post: post
    };
  });