/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/runtime", "N/crypto", "N/encode"], function (
  ui,
  runtime,
  crypto,
  encode
) {
  function onRequest(option) {
    if (option.request.method === "GET") {
      var form = ui.createForm({
        title: "My Credential Form",
      });

      var skField = form.addSecretKeyField({
        id: "mycredential",
        label: "Credential",
        restrictToScriptIds: [runtime.getCurrentScript().id],
        restrictToCurrentUser: false,
      });
      skField.maxLength = 200;

      form.addSubmitButton();
      option.response.writePage(form);


    } else {


      var form = ui.createForm({
        title: "My Credential Form",
      });

      var inputString = "YWJjZGVmZwo=";
      var myGuid = option.request.parameters.mycredential;

      // // Create the key
      var sKey = crypto.createSecretKey({
        guid: myGuid,
        encoding: encode.Encoding.UTF_8,
      });

      try {
        var hmacSha256 = crypto.createHmac({
          algorithm: "SHA256",
          key: sKey,
        });
        hmacSha256.update({
          input: inputString,
          inputEncoding: encode.Encoding.BASE_64,
        });
        var digestSha256 = hmacSha256.digest({
          outputEncoding: encode.Encoding.HEX,
        });
      } catch (e) {
        log.error({
          title: "Failed to hash input",
          details: e,
        });
      }

      form.addField({
        id: "pass",
        label: "Your guid",
        type: "textarea",
      }).defaultValue = myGuid;

      form.addField({
        id: "secretkey",
        label: "Secret Key",
        type: "textarea",
      }).defaultValue = sKey;

      form.addField({
        id: "result",
        label: "Your digested hash value",
        type: "textarea",
      }).defaultValue = digestSha256;

      option.response.writePage(form);
    }
  }

  return {
    onRequest: onRequest,
  };
});
