jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"ts/test/integration/NavigationJourneyPhone",
		"ts/test/integration/NotFoundJourneyPhone",
		"ts/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});