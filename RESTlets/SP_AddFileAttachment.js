/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/file', 'N/record', 'N/error'],
  function (file, record, error) {
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
     * Attaches file to Record
     * @param {*} context - post body
     */
    function post(context) {
      doValidation([context.recordType], ['recordtype'], 'POST');
      // new file
      var fileObj = {
        "name": context.fileName,
        "contents": context.fileContents,
        "filetype": context.fileType,
        "folder": context.folder
      };
      
      // set file type
      var fileType;
      if (context.fileType === 'jpg') {
        fileType = file.Type.JPGIMAGE;
      } else if (context.fileType === 'png') {
        fileType = file.Type.PNGIMAGE;
      } else {
        fileType = file.Type.PDF;
      }

      var fileRecord = file.create({
        name: context.fileName,
        fileType: fileType,
        contents: context.fileContents,
        encoding: file.Encoding.UTF8,
        folder: Number(context.folder), // 752 zoho attachments
        isOnline: false
      });

      var fileID = fileRecord.save();

      // attach record
      var id = record.attach({
        record: {
          type: 'file',
          id: fileID
        },
        to: {
          type: context.parentRecordType,
          id: context.parentRecordId
        }
      });

      return String(id);
    }

    return {
      post: post
    };
  });