jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 SFLIGHTSet in the list
// * All 3 SFLIGHTSet have at least one SBOOK

sap.ui.require([
	"sap/ui/test/Opa5",
	"ts/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"ts/test/integration/pages/App",
	"ts/test/integration/pages/Browser",
	"ts/test/integration/pages/Master",
	"ts/test/integration/pages/Detail",
	"ts/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "ts.view."
	});

	sap.ui.require([
		"ts/test/integration/MasterJourney",
		"ts/test/integration/NavigationJourney",
		"ts/test/integration/NotFoundJourney",
		"ts/test/integration/BusyJourney"
	], function () {
		QUnit.start();
	});
});