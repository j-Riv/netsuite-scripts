/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/record', 'N/error'],
    function (record, error) {
        /**
         * Validates arguments
         * @param {Array} args The record type and optional record id
         * @param {Array} argNames The arg names to check against
         * @param {string} methodName (GET, DELETE, POST, PUT)
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
         * Gets a standard record by type and id
         * @param {Object} context The post body
         * @returns {Object} The record
         */
        function _get(context) {
            // Parse data passed to url ex: &recordtype=customer&id=1102
            doValidation([context.recordtype, context.id], ['recordtype', 'id'], 'GET');
            return JSON.stringify(record.load({
                type: context.recordtype,
                id: context.id
            }));
        }
        /**
         * Deletes a standard record by type and id
         * @param {Object} context The post body 
         * @returns {string} The deleted id
         */
        function _delete(context) {
            doValidation([context.recordtype, context.id], ['recordtype', 'id'], 'DELETE');
            record.delete({
                type: context.recordtype,
                id: context.id
            });
            return String(context.id);
        }
        /**
         * Creates a Lead Record from the Wholesale Application Form
         * @param {Object} context The post body
         * @returns {string} The records id
         */
        function post(context) {
            doValidation([context.recordtype], ['recordtype'], 'POST');
            var rec = record.create({
                type: context.recordtype,
                isDynamic: true
            });
            // Loop through fields
            for (var fldName in context)
                if (context.hasOwnProperty(fldName))
                    if (fldName !== 'recordtype')
                        rec.setValue(fldName, context[fldName]);

            // Add address & contacts
            if (context.recordtype === 'lead') {
                // Addresses
                var leadAddress = context.addressbook;
                leadAddress.forEach(function (addr) {
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
                    if (addr.label === 'Billing & Shipping Address') {
                        rec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: true });
                        rec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: true });
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
                // Contact
                rec.selectNewLine({ sublistId: 'contact' });
                rec.setCurrentSublistValue({ sublistId: 'contact', fieldId: 'firstname', value: context.billingfirstname });
                rec.setCurrentSublistValue({ sublistId: 'contact', fieldId: 'lastname', value: context.billinglastname });
                rec.setCurrentSublistValue({ sublistId: 'contact', fieldId: 'email', value: context.billingemail });
                rec.setCurrentSublistValue({ sublistId: 'contact', fieldId: 'phone', value: context.billingphone });
                rec.setCurrentSublistValue({ sublistId: 'contact', fieldId: 'title', value: context.billingtitle });
                rec.commitLine({ sublistId: 'contact' });

                if (context.secondContact) {
                    // Second Contact
                    rec.selectNewLine({ sublistId: 'contact' });
                    rec.setCurrentSublistValue({ sublistId: 'contact', fieldId: 'firstname', value: context.contactfirstname });
                    rec.setCurrentSublistValue({ sublistId: 'contact', fieldId: 'lastname', value: context.contactlastname });
                    rec.setCurrentSublistValue({ sublistId: 'contact', fieldId: 'email', value: context.email });
                    rec.setCurrentSublistValue({ sublistId: 'contact', fieldId: 'phone', value: context.phone });
                    rec.setCurrentSublistValue({ sublistId: 'contact', fieldId: 'title', value: context.contacttitle });
                    rec.commitLine({ sublistId: 'contact' });
                }
            }
            // Save record and return id
            var recordId = rec.save();
            return String(recordId);
        }
        /**
         * Upsert a NetSuite record from request param
         * @param {Object} context 
         */
        function put(context) {
            doValidation([context.recordtype, context.id], ['recordtype', 'id'], 'PUT');
            var rec = record.load({
                type: context.recordtype,
                id: context.id
            });
            // Loop through fields
            for (var fldName in context)
                if (context.hasOwnProperty(fldName))
                    if (fldName !== 'recordtype' && fldName !== 'id')
                        rec.setValue(fldName, context[fldName]);
            rec.save();
            return JSON.stringify(rec);
        }
        // Export Functions
        return {
            get: _get,
            delete: _delete,
            post: post,
            put: put
        };
    });