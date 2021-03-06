sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox"

], function (BaseController, JSONModel, MessageBox) {
	"use strict";

	return BaseController.extend("ts.controller.CreateBooking", {

		_oBinding: {},

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			var that = this;
			this._oResourceBundle = this.getResourceBundle();
			this._oViewModel = new JSONModel({
				enableCreate: false,
				delay: 0,
				busy: false,
				mode: "create",
				viewTitle: "",
				flightClasses: [
					{ key: "C", text: "Economy" },
					{ key: "Y", text: "Business" },
					{ key: "F", text: "First" }
				]
			});
			this._oODataModel = this.getOwnerComponent().getModel();
			this.getRouter().getRoute("createBooking").attachPatternMatched(this._onCreate, this);
			this.getRouter().getRoute("editBooking").attachPatternMatched(this._onEdit, this);
			// this.getRouter().getTargets().getTarget("editBooking").attachDisplay(null, this._onEdit, this);

			this.setModel(this._oViewModel, "viewModel");
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler (attached declaratively) for the view save button. Saves the changes added by the user. 
		 * @function
		 * @public
		 */
		onSave: function () {
			var that = this,
				oModel = this.getModel();

			// abort if the  model has not been changed
			if (!oModel.hasPendingChanges()) {
				MessageBox.information(
					this._oResourceBundle.getText("noChangesMessage"), {
						id: "noChangesInfoMessageBox",
						styleClass: that.getOwnerComponent().getContentDensityClass()
					}
				);
				return;
			}
			console.log(this._oViewModel);
			this.getModel("appView").setProperty("/busy", true);
			if (this._oViewModel.getProperty("/mode") === "edit") {
				// attach to the request completed event of the batch
				oModel.attachEventOnce("batchRequestCompleted", function (oEvent) {
					if (that._checkIfBatchRequestSucceeded(oEvent)) {
						that._fnUpdateSuccess();
					} else {
						that._fnEntityCreationFailed();
						MessageBox.error(that._oResourceBundle.getText("updateError"));
					}
				});
			}
			console.log(oModel);
			oModel.submitChanges();
		},

		_checkIfBatchRequestSucceeded: function (oEvent) {
			var oParams = oEvent.getParameters();
			var aRequests = oEvent.getParameters().requests;
			var oRequest;
			if (oParams.success) {
				if (aRequests) {
					for (var i = 0; i < aRequests.length; i++) {
						oRequest = oEvent.getParameters().requests[i];
						if (!oRequest.success) {
							return false;
						}
					}
				}
				return true;
			} else {
				return false;
			}
		},

		/**
		 * Event handler (attached declaratively) for the view cancel button. Asks the user confirmation to discard the changes. 
		 * @function
		 * @public
		 */
		onCancel: function () {
			// check if the model has been changed
			if (this.getModel().hasPendingChanges()) {
				// get user confirmation first
				this._showConfirmQuitChanges(); // some other thing here....
			} else {
				this.getModel("appView").setProperty("/addEnabled", true);
				// cancel without confirmation
				this._navBack();
			}
		},

		/* =========================================================== */
		/* Internal functions
		/* =========================================================== */

		/**
		 * Prepares the view for editing the selected object
		 * @param {sap.ui.base.Event} oEvent the display event
		 * @private
		 */
		_onEdit: function (oEvent) {
			this.getView().unbindObject();
			var oData = oEvent.getParameter("arguments"),
				oView = this.getView();

			this._oViewModel.setProperty("/mode", "edit");
			this._oViewModel.setProperty("/enableCreate", true);
			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("editViewTitle"));

			oView.bindElement({
				path: decodeURIComponent(oData.objectPath)
			});
		},

		/**
		 * Prepares the view for creating new object
		 * @param {sap.ui.base.Event} oEvent the  display event
		 * @private
		 */
		_onCreate: function (oEvent) {
			var oView = this.getView();
			this.getView().unbindObject();
			var urlArguments = oEvent.getParameter("arguments");
			this._oViewModel.setProperty("/mode", "create");
			this._oViewModel.setProperty("/enableCreate", true);
			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("createViewTitle"));

			var oContext = this._oODataModel.createEntry("SBOOKSet", {
				properties: {
					Connid: decodeURIComponent(urlArguments.Connid),
					Carrid: decodeURIComponent(urlArguments.Carrid),
					Fldate: new Date(decodeURIComponent(urlArguments.Fldate))
				},
				success: this._fnEntityCreated.bind(this),
				error: this._fnEntityCreationFailed.bind(this)
			});

			oView.setBindingContext(oContext);
		},

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Details page
		 * @private
		 */
		_navBack: function () {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();
			var oBindingContext = this.getView().getBindingContext();
			this.getView().unbindObject();
			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				var routingParams = {
					Carrid: encodeURIComponent(oBindingContext.getProperty("Carrid")),
					Connid: encodeURIComponent(oBindingContext.getProperty("Connid")),
					Fldate: encodeURIComponent(oBindingContext.getProperty("Fldate")),
				};
				this.getRouter().navTo("object", routingParams, true);
			}
		},

		/**
		 * Opens a dialog letting the user either confirm or cancel the quit and discard of changes.
		 * @private
		 */
		_showConfirmQuitChanges: function () {
			var oComponent = this.getOwnerComponent(),
				oModel = this.getModel();
			var that = this;
			MessageBox.confirm(
				this._oResourceBundle.getText("confirmCancelMessage"), {
					styleClass: oComponent.getContentDensityClass(),
					onClose: function (oAction) {
						if (oAction === sap.m.MessageBox.Action.OK) {
							that.getModel("appView").setProperty("/addEnabled", true);
							oModel.resetChanges();
							that._navBack();
						}
					}
				}
			);
		},

		/**
		 * Checks if the save button can be enabled
		 * @private
		 */
		_validateSaveEnablement: function () {
			var aInputControls = this._getFormFields(this.byId("newEntitySimpleForm"));
			var oControl;
			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sValue = oControl.getValue();
					if (!sValue) {
						this._oViewModel.setProperty("/enableCreate", false);
						return;
					}
				}
			}
			this._checkForErrorMessages();
		},

		/**
		 * Checks if there is any wrong inputs that can not be saved.
		 * @private
		 */

		_checkForErrorMessages: function () {
			var aMessages = this.getModel().oData;
			if (aMessages.length > 0) {
				var bEnableCreate = true;
				for (var i = 0; i < aMessages.length; i++) {
					if (aMessages[i].type === "Error" && !aMessages[i].technical) {
						bEnableCreate = false;
						break;
					}
				}
				this._oViewModel.setProperty("/enableCreate", bEnableCreate);
			} else {
				this._oViewModel.setProperty("/enableCreate", true);
			}
		},

		/**
		 * Handles the success of updating an object
		 * @private
		 */
		_fnUpdateSuccess: function () {
			var oBindingContext = this.getView().getBindingContext();
			var routingParams = {
				Carrid: encodeURIComponent(oBindingContext.getProperty("Carrid")),
				Connid: encodeURIComponent(oBindingContext.getProperty("Connid")),
				Fldate: encodeURIComponent(oBindingContext.getProperty("Fldate")),
			};
			this.getModel("appView").setProperty("/busy", false);
			var sObjectPath = this.getModel().createKey("/SFLIGHTSet", routingParams);
			// oBindingContext.getModel().getProperty(sObjectPath);
			// var oModel = new sap.ui.model.odata.ODataModel(sObjectPath);
			// sap.ui.getCore().setModel(oModel);
			// oBindingContext.getModel().refresh(true);
			// .getModel().refresh()
			// console.log(sObjectPath);
			this.getView().unbindObject();
			this.getRouter().navTo("object", routingParams, true);
		},

		/**
		 * Handles the success of creating an object
		 *@param {object} oData the response of the save action
		 * @private
		 */
		_fnEntityCreated: function (oData) {
			console.log("Create Entity Success");
			var sObjectPath = this.getModel().createKey("SBOOKSet", oData);
			var oBindingContext = this.getView().getBindingContext();
			oBindingContext.getModel().refresh(true);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath); //save last created
			this.getModel("appView").setProperty("/busy", false);
			var routingParams = {
				Carrid: encodeURIComponent(oData.Carrid),
				Connid: encodeURIComponent(oData.Connid),
				Fldate: encodeURIComponent(oData.Fldate)
			};
			this.getRouter().navTo("object", routingParams, true);
		},

		/**
		 * Handles the failure of creating/updating an object
		 * @private
		 */
		_fnEntityCreationFailed: function () {
			console.log("Create Entity Failed");
			this.getModel("appView").setProperty("/busy", false);
		},

		/**
		 * Gets the form fields
		 * @param {sap.ui.layout.form} oSimpleForm the form in the view.
		 * @private
		 */
		_getFormFields: function (oSimpleForm) {
			var aControls = [];
			var aFormContent = oSimpleForm.getContent();
			var sControlType;
			for (var i = 0; i < aFormContent.length; i++) {
				sControlType = aFormContent[i].getMetadata().getName();
				if (sControlType === "sap.m.Input" || sControlType === "sap.m.DateTimeInput" ||
					sControlType === "sap.m.CheckBox" || sControlType === "sap.m.ComboBox") {
					aControls.push({
						control: aFormContent[i],
						required: aFormContent[i - 1].getRequired && aFormContent[i - 1].getRequired()
					});
				}
			}
			return aControls;
		}
	});
});