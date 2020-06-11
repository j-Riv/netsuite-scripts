/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/ui/message', 'N/https', 'N/log'],
  function (record, search, serverWidget, message, https, log) {

    function onRequest(context) {

      var request = context.request;
      var response = context.response;

      if (request.method == 'GET') {

        // create form
        var productForm = serverWidget.createForm({
          title: 'Post Product to Shopify'
        });

        productForm.addFieldGroup({
          id: 'custpage_product_info',
          label: 'Product Info'
        });

        // field groups
        var storeSelect = productForm.addField({
          id: 'custpage_shopify_store',
          label: 'Shopify Store',
          type: serverWidget.FieldType.SELECT,
          container: 'custpage_product_info'
        });

        storeSelect.addSelectOption({
          value: 'retail',
          text: 'RETAIL'
        });

        storeSelect.addSelectOption({
          value: 'wholesale',
          text: 'WHOLESALE'
        });

        productForm.addField({
          id: 'custpage_product_sku',
          label: 'Product SKU',
          type: serverWidget.FieldType.TEXT,
          container: 'custpage_product_info'
        });

        // submit button
        productForm.addSubmitButton({
          label: 'Post to Shopify'
        });

        context.response.writePage(productForm);
      } else { // Post

        var store = request.parameters.custpage_shopify_store;
        var SKU = request.parameters.custpage_product_sku;
        // item search
        var itemSearch = search.create({
          type: 'item',
          columns: [
            'internalid',
            'name',
            'itemid',
            'matrix',
            'upccode',
            'weight',
            'weightunit',
            'baseprice',
            'price2',
            'description',
            // 'custitem_fa_shpfy_prod_description'
          ]
        });
        itemSearch.filters = [
          search.createFilter({
            name: 'name',
            operator: search.Operator.IS,
            values: SKU
          })
        ]
        var resultSet = itemSearch.run();
        var results = resultSet.getRange({
          start: 0,
          end: 1
        });

        // var stuff = JSON.stringify(results);
        // context.response.write({ output: stuff });

        if (results.length > 0) {

          var itemResult = results[0];
          var isMatrix = itemResult.getValue('matrix');

          // load 
          var itemRecord = record.load({
            type: results[0].recordType,
            id: results[0].id,
            isDynamic: false
          });

          var retailPrice = results[0].getValue('baseprice');
          var wholesalePrice = results[0].getValue('price2');

          // create record obj for shopify
          var itemObj = {
            brand: itemRecord.getText('custitem_sp_brand'),
            name: itemRecord.getValue('displayname'),
            sku: itemRecord.getValue('itemid'),
            upc: itemRecord.getValue('upccode'),
            weight: itemRecord.getValue('weight'),
            weightUnit: itemRecord.getText('weightunit'),
            productType: itemRecord.getText('custitem_fa_shpfy_prodtype'),
            description: itemRecord.getValue('custitem_fa_shpfy_prod_description')
          }

          // var stuff = JSON.stringify(itemObj);
          context.response.write({ output: 'Pushing product to Shopify...' });

          log.debug({
            title: 'Sending Item Obj',
            details: JSON.stringify(itemObj)
          });

          // https to server
          var storeURL;
          if (store == 'retail') {
            itemObj.price = retailPrice;
            storeURL = 'https://suavecito.myshopify.com/admin/products/';
          } else {
            itemObj.price = wholesalePrice;
            storeURL = 'https://suavecito-wholesale.myshopify.com/admin/products/';
          }

          var url = 'https://test-api.suavecito.com/api/shopify/' + store + '/create-item';
          try {
            var headersObj = {
              name: 'Content-Type',
              value: 'application/json'
            };

            var response = https.post({
              url: url,
              body: itemObj,
              headers: headersObj
            });

            log.debug({
              title: 'Response from Server',
              details: response.body
            });

            var newProduct = JSON.parse(response.body);

            // if success
            if ('product' in newProduct) {

              // var htmlResponse = '<p>Success:</p><br/><a href="https://suavecito.myshopify.com/admin/products/' + newProduct.product.id + '">View Product</a>';
              // context.response.write({ output: htmlResponse });

              var successForm = serverWidget.createForm({
                title: 'Post Product to Shopify (' + store + ')'
              });

              successForm.addPageLink({
                type: serverWidget.FormPageLinkType.CROSSLINK,
                title: 'View Product',
                url: storeURL + newProduct.product.id
              });

              successForm.addPageInitMessage({
                type: message.Type.CONFIRMATION,
                title: 'SUCCESS!',
                message: 'Product Created in Shopify (' + newProduct.product.id + '). View link by clicking on MORE on the right.',
                duration: 10000
              });

              context.response.writePage(successForm);

            }

          } catch (e) {
            log.debug({
              title: 'ERROR!',
              details: e.message
            });
          }

        } else {

          var errorForm = serverWidget.createForm({
            title: 'Post Product to Shopify'
          });

          errorForm.addPageInitMessage({
            type: message.Type.ERROR,
            title: 'ERROR!',
            message: 'SKU (' + SKU + ') not found!',
          });

          context.response.writePage(errorForm);

        }

      }
    }

    return {
      onRequest: onRequest
    };
  });