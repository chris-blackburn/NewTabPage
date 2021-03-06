(function(angular) {
	var factoryFunction = function(_, eventManagerFactory, preferencesManagerFactory, labelLinkFactory, EVENTS) {
		var myCommands = {
			addLabelLinkPair: function(args) {
				preferencesManagerFactory.addLabelLinkPair(args[1], args[2]);
				eventManagerFactory.publish(EVENTS.STATUS_UPDATE, {
					message: "Pair added",
					success: true
				});
			},

			removeLabelLinkPair: function(args) {
				preferencesManagerFactory.removeLabelLinkPair(args[1]);
				eventManagerFactory.publish(EVENTS.STATUS_UPDATE, {
					message: "Pair removed",
					success: true
				});
			},

			updateLabelLinkPair: function(args) {
				preferencesManagerFactory.updateLabelLinkPair(args[1], args[2]);
				eventManagerFactory.publish(EVENTS.STATUS_UPDATE, {
					message: "Pair updated",
					success: true
				});
			},

			setFontColor: function(args) {
				var setResponse = preferencesManagerFactory.setFontColor(args[1], args[2]);
				eventManagerFactory.publish(EVENTS.STATUS_UPDATE, setResponse);
			},

			setFontFamily: function(args) {
				var setResponse = preferencesManagerFactory.setFontFamily(args[1], args[2]);
				eventManagerFactory.publish(EVENTS.STATUS_UPDATE, setResponse);
			},

			setBackgroundColor: function(args) {
				var setResponse = preferencesManagerFactory.setBackgroundColor(args[1], args[2]);
				eventManagerFactory.publish(EVENTS.STATUS_UPDATE, setResponse);
			},

			savePreferences: function() {
				preferencesManagerFactory.savePreferences();
				eventManagerFactory.publish(EVENTS.STATUS_UPDATE, {
					message: "Preferences saved",
					success: true
				});
			},

			setSearchQuery: function(args) {
				preferencesManagerFactory.setSearchQuery(args[1]);
				eventManagerFactory.publish(EVENTS.STATUS_UPDATE, {
					message: "Pair Search query set",
					success: true
				});
			},

			exportPreferences: function() {
				preferencesManagerFactory.exportPreferences();
				eventManagerFactory.publish(EVENTS.STATUS_UPDATE, {
					message: "Preferences exported",
					success: true
				});
			},

			importPreferences: function(args) {
				preferencesManagerFactory.importPreferences(args[1]);
				eventManagerFactory.publish(EVENTS.STATUS_UPDATE, {
					message: "Preferences imported",
					success: true
				});
			}
		};

		var myPrivate = {
			currentInput: "",
			displayableCharRegex: /^[-a-zA-Z0-9!@#$%^&*()_+=\[\]{}:;"',./<>?\\|`~]$/,

			isKeyDisplayable: function(key) {
				return myPrivate.displayableCharRegex.test(key);
			},

			signalInputUpdated: function() {
					eventManagerFactory.publish(EVENTS.CURRENT_INPUT_UPDATED, myPrivate.currentInput);
			},

			handleCommand: function() {
				var argRegexp = /(?:([^\s"]+)|"([^"]*)")+/g;
				var argString = _.trimStart(myPrivate.currentInput, ":");
				var args = [];

				do {
					var match = argRegexp.exec(argString);
					if (match) {
						if (match[1]) {
							args.push(match[1]);
						} else if (match[2]) {
							args.push(match[2]);
						}
					}
				} while (match);

				if (args[0] === "add" || args[0] === "a") {
					myCommands.addLabelLinkPair(args);
				} else if (args[0] === "remove" || args[0] === "r") {
					myCommands.removeLabelLinkPair(args);
				} else if (args[0] === "update" || args[0] === "u") {
					myCommands.updateLabelLinkPair(args);
				} else if (args[0] === "saveLocal" || args[0] === "sl") {
					myCommands.savePreferences();
				} else if (args[0] === "setSearchQuery" || args[0] === "ssq") {
					myCommands.setSearchQuery(args);
				} else if (args[0] === "exportPreferences" || args[0] === "ep") {
					myCommands.exportPreferences();
				} else if (args[0] === "importPreferences" || args[0] === "ip") {
					myCommands.importPreferences(args);
				} else if (args[0] === "setFontColor" || args[0] === "sfc") {
					myCommands.setFontColor(args);
				} else if (args[0] === "setFontFamily" || args[0] === "sff") {
					myCommands.setFontFamily(args);
				} else if (args[0] === "setBackgroundColor" || args[0] === "sbc") {
					myCommands.setBackgroundColor(args);
				}

				else {
					eventManagerFactory.publish(EVENTS.STATUS_UPDATE, {
						message: "No such command",
						success: false
					});
				}
			},

			search: function() {
				window.location.href = preferencesManagerFactory.getSearchQuery() +
					encodeURIComponent(myPrivate.currentInput);
			},

			findMatch: function() {
				var match = labelLinkFactory.getTopMatch();
				if (match !== null) {
					window.location.href = match.link;
				} else {

					// If there are no matches, then just search using the user's search
					// engine
					myPrivate.search();
				}
			},

			processCurrentInput: function() {
				if (_.head(myPrivate.currentInput) === ":") {
					myPrivate.handleCommand();
				} else {
					myPrivate.findMatch();
				}

				myPrivate.currentInput = "";
			}
		};

		var myPublic = {
			processKeyDownEvent: function(e) {

				// Ignore everything when the ctrl key is pressed
				if (!e.ctrlKey) {

					// TODO: add cycling through the preferences list with arrow keys
					if (myPrivate.isKeyDisplayable(e.key)) {
						myPrivate.currentInput += e.key;
					} else if (e.key === "Backspace") {
						myPrivate.currentInput = myPrivate.currentInput.slice(0, -1);
					} else if (e.key === "Escape") {
						myPrivate.currentInput = "";
					} else if (e.key === " " && myPrivate.currentInput.slice(-1) !== " ") {
						myPrivate.currentInput += " ";
					} else if (e.key === "Enter") {
						myPrivate.processCurrentInput();
					}

					myPrivate.signalInputUpdated();
				}
			},

			processPasteEvent: function(e) {
				var clipboardData = e.clipboardData || window.clipboardData;
				myPrivate.currentInput += clipboardData.getData("Text");
				myPrivate.signalInputUpdated();
			},

			processFileUpload: function(e) {
				e.preventDefault();
				var file = e.dataTransfer.files[0];
				reader = new FileReader();

				if (file.type === "application/json") {
					reader.onload = function(e) {
						myCommands.importPreferences([null, e.target.result]);
					}

					reader.readAsText(file);
				} else if (file.type === "image/png" || file.type === "image/jpeg") {
					reader.onload = function(e) {
						preferencesManagerFactory.setImage(e.target.result);
					}

					reader.readAsDataURL(file);
				} else {
					eventManagerFactory.publish(EVENTS.STATUS_UPDATE, {
						message: "Not a supported file type",
						success: false
					});
				}
			},

			getCurrentInput: function() {
				return myPrivate.currentInput;
			},
		};

		return myPublic;
	};

	var factoryDependencies = ["_", "eventManagerFactory", "preferencesManagerFactory", "labelLinkFactory", "EVENTS"];

	factoryDependencies.push(factoryFunction);
	angular.module("inputManager").factory("inputManagerFactory", factoryDependencies);
}(angular));
