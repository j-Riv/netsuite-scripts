/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */

define(['N/render', 'N/encode'],
  function (render, encode) {
    function getPickingTicketPDF(context) {

      var transactionFile = render.pickingTicket({
        entityId: Number(context.id),
        printMode: render.PrintMode.PDF
        // inCustLocale: true
      });

      // var base64Data = encode.convert({
      //   string: transactionFile.getContents(),
      //   inputEncoding: encode.Encoding.UTF_8,
      //   outputEncoding: encode.Encoding.BASE_64
      // });

      return {
        fileName: 'pickingticket-' + context.id,
        fileBuffer: transactionFile.getContents()
      }
    }

    return {
      post: getPickingTicketPDF
    };
  });