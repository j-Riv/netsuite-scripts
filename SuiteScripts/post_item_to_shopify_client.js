/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([],
  function () {

    function pageInit(context) {
      // todo
      console.log('Post Item To Shopify Client Script Loaded');
    }

    function goBack() {
      console.log('go back');
      window.history.back();
    }

    return {
      pageInit: pageInit,
      goBack: goBack
    };
  });