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

    function post(context) {
      doValidation([context.recordtype], ['recordtype'], 'POST');
      // new file
      var fileObj = {
        "name": context.fileName,
        "contents": context.fileContents,
        "filetype": context.fileType,
        "folder": context.folder
      };

      var fileType;
      if (fileObj.filetype === 'jpg') {
        fileType = file.Type.JPGIMAGE;
      } else if (fileObj.filetype === 'png') {
        fileType = file.Type.PNGIMAGE;
      } else {
        fileType = file.Type.PDF;
      }

      var fileRecord = file.create({
        name: fileObj.name,
        fileType: fileType,
        contents: fileObj.contents,
        encoding: file.Encoding.UTF8,
        folder: Number(fileObj.folder), // 752 zoho attachments
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
          type: 'customer',
          id: context.customerID
        }
      });

      return String(id);
    }

    return {
      post: post
    };
  });