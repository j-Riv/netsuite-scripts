/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/runtime', 'N/search', 'N/record', 'N/email'],
  function (runtime, search, record, email) {

    /**
     * Executes scheduled script
     */
    function execute() {
      // load search
      var searchID = runtime.getCurrentScript().getParameter('custscript_auto_create_task_search');

      var customerSearch = search.load({
        id: searchID
      });

      var pagedData = customerSearch.runPaged({
        pageSize: 1000
      });

      var customerResults = [];
      pagedData.pageRanges.forEach(function(pageRange) {
        var page = pagedData.fetch({ index: pageRange.index });
        page.data.forEach(function(result) {

          log.debug({
            title: 'RESULT',
            details: JSON.stringify(result)
          });

          var salesRepId = result.getValue({ name: 'salesrep' });
          var salesRep = result.getText({ name: 'salesrep' });
          var repData = getDefaultRep(salesRep, salesRepId);

          customerResults.push({
            customerId: result.getValue({ name: 'internalid' }),
            name: result.getValue({ name: 'altname' }),
            lastOrderDate: result.getValue({ name: 'lastorderdate' }),
            salesRep: repData.salesRep,
            salesRepId: repData.salesRepId,
            followUpScheduled: result.getValue({ name: 'custentity_sp_follow_up_scheduled'})
          });
        });
      });

      log.debug({
        title: 'CUSTOMER RESULTS',
        details: JSON.stringify(customerResults)
      });

      // create tasks
      var tasksCreated = [];
      var customersUpdated = [];
      customerResults.forEach(function(result) {
        var taskId = createTask(result.salesRepId, result.customerId);
        tasksCreated.push({
          taskId: taskId,
          salesRep: result.salesRep,
          name: result.name
        });
        var customerId = updateCustomer(result.customerId);
        customersUpdated.push({
          id: customerId,
          name: result.name
        });
      });

      log.debug({
        title: 'TASKS CREATED (' + tasksCreated.length + ')',
        details: tasksCreated
      });

      log.debug({
        title: 'CUSTOMERS UPDATED (' + customersUpdated.length + ')',
        details: customersUpdated
      });

      // email
      sendEmail(tasksCreated);

    }

    /**
     * Gets the Default Sales Rep when a Region / Territory is set as the Customer's Sales Rep.
     * @param {string} salesRep - Sales Rep Name
     * @param {string} salesRepId - Sales Rem ID
     * @returns {Object} - Sales Rep Data (Name, ID)
     */
    function getDefaultRep(salesRep, salesRepId) {
      // set defaults
      var defaultRep = runtime.getCurrentScript().getParameter('custscript_auto_create_task_def_rep');
      var defaultInternationalRep = runtime.getCurrentScript().getParameter('custscript_auto_create_task_def_int_rep');
      var defaultWesternRep = runtime.getCurrentScript().getParameter('custscript_auto_create_task_def_wr_rep');
      var defaultEasternRep = runtime.getCurrentScript().getParameter('custscript_auto_create_task_def_er_rep');
      var defaultCentralRep = runtime.getCurrentScript().getParameter('custscript_auto_create_task_def_cr_rep');
      var defaultEnterpriseRep = runtime.getCurrentScript().getParameter('custscript_auto_create_task_def_ent_rep');
      var defaultFranchiseRep = runtime.getCurrentScript().getParameter('custscript_auto_create_task_def_fra_rep');
      var regions = {
        "International": {
          id: defaultInternationalRep,
          rep: "Default International"
        },
        "Western Region": {
          id: defaultWesternRep,
          rep: "Default Western"
        },
        "Central Region": {
          id: defaultCentralRep,
          rep: "Default Central"
        },
        "Eastern Region": {
          id: defaultEasternRep,
          rep: "Default Eastern"
        },
        "Franchise": {
          id: defaultFranchiseRep,
          rep: "Default Franchise"
        },
        "Enterprise": {
          id: defaultEnterpriseRep,
          rep: "Default Enterprise"
        }
      }
      var regionKeys = Object.keys(regions);

      if (regionKeys.includes(salesRep)) {
        return {
          salesRep: regions[salesRep].rep,
          salesRepId: regions[salesRep].id
        }
      } else if (salesRep === '' || salesRepId === '') {
        return {
          salesRep: 'Default',
          salesRepId: defaultRep
        }
      } else {
        return {
          salesRep: salesRep,
          salesRepId: salesRepId
        }
      }
    }

    /**
     * Updates the field 'Follow Up Scheduled' on the Customer Record.
     * @param {string} id - Customers ID
     * @returns {string} - Updated Customer's ID
     */
    function updateCustomer(id) {
      var customerRecord = record.load({
        type: 'customer',
        id: id,
        isDynamic: true
      });

      customerRecord.setValue({
        fieldId: 'custentity_sp_follow_up_scheduled',
        value: true
      });

      var customerId = customerRecord.save({
        enableSourcing: false,
        ignoreMandatoryFields: false
      });

      return customerId;
    }

    /**
     * Creates a task, assigns it to the Customer's Sales Rep and attaches
     * the customer.
     * @param {string} salesRepId - Sales Rep Name
     * @param {string} customerId - Sales Rep ID
     * @returns {string} - Task ID
     */
    function createTask(salesRepId, customerId) {
      var taskRecord = record.create({
        type: record.Type.TASK,
        isDynamic: true
      });

      taskRecord.setValue({
        fieldId: 'title',
        value: '(AUTO) Follow Up With Customer'
      });

      taskRecord.setValue({
        fieldId: 'assigned',
        value: salesRepId
      });

      taskRecord.setValue({
        fieldId: 'startdate',
        value: new Date()
      });

      taskRecord.setValue({
        fieldId: 'duedate',
        value: dueDate()
      });

      taskRecord.setValue({
        fieldId: 'message',
        value: 'This task was auto created via a scheduled script. Customer has not ordered in over 90 days.'
      });

      taskRecord.setValue({
        fieldId: 'company',
        value: customerId
      });

      taskRecord.setValue({
        fieldId: 'sendemail',
        value: true
      });

      var taskId = taskRecord.save({
        enableSourcing: false,
        ignoreMandatoryFields: false
      });

      return taskId;

    }

    /**
     * Generated due date 7 days from creation date.
     * @returns {string} - Due Date
     */
    function dueDate() {
      var days = runtime.getCurrentScript().getParameter('custscript_auto_create_task_due_in_days');
      var today = new Date();
      var dateDue = new Date(today.getFullYear(), today.getMonth(), today.getDate()+days);
      return dateDue;
    }

    /**
     * Sends an email with a list of tasks created.
     * @param {Array} tasksCreated - Task Data
     */
    function sendEmail(tasksCreated) {
      var emailRecipient = runtime.getCurrentScript().getParameter('custscript_auto_create_task_email_rec');
      var emailList = runtime.getCurrentScript().getParameter('custscript_auto_create_task_email_list').split(',');
      var html = '<p>The following tasks were automatically created: </p>' + 
        '<table><tr><th style="padding: 5px;"><b>ID</b></th><th style="padding: 5px;"><b>Customer</b></th><th style="padding: 5px;"><b>Sales Rep</b></th></tr>';

      tasksCreated.forEach(function (task) {
        html += '<tr><td style="padding: 5px;">' + task.taskId + '</td><td style="padding: 5px;">' + task.name + '</td><td style="padding: 5px;">' + task.salesRep + '</td></tr>'
      });
      html += '</table>';

      log.debug({
        title: 'SENDING EMAIL',
        details: html
      });

      email.send({
        author: 207,
        recipients: emailRecipient,
        CC: emailList,
        replyTo: 'jriv@suavecito.com',
        subject: 'The following tasks / follow ups, were created (' + tasksCreated.length + ')',
        body: html
      });
    }

    return {
      execute: execute
    };
  }); 