/**
 * resultSublist.js
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/ui/serverWidget'],
  (serverWidget) => {

    /**
     * Creates a sublist with the given results.
     * @param {Object} form - The Form Object
     * @param {Object} data - The Results Object
     * @param {string} widgetName - Element Name
     * @param {string} key - The Key
     * @param {string} keyLabel - The Key (Display)
     * @returns {object} - The Form Object with new Sublist
     */
    const createSublist = (form, data, widgetName, key, keyLabel) => {
      const sublist = form.addSublist({
        id: 'custpage_sales_by_' + widgetName + '_sublist',
        type: serverWidget.SublistType.LIST,
        label: '$$ by ' + keyLabel
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName,
        type: serverWidget.FieldType.TEXT,
        label: keyLabel
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_last_sales',
        type: serverWidget.FieldType.TEXT,
        label: 'Last Sales'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_last_order_count',
        type: serverWidget.FieldType.TEXT,
        label: 'Last Order Count'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_last_avg_order_amount',
        type: serverWidget.FieldType.TEXT,
        label: 'Last Avg Order Amount'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_current_sales',
        type: serverWidget.FieldType.TEXT,
        label: 'Current Sales'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_current_order_count',
        type: serverWidget.FieldType.TEXT,
        label: 'Current Order Count'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_current_avg_order_amount',
        type: serverWidget.FieldType.TEXT,
        label: 'Current Avg Order Amount'
      });
      sublist.addField({
        id: 'custpage_field_' + widgetName + '_sales_growth',
        type: serverWidget.FieldType.TEXT,
        label: 'Sales Growth'
      });

      for (let i = 0; i < data.results.length; i++) {
        let result = data.results[i];

        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName,
          line: i,
          value: result[key]
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_last_sales',
          line: i,
          value: result.lastSales
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_last_order_count',
          line: i,
          value: result.lastOrderCount
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_last_avg_order_amount',
          line: i,
          value: result.lastAvgOrderAmount
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_current_sales',
          line: i,
          value: result.currentSales
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_current_order_count',
          line: i,
          value: result.currentOrderCount
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_current_avg_order_amount',
          line: i,
          value: result.currentAvgOrderAmount
        });
        sublist.setSublistValue({
          id: 'custpage_field_' + widgetName + '_sales_growth',
          line: i,
          value: result.salesGrowth
        });
      }

      return form;

    } 

    return {
      _create: createSublist
    }
  });