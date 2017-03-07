sap.ui.define([
		"sap/ui/base/Object",
		"sap/m/MessageBox",
		"sap/m/MessageToast"
	], function (UI5Object, MessageBox, MessageToast) {
		"use strict";

		return UI5Object.extend("ts.controller.ErrorHandler", {

			/**
			 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
			 * @class
			 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
			 * @public
			 * @alias ts.controller.ErrorHandler
			 */
			constructor : function (oComponent) {
				this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
				this._oComponent = oComponent;
				this._oModel = oComponent.getModel();
				this._bMessageOpen = false;
				this._sErrorText = this._oResourceBundle.getText("errorText");

				this._oModel.attachMetadataFailed(function (oEvent) {
					var oParams = oEvent.getParameters();
					this._showServiceError(oParams.response);
				}, this);

				this._oModel.attachRequestFailed(function (oEvent) {
					var oParams = oEvent.getParameters();
					// An entity that was not found in the service is also throwing a 404 error in oData.
					// We already cover this case with a notFound target so we skip it here.
					// A request that cannot be sent to the server is a technical error that we have to handle though
					if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf("Cannot POST") === 0)) {
						this._showServiceError(oParams.response);
					}
				}, this);
			},

			_extractError: function(sDetails) {
				if (sDetails.responseText) {
					var parsedJSError = null;
					try {
						parsedJSError = jQuery.sap.parseJS(sDetails.responseText);
						} catch (err) {
						return sDetails;
						}
						
						if (parsedJSError && parsedJSError.error && parsedJSError.error.code) {
						var strError = "";
						//check if the error is from our backend error class
						if (parsedJSError.error.code.split("/")[0] === "SY") {
							var array = parsedJSError.error.innererror.errordetails;
								for (var i = 0; i < array.length; i++) {
									var innerText = array[i].message;
									innerText = innerText.split("(")[1];
									innerText = innerText.split(")")[0];
									strError += String.fromCharCode("8226") + " " + innerText + "\n";
								}
							} else {
								//if there is no message class found
								return sDetails;
							}
							return strError;
						}
				}
				return sDetails;
			},

			/**
			 * Shows a {@link sap.m.MessageBox} when a service call has failed.
			 * Only the first error message will be display.
			 * @param {string} sDetails a technical error to be displayed on request
			 * @private
			 */
			_showServiceError : function (sDetails) {
				if (this._bMessageOpen) {
					return;
				}
				MessageToast.show(this._extractError(sDetails));
				/**
				this._bMessageOpen = true;
				MessageBox.error(
					this._sErrorText,
					{
						id : "serviceErrorMessageBox",
						details : this._extractError(sDetails),
						styleClass : this._oComponent.getContentDensityClass(),
						actions : [MessageBox.Action.CLOSE],
						onClose : function () {
							this._bMessageOpen = false;
						}.bind(this)
					}
				);
				*/
			}

		});

	}
);