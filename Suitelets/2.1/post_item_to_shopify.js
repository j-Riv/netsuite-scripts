/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/ui/message', 'N/https', 'N/log', './libs/forge.min.js'],
  function (runtime, record, search, serverWidget, message, https, log, forge) {

    /**
     * Creates the product form on a GET request.
     * Sends data to the API on a post request.
     * @param {object} context 
     */
    const onRequest = context => {

      const request = context.request;
      const response = context.response;

      if (request.method == 'GET') {
        onGet(response);
      } else { // Post
        onPost(request, response);
      }

    }

    /**
     * Generates the product form.
     * @param {object} response 
     */
    const onGet = response => {
      // create product form
      const productForm = serverWidget.createForm({
        title: 'Post Product to Shopify'
      });

      productForm.addFieldGroup({
        id: 'custpage_product_info',
        label: 'Product Info'
      });

      const storeSelect = productForm.addField({
        id: 'custpage_shopify_store',
        label: 'Shopify Store',
        type: serverWidget.FieldType.SELECT,
        container: 'custpage_product_info'
      });

      storeSelect.addSelectOption({
        value: '',
        text: ''
      });

      storeSelect.addSelectOption({
        value: 'retail',
        text: 'RETAIL'
      });

      storeSelect.addSelectOption({
        value: 'wholesale',
        text: 'WHOLESALE'
      });

      storeSelect.setHelpText({
        help: 'The Shopify store to create the product in.'
      });

      storeSelect.isMandatory = true;

      const productSku = productForm.addField({
        id: 'custpage_product_sku',
        label: 'Product SKU',
        type: serverWidget.FieldType.TEXT,
        container: 'custpage_product_info'
      });

      productSku.setHelpText({
        help: 'The SKU for the product you want to create in Shopify.'
      });

      productSku.isMandatory = true;

      productForm.addSubmitButton({
        label: 'Post to Shopify'
      });

      response.writePage(productForm);
    }

    /**
     * Sends product data to the API to create a new
     * product in Shopify.
     * @param {object} request 
     * @param {object} response 
     */
    const onPost = (request, response) => {
      const serverURL = runtime.getCurrentScript().getParameter('custscript_servername');
      const store = request.parameters.custpage_shopify_store;
      const SKU = request.parameters.custpage_product_sku;
      let pricelevel;
      let storeURL;
      let productDescription;
      let shopifyTags;
      let compareAtPrice;

      if (store == 'retail') {
        pricelevel = 'baseprice';
        storeURL = 'https://suavecito.myshopify.com/admin/products/';
        productDescription = 'custitem_fa_shpfy_prod_description';
        shopifyTags = 'custitem_fa_shpfy_tags';
        compareAtPrice = 'custitem_fa_shpfy_compare_at_price';
      } else {
        pricelevel = 'price2';
        storeURL = 'https://suavecito-wholesale.myshopify.com/admin/products/';
        productDescription = 'custitem_fa_shpfy_prod_description_ws';
        shopifyTags = 'custitem_fa_shpfy_tags_ws';
        compareAtPrice = 'custitem_fa_shpfy_compare_at_price_ws';
      }

      // item search
      const itemSearch = search.create({
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

      const resultSet = itemSearch.run();
      const results = resultSet.getRange({
        start: 0,
        end: 1
      });

      // do stuff
      if (results.length > 0) {
        const isMatrix = results[0].getValue('matrix');

        // load single record
        const itemRecord = record.load({
          type: results[0].recordType,
          id: results[0].id,
          isDynamic: false
        });

        // create item obj for shopify
        const itemObj = {
          // is: is,
          brand: itemRecord.getText('custitem_sp_brand'),
          title: itemRecord.getValue('displayname'),
          sku: itemRecord.getValue('itemid'),
          barcode: itemRecord.getValue('upccode'),
          weight: itemRecord.getValue('weight'),
          weight_unit: itemRecord.getText('weightunit'),
          product_type: itemRecord.getText('custitem_fa_shpfy_prodtype'),
          tags: itemRecord.getValue(shopifyTags),
          compare_at_price: itemRecord.getValue(compareAtPrice).toString(),
          description: stripInlineStyles(itemRecord.getValue(productDescription))
        }

        log.debug({
          title: 'Sending Item Obj',
          details: JSON.stringify(itemObj)
        });

        // check if its a matrix
        if (isMatrix) {
          // do matrix shit
          const childItemSearch = search.create({
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
              'custitem_sp_size',
              'custitem_sp_color',
              'custitem_fa_shpfy_compare_at_price',
              'custitem_fa_shpfy_compare_at_price_ws'
            ]
          });

          childItemSearch.filters = [
            search.createFilter({
              name: 'parent',
              operator: search.Operator.IS,
              values: results[0].id
            })
          ];

          const childResultSet = childItemSearch.run();
          const childResults = childResultSet.getRange({
            start: 0,
            end: 25
          });

          // loop through child items and create variant object(s)
          const variants = [];

          childResults.forEach((item, index) => {
            const sku = item.getValue('itemid').split(' : ');
            const color = item.getText('custitem_sp_color');
            const size = item.getText('custitem_sp_size');

            let optionName;
            if (size != '') {
              optionName = size;
              itemObj.option = 'Size';
            } else if (color != '') {
              optionName = color;
              itemObj.option = 'Color';
            } else {
              optionName = 'Option ' + index;
              itemObj.option = 'Options';
            }

            variants.push({
              option1: optionName,
              price: item.getValue(pricelevel),
              sku: sku[1],
              weight: item.getValue('weight'),
              weight_unit: item.getText('weightunit'),
              barcode: item.getValue('upccode'),
              inventory_management: 'Shopify',
              compare_at_price: item.getValue(compareAtPrice).toString()
            });
          });

          itemObj.hasVariants = true;
          // stringify variant array of object
          itemObj.variants = JSON.stringify(variants);

        } else { // single item

          itemObj.hasVariants = false;
          itemObj.price = results[0].getValue(pricelevel);
        }

        // https - send data to server
        const url = 'https://' + serverURL + '/api/shopify/' + store + '/create-item';
        try {

          const itemObjHmac = createHmac(itemObj);

          const headersObj = {
            name: 'X-NetSuite-Hmac-Sha256',
            value: itemObjHmac,
          };

          log.debug({
            title: 'HMAC',
            details: itemObjHmac
          });

          const res = https.post({
            url: url,
            body: itemObj,
            headers: headersObj
          });

          log.debug({
            title: 'Response from Server',
            details: res.body
          });

          const newProduct = JSON.parse(res.body);

          // if success
          if ('product' in newProduct) {

            const successForm = serverWidget.createForm({
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
              message: 'Product Created/Updated in Shopify!'
            });

            successForm.addField({
              id: 'custpage_message',
              type: serverWidget.FieldType.INLINEHTML,
              label: ' '
            }).defaultValue = 'Product Created/Updated in Shopify (<a href="' +
            storeURL + newProduct.product.id + '" target="_blank">' +
            newProduct.product.id + '</a>).<br/>Please make sure the description is formatted correctly.';

            response.writePage(successForm);

          } else {
            throw new Error(JSON.stringify(newProduct));
          }

        } catch (e) {
          log.error({
            title: 'ERROR!',
            details: e.message
          });

          const shopifyErrorForm = serverWidget.createForm({
            title: 'Post Product to Shopify'
          });

          shopifyErrorForm.addPageInitMessage({
            type: message.Type.ERROR,
            title: 'ERROR!',
            message: e.message,
          });

          response.writePage(shopifyErrorForm);
        }

      } else {

        const errorForm = serverWidget.createForm({
          title: 'Post Product to Shopify'
        });

        errorForm.addPageInitMessage({
          type: message.Type.ERROR,
          title: 'ERROR!',
          message: 'SKU (' + SKU + ') not found!',
        });

        response.writePage(errorForm);

      }
    }

    /**
     * Strips all inline styles from an html string.
     * @param {string} html 
     */
    const stripInlineStyles = html => {
      const regex = /style=(\'|\")([ -0-9a-zA-Z:]*[ 0-9a-zA-Z;]*)*\1/g;
      return html.replace(regex, '');
    }

    /**
     * Creates HMAC, for data integrity verification.
     * @param {Object} itemObj 
     * @returns {string} - hmac
     */
    const createHmac = itemObj => {
      const item = itemObj.brand +
        itemObj.title +
        itemObj.sku +
        itemObj.weight +
        itemObj.weight_unit +
        itemObj.product_type +
        itemObj.tags;
      const secret = runtime.getCurrentScript().getParameter('custscript_netsuite_to_shopify_secret');
      const hmac = forge.hmac.create();
      hmac.start('sha256', secret);
      hmac.update(item);
      return hmac.digest().toHex();
    }

    return {
      onRequest: onRequest
    };
  });