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

        // create product form
        var productForm = serverWidget.createForm({
          title: 'Post Product to Shopify'
        });

        productForm.addFieldGroup({
          id: 'custpage_product_info',
          label: 'Product Info'
        });

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

        productForm.addSubmitButton({
          label: 'Post to Shopify'
        });

        context.response.writePage(productForm);

      } else { // Post

        var store = request.parameters.custpage_shopify_store;
        var SKU = request.parameters.custpage_product_sku;
        var pricelevel;
        var storeURL;
        var productDescription;

        if (store == 'retail') {
          pricelevel = 'baseprice';
          storeURL = 'https://suavecito.myshopify.com/admin/products/';
          productDescription = 'custitem_fa_shpfy_prod_description';
        } else {
          pricelevel = 'price2';
          storeURL = 'https://suavecito-wholesale.myshopify.com/admin/products/';
          productDescription = 'custitem_fa_shpfy_prod_description_ws';
        }

        // item search
        var itemSearch = search.create({
          type: 'item',
          columns: [
            'internalid',
            'displayname',
            'name',
            'itemid',
            'matrix',
            'upccode',
            'weight',
            'weightunit',
            'baseprice',
            'price2',
            'description',
            'custitem_sp_brand'
          ]
        });

        itemSearch.filters = [
          search.createFilter({
            name: 'name',
            operator: search.Operator.IS,
            values: SKU
          })
        ];

        var resultSet = itemSearch.run();
        var results = resultSet.getRange({
          start: 0,
          end: 1
        });

        // do stuff
        if (results.length > 0) {
          var isMatrix = results[0].getValue('matrix');

          // load single record
          var itemRecord = record.load({
            type: results[0].recordType,
            id: results[0].id,
            isDynamic: false
          });

          // create item obj for shopify
          var itemObj = {
            randomId: 'aDV3nyg9DwimEq',
            brand: itemRecord.getText('custitem_sp_brand'),
            title: itemRecord.getValue('displayname'),
            sku: itemRecord.getValue('itemid'),
            barcode: itemRecord.getValue('upccode'),
            weight: itemRecord.getValue('weight'),
            weight_unit: itemRecord.getText('weightunit'),
            product_type: itemRecord.getText('custitem_fa_shpfy_prodtype'),
            description: stripInlineStyles(itemRecord.getValue(productDescription))
          }

          log.debug({
            title: 'Sending Item Obj',
            details: JSON.stringify(itemObj)
          });

          // check if its a matrix
          if (isMatrix) {
            // do matrix shit
            var childItemSearch = search.create({
              type: 'item',
              columns: [
                'internalid',
                'displayname',
                'name',
                'itemid',
                'matrix',
                'upccode',
                'weight',
                'weightunit',
                'baseprice',
                'price2',
                'description',
              ]
            });

            childItemSearch.filters = [
              search.createFilter({
                name: 'parent',
                operator: search.Operator.IS,
                values: results[0].id
              })
            ];

            var childResultSet = childItemSearch.run();
            var childResults = childResultSet.getRange({
              start: 0,
              end: 25
            });

            // loop through child items and create variant object(s)
            var variants = [];

            childResults.forEach(function (item, index) {
              var sku = item.getValue('itemid').split(' : ');
              var displayName = item.getValue('displayname').split(' - ');
              variants.push({
                option1: displayName[1],
                price: item.getValue(pricelevel),
                sku: sku[1],
                weight: item.getValue('weight'),
                weight_unit: item.getText('weightunit'),
                barcode: item.getValue('upccode'),
                inventory_management: 'Shopify'
              });
            });

            itemObj.hasVariants = true;
            // stringify variant array of object
            itemObj.variants = JSON.stringify(variants);
            itemObj.option = 'Option';

          } else { // single item

            itemObj.hasVariants = false;
            itemObj.price = results[0].getValue(pricelevel);
          }

          // https - send data to server
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
                message: 'Product Created/Updated in Shopify (' + newProduct.product.id + '). View link by clicking on MORE on the right. Please make sure the description is formatted correctly'
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

    function stripInlineStyles(html) {
      var regex = /style=(\'|\")([ -0-9a-zA-Z:]*[ 0-9a-zA-Z;]*)*\1/g;
      return html.replace(regex, '');
    }

    return {
      onRequest: onRequest
    };
  });