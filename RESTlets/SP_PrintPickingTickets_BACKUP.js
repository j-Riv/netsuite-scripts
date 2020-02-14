/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */

define(['N/render', 'N/search', 'N/encode'],
  function (render, search, encode) {
    function getPickingTickets(context) {

      // var rs = search.load({
      //   id: 'customsearch949'
      // });

      // var results = rs.getRange(0, 1);

      var transactionFile = render.pickingTicket({
        entityId: 8510,
        printMode: render.PrintMode.PDF
        // inCustLocale: true
      });

      var base64 = encode.convert({
        string: transactionFile.getContents(),
        inputEncoding: encode.Encoding.UTF_8,
        outputEncoding: encode.Encoding.BASE_64
      });

      return {
        fileName: 'pickingticket',
        fileContent: base64
      }
    }

    return {
      get: getPickingTickets
    };
  });