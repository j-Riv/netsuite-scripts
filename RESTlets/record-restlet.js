/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/record', 'N/error'],
    function(record, error) {
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
        // Get a standard NetSuite record
        function _get(context) {
            doValidation([context.recordtype, context.id], ['recordtype', 'id'], 'GET');
            return JSON.stringify(record.load({
                type: context.recordtype,
                id: context.id
            }));
        }
        // Delete a standard NetSuite record
        function _delete(context) {
            doValidation([context.recordtype, context.id], ['recordtype', 'id'], 'DELETE');
            record.delete({
                type: context.recordtype,
                id: context.id
            });
            return String(context.id);
        }
        // Create a NetSuite record from request params
        function post(context) {
            doValidation([context.recordtype], ['recordtype'], 'POST');
            var rec = record.create({
                type: context.recordtype,
                isDynamic: true
            });
            for (var fldName in context)
                if (context.hasOwnProperty(fldName))
                    if (fldName !== 'recordtype')
                        rec.setValue(fldName, context[fldName]);
            
            // Add address
            if (context.recordtype === 'lead') {
                var leadAddress = context.addressbook;
                leadAddress.forEach(function(addr){
                    rec.selectNewLine({ sublistId: 'addressbook' });
                    rec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'label', value: addr.label });
                    if (addr.label === 'Billing Address') {
                        rec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: true });
                    } else {
                        rec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: false });
                    }
                    if (addr.label === 'Shipping Address') {
                        rec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: true });
                    } else {
                        rec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: false });
                    }
                    var address = rec.getCurrentSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress' });
                    address.setValue({ fieldId: 'addressee', value: addr.companyname });
                    address.setValue({ fieldId: 'addr1', value: addr.addr1 });
                    address.setValue({ fieldId: 'addr2', value: addr.addr2 });
                    address.setValue({ fieldId: 'city', value: addr.city });
                    address.setValue({ fieldId: 'country', value: addr.country });
                    address.setValue({ fieldId: 'state', value: addr.state });
                    address.setValue({ fieldId: 'zip', value: addr.zip });
                    rec.commitLine({ sublistId: 'addressbook' });
                });
            }

            var recordId = rec.save();
            return String(recordId);
        }
        // Upsert a NetSuite record from request param
        function put(context) {
            doValidation([context.recordtype, context.id], ['recordtype', 'id'], 'PUT');
            var rec = record.load({
                type: context.recordtype,
                id: context.id
            });
            for (var fldName in context)
                if (context.hasOwnProperty(fldName))
                    if (fldName !== 'recordtype' && fldName !== 'id')
                        rec.setValue(fldName, context[fldName]);
            rec.save();
            return JSON.stringify(rec);
        }
        return {
            get: _get,
            delete: _delete,
            post: post,
            put: put
        };
    });