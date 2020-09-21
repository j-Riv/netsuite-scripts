/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/runtime', 'N/search', 'N/record', 'N/email'],
  function (runtime, search, record, email) {

    /**
     * Executes scheduled script
     */
    function execute() {
      // load search
      // var searchID = runtime.getCurrentScript().getParameter('custscript_auto_create_task_search');
      var searchID = 'customsearch_sp_customer_last_sales_date';

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

          var salesRepId = 206;
          var salesRep = 'Nik Cordova';
          var resultSalesRepId = result.getValue({ name: 'salesrep' });
          var resultSalesRep = result.getText({ name: 'salesrep' });
          switch(resultSalesRep) {
            case '':
              salesRepId = 206;
              salesRep = 'Default';
              break;
            case 'International':
              salesRepId = 238; // dan
              salesRep = 'International';
              break;
            case 'Western Region':
              salesRepId = 206;
              salesRep = 'Default';
              break;
            case 'Central Region':
              salesRepId = 206;
              salesRep = 'Default';
              break;
            case 'Eastern Region':
              salesRepId = 206;
              salesRep = 'Default';
              break;
            case 'Franchise':
              salesRepId = 206;
              salesRep = 'Franchise';
              break;
            case 'Enterprise':
              salesRepId = 206;
              salesRep = 'Enterprise';
              break;
            default:
              salesRepId = resultSalesRepId;
              salesRep = resultSalesRep;
          }

          customerResults.push({
            customerId: result.getValue({ name: 'internalid' }),
            name: result.getValue({ name: 'altname' }),
            lastOrderDate: result.getValue({ name: 'lastorderdate' }),
            salesRep: salesRep,
            salesRepId: salesRepId,
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
      customerResults.forEach(function(result) {
        var taskId = createTask(result.salesRepId, result.customerId);
        tasksCreated.push({
          taskId: taskId,
          salesRep: result.salesRep,
          name: result.name
        });
        var customerId = updateCustomer(result.customerId);
      });

      log.debug({
        title: 'TASKS CREATED (' + tasksCreated.length,
        details: tasksCreated
      });

      // email
      sendEmail(tasksCreated);

    }

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

    function createTask(salesRepId, customerId) {
      var taskRecord = record.create({
        type: record.Type.TASK,
        isDynamic: true
      });

      taskRecord.setValue({
        fieldId: 'title',
        value: 'Follow Up With Customer'
      });

      taskRecord.setValue({
        fieldId: 'assigned',
        value: salesRepId
      });

      taskRecord.setValue({
        fieldId: 'startdate',
        value: new Date('9/25/2020')
      });

      taskRecord.setValue({
        fieldId: 'duedate',
        value: new Date('9/30/2020')
      });

      taskRecord.setValue({
        fieldId: 'message',
        value: 'This task was auto created via a scheduled script. Customer has not ordered in months.'
      });

      taskRecord.setValue({
        fieldId: 'company',
        value: customerId
      });

      var taskId = taskRecord.save({
        enableSourcing: false,
        ignoreMandatoryFields: false
      });

      return taskId;

    }

    function sendEmail(tasksCreated) {
      var html = '<p>The following tasks were automatically created: </p>' + 
        '<table><tr><th><b>ID</b></th><th><b>Customer</b></th><th><b>Sales Rep</b></th></tr>';

      tasksCreated.forEach(function (task) {
        html += '<tr><td>' + task.taskId + '</td><td>' + task.name + '</td><td>' + task.salesRep + '</td></tr>'
      });
      html += '</table>';

      log.debug({
        title: 'SENDING EMAIL',
        details: html
      });

      email.send({
        author: 207,
        recipients: 207,
        replyTo: 'jriv@suavecito.com',
        subject: 'The following tasks were created',
        body: html
      });
    }

    return {
      execute: execute
    };
  }); 