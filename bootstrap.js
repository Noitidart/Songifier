// Imports
const {interfaces: Ci, utils: Cu} = Components;
const { require } = Cu.import('resource://gre/modules/commonjs/toolkit/require.js', {}); // const COMMONJS_URI = 'resource://gre/modules/commonjs';
Cu.import('resource:///modules/CustomizableUI.jsm');
Cu.import('resource://gre/modules/Services.jsm');

const CLIPBOARD = require('sdk/clipboard');

// start - beutify stuff
var gBeautify = {};
(function() {
	var { require } = Cu.import('resource://devtools/shared/Loader.jsm', {});
	var { jsBeautify } = require('devtools/shared/jsbeautify/src/beautify-js');
	gBeautify.js = jsBeautify;
}());
// end - beutify stuff


// Globals
var core = { // core has stuff added into by MainWorker (currently MainWorker) and then it is updated
	addon: {
		// l10n: - added by worker
		name: 'Songifier',
		id: 'Songifier@jetpack',
		path: {
			name: 'songifier',
			content: 'chrome://songifier/content/',
			images: 'chrome://songifier/content/resources/images/',
			locale: 'chrome://songifier/locale/',
			modules: 'chrome://songifier/content/modules/',
			resources: 'chrome://songifier/content/resources/',
			scripts: 'chrome://songifier/content/resources/scripts/',
			styles: 'chrome://songifier/content/resources/styles/'
		},
		prefbranch: 'extensions.Songifier@jetpack.',
		prefs: {},
		cache_key: Math.random() // set to version on release
	},
	os: {
		// worker adds: // name: OS.Constants.Sys.Name.toLowerCase(),
		// worker adds: // mname: core.os.toolkit.indexOf('gtk') == 0 ? 'gtk' : core.os.name; // mname stands for modified-name // this will treat solaris, linux, unix, *bsd systems as the same. as they are all gtk based
		// version: // added by worker

		toolkit: Services.appinfo.widgetToolkit.toLowerCase(),
		xpcomabi: Services.appinfo.XPCOMABI
	},
	firefox: {
		pid: Services.appinfo.processID,
		version: Services.appinfo.version,
		channel: Services.prefs.getCharPref('app.update.channel')
	}
};

var gCuiCssFilename;
var gCuiCssUri;
var gGenCssUri;
var gWorkerComm;
var gStore = [];

function cuiClick(e) {
	var aDOMWin = e.target.ownerDocument.defaultView;

	// gWorkerComm.postMessage('')
	initRecord();


}

function initRecord() {
	var cAttnBarInstState = add({
		aPriority: 1,
		aPos: 1,
		aTxt: formatStringFromNameCore('init_mic', 'main'),
		aIcon: core.addon.path.images + 'dark16.png'
	});

	var storeEntry = getById(cAttnBarInstState.aId);
	gWorkerComm.postMessage('transcribeEntry', {storeEntry});

	var w = Services.appShell.hiddenDOMWindow;
	w.navigator.mediaDevices.getUserMedia({
		audio: true
	}).then(function (stream) {
		// do something with the stream
		var recorder = new w.MediaRecorder(stream);
		recorder.mimeType = 'audio/ogg';
		storeEntry.recorder = recorder;

		gWorkerComm.postMessage('startRecord', {aId:storeEntry.abinst.aId});

		recorder.addEventListener('dataavailable', function(e) {
			// console.log('data avail, e:')

			delete storeEntry.recorder;
			var fileReader = new w.FileReader();
			fileReader.onload = function() {
				var arrbuf = this.result;
				gWorkerComm.postMessage('doneRecord', {aId:cAttnBarInstState.aId, arrbuf}, [arrbuf]);
			};
			fileReader.readAsArrayBuffer(e.data);
		}, false);

	}, function(aReason) {
		console.error('failed, aReason:', aReason);
		updateAttnBar({
			aId: cAttnBarInstState.aId,
			aState: {
				aTxt: formatStringFromNameCore('failed_mic', 'main')
			}
		});
	});
}

function stopRecord(aArg, aComm) {
	var { aId } = aArg;
	var storeEntry = getById(aId);
	storeEntry.recorder.stop();
}

function startRecord(aArg, aComm) {
	var { aId, aSeconds } = aArg;
	var storeEntry = getById(aId);
	storeEntry.recorder.start();
	countdownRecord({aId, aSeconds}, aComm);
}

function countdownRecord(aArg, aComm) {
	var { aId, aSeconds } = aArg;
	var storeEntry = getById(aId);
	updateAttnBar({
		aId,
		aState: {
			aTxt: formatStringFromNameCore('listening_mic', 'main', [aSeconds])
		}
	});
}

function openUrl(aUrl) {
	var w = Services.wm.getMostRecentWindow('navigator:browser');
	w.gBrowser.loadOneTab(aUrl, {
		inBackground: false,
		relatedToCurrent: false
	});
}

function openMultiple(aMusicArr) {
	var w = Services.wm.getMostRecentWindow('navigator:browser');
	w.gBrowser.loadOneTab('data:text/plain,' + encodeURIComponent(gBeautify.js(JSON.stringify(aMusicArr))), {
		inBackground: false,
		relatedToCurrent: false
	});
}

function playRecording(aId) {
	var storeEntry = getById(aId);
	var w = Services.wm.getMostRecentWindow('navigator:browser');
	var audioEl = w.document.createElementNS('http://www.w3.org/1999/xhtml', 'audio');
	w.document.documentElement.appendChild(audioEl);
	audioEl.setAttribute('autoplay', 'true');
	audioEl.addEventListener('ended', function() {
		// Services.prompt.alert(null, 'done', 'done');
		audioEl.parentNode.removeChild(audioEl);
	});
	audioEl.src = storeEntry.abinst.fixed_metadata.url;
	// audioEl.play();
}

function updateAttnBar(aArg, aComm) {
	var { aId, aState } = aArg;
	var storeEntry = getById(aId);
	var newState = {};
	var oldState = storeEntry.abinst;
	Object.assign(newState, oldState);
	Object.assign(newState, aState);

	if (newState.aTxt != oldState.aTxt) {
		switch (newState.aTxt) {
			case formatStringFromNameCore('server_error', 'main'):

					newState.aBtns = [
						{
							bTxt: formatStringFromNameCore('server_retry', 'main'),
							bClick: function(doClose, aBrowser) {
								gWorkerComm.postMessage('doneRecord', {aId});
							}
						}
					];

				break;
			case formatStringFromNameCore('submitting_recording', 'main'):

					newState.aBtns = null;

				break;
			case formatStringFromNameCore('server_multiplematches', 'main'):

					newState.aBtns = [
						{
							bTxt: formatStringFromNameCore('show_multi', 'main'),
							bClick: function(doClose, aBrowser) {
								openMultiple(newState.metadata.music)
							}
						}
					];

				break;
			case formatStringFromNameCore('server_match_set_txt_from_metadata', 'main'):

					var copyTxt = formatStringFromNameCore('song_title_artist', 'main', [newState.metadata.title, newState.metadata.artist]);
					newState.aTxt = formatStringFromNameCore('server_matchfound_song_title_artist', 'main', [formatStringFromNameCore('song_title_artist', 'main', [newState.metadata.title, newState.metadata.artist])]);
					newState.aBtns = [
						{
							bTxt: formatStringFromNameCore('open_youtube', 'main'),
							bClick: function(doClose, aBrowser) {
								openUrl(newState.metadata.youtubeUrl);
							},
							bIcon: core.addon.path.images + 'youtube-16.png'
						},
						{
							bTxt: formatStringFromNameCore('open_itunes', 'main'),
							bClick: function(doClose, aBrowser) {
								openUrl(newState.metadata.itunesUrl);
							},
							bIcon: core.addon.path.images + 'itunes-16.png'
						},
						// {
						// 	bTxt: formatStringFromNameCore('open_spotify', 'main'),
						// 	bClick: function(doClose, aBrowser) {
						// 		openUrl(newState.metadata.spotifyUrl);
						// 	},
						// 	bIcon: core.addon.path.images + 'spotify-16.png'
						// },
						{
							bTxt: formatStringFromNameCore('copy', 'main'),
							bClick: function(doClose, aBrowser) {
								CLIPBOARD.set(copyTxt, 'text');
							},
							bIcon: core.addon.path.images + 'copy-16.png'
						}
					];

				break;
			default:

				// check if it is listenting
				var listenPreReplace = formatStringFromNameCore('listening_mic', 'main');
				var ixReplace = listenPreReplace.indexOf('%');
				listenPreReplace = listenPreReplace.substr(0, ixReplace);
				if (newState.aTxt.substr(0, ixReplace) == listenPreReplace) {
					newState.aBtns = [
						{
							bTxt: formatStringFromNameCore('stop_recording', 'main'),
							bClick: function(doClose, aBrowser) {
								updateAttnBar(
									{
										aId,
										aState: {
											aTxt: formatStringFromNameCore('stopping_record', 'main'),
											aBtns: []
										}
									},
									aComm
								);
								gWorkerComm.postMessage('mergeEntry', {
									aId,
									aMergeObj: {
										secleft: 1
									}
								});
							}
						}
					];
				}
		}
	}

	if (newState.fixed_metadata && newState.fixed_metadata.url) {
		if (!newState.aBtns) {
			newState.aBtns = [];
		}
		var foundPlayRecording = false;
		for (var i=0; i<newState.aBtns.length; i++) {
			if (newState.aBtns[i].bTxt == formatStringFromNameCore('play_recording', 'main')) {
				foundPlayRecording = true;
				break;
			}
		}
		if (!foundPlayRecording) {
			newState.aBtns.splice(0, 0, {
				bTxt: formatStringFromNameCore('play_recording', 'main'),
				bIcon: core.addon.path.images + 'play-16.png',
				bClick: function(doClose, aBrowser) {
					playRecording(aId);
				}
			});
		}
	}

	storeEntry.abinst = newState;
	AB.setState(storeEntry.abinst);
}
// store functions
function add(aAbInstProps) {
	var abinst = AB.setState(aAbInstProps);
	var storeEntry = {abinst};
	gStore.push(storeEntry);
	abinst.aClose = function(aBrowser) {
		// Services.prompt.alert(Services.wm.getMostRecentWindow(null), 'closing', 'closing');
		removeById(abinst.aId);
		gWorkerComm.postMessage('removeById', abinst.aId);
	};
	return AB.setState(abinst);
}
function removeById(aId) {
	// returns true on success, false on fail
	var l = gStore.length;
	for (var i=0; i<l; i++) {
		var entry = gStore[i];
		if (entry.abinst.aId === aId) {
			gStore.splice(i, 1);
			return true;
		}
	}

	return false;
}

function getById(aId) {
	// returns entry on success, null if not found
	var l = gStore.length;
	for (var i=0; i<l; i++) {
		var entry = gStore[i];
		if (entry.abinst.aId === aId) {
			return entry;
		}
	}
	return null;
}

var windowListener = {
	//DO NOT EDIT HERE
	onOpenWindow: function (aXULWindow) {
		// Wait for the window to finish loading
		var aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
		aDOMWindow.addEventListener('load', function () {
			aDOMWindow.removeEventListener('load', arguments.callee, false);
			windowListener.loadIntoWindow(aDOMWindow);
		}, false);
	},
	onCloseWindow: function (aXULWindow) {},
	onWindowTitleChange: function (aXULWindow, aNewTitle) {},
	register: function () {

		// Load into any existing windows
		let DOMWindows = Services.wm.getEnumerator(null);
		while (DOMWindows.hasMoreElements()) {
			let aDOMWindow = DOMWindows.getNext();
			if (aDOMWindow.document.readyState == 'complete') { //on startup `aDOMWindow.document.readyState` is `uninitialized`
				windowListener.loadIntoWindow(aDOMWindow);
			} else {
				aDOMWindow.addEventListener('load', function () {
					aDOMWindow.removeEventListener('load', arguments.callee, false);
					windowListener.loadIntoWindow(aDOMWindow);
				}, false);
			}
		}
		// Listen to new windows
		Services.wm.addListener(windowListener);
	},
	unregister: function () {
		// Unload from any existing windows
		let DOMWindows = Services.wm.getEnumerator(null);
		while (DOMWindows.hasMoreElements()) {
			let aDOMWindow = DOMWindows.getNext();
			windowListener.unloadFromWindow(aDOMWindow);
		}
		/*
		for (var u in unloaders) {
			unloaders[u]();
		}
		*/
		//Stop listening so future added windows dont get this attached
		Services.wm.removeListener(windowListener);
	},
	//END - DO NOT EDIT HERE
	loadIntoWindow: function (aDOMWindow) {
		if (!aDOMWindow) { return }

		if (aDOMWindow.gBrowser) {
			var domWinUtils = aDOMWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
			domWinUtils.loadSheet(gCuiCssUri, domWinUtils.AUTHOR_SHEET);
			domWinUtils.loadSheet(gGenCssUri, domWinUtils.AUTHOR_SHEET);
		}
	},
	unloadFromWindow: function (aDOMWindow) {
		if (!aDOMWindow) { return }

		if (aDOMWindow.gBrowser) {
			var domWinUtils = aDOMWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
			domWinUtils.removeSheet(gCuiCssUri, domWinUtils.AUTHOR_SHEET);
			domWinUtils.removeSheet(gGenCssUri, domWinUtils.AUTHOR_SHEET);
		}
	}
};

// bootstrap
function install() {}
function uninstall() {}
function startup(aData, aReason) {
	gWorkerComm = new workerComm(core.addon.path.scripts + 'MainWorker.js?' + core.addon.cache_key, ()=>{return core}, function(aArg, aComm) {

		core = aArg;

		AB.init();

		// determine gCuiCssFilename for windowListener.register
		if (Services.prefs.getCharPref('app.update.channel') == 'aurora') {
			if (core.os.mname != 'darwin') {
				// i didnt test dev edition on winxp, not sure what it is there
				gCuiCssFilename = 'cui_dev.css';
			} else {
				gCuiCssFilename = 'cui_dev_mac.css';
			}
		} else {
			if (core.os.mname == 'darwin') {
				gCuiCssFilename = 'cui_mac.css';
			} else if (core.os.mname == 'gtk') {
				gCuiCssFilename = 'cui_gtk.css';
			} else {
				// windows
				if (core.os.version <= 5.2) {
					// xp
					gCuiCssFilename = 'cui_gtk.css';
				} else {
					gCuiCssFilename = 'cui.css';
				}
			}
		}
		gCuiCssUri = Services.io.newURI(core.addon.path.styles + gCuiCssFilename, null, null);
		gGenCssUri = Services.io.newURI(core.addon.path.styles + 'general.css', null, null);

		// window listener
		windowListener.register();

		// insert cui
		CustomizableUI.createWidget({
			id: 'cui_songifier',
			defaultArea: CustomizableUI.AREA_NAVBAR,
			label: formatStringFromNameCore('cui_lbl', 'main'),
			tooltiptext: formatStringFromNameCore('cui_tip', 'main'),
			onCommand: cuiClick
		});

	});
	gWorkerComm.postMessage('instantInstantiation');
}
function shutdown(aData, aReason) {
	if (aReason == APP_SHUTDOWN) { return }

	AB.uninit();

	CustomizableUI.destroyWidget('cui_songifier');

	windowListener.unregister();

	workerComm_unregAll();
}

// start - AttentionBar mixin
var AB = { // AB stands for attention bar
	// based on https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/notificationbox#Methods && https://dxr.mozilla.org/mozilla-central/source/toolkit/content/widgets/notification.xml#79
	Insts: {
		/*
		##: {
			state: avail in bootstrap only. the dom does a JSON.parse(JSON.stringify()) on this when updating from it
			setState: avail only in dom, its the react connection to it
			callbackids: {}, only in bootstrap, used for help cleaning up on destroy. key is id of callback, value is meaningless
		}
		*/
	}, // holds all instances
	domIdPrefix: core.addon.id.replace(/[^a-z0-9-_\:\.]/ig,'AB'), // The ID and NAME elements must start with a letter i.e. upper case A to Z or lower case a to z; a number is not allowed. After the first letter any number of letters (a to z, A to Z), digits (0 to 9), hyphens (-), underscores (_), colons (:) and periods (.) are allowed. // http://www.electrictoolbox.com/valid-characters-html-id-attribute/
	Callbacks: {},
	// key is nid, if nid is of a notification then the callback is a close callback, else it is of a click callback.
	// all Callbacks have last arg of aBrowser which is the xul browser element that was focused when user triggered the cb
	// click callbacks have first arg doClose, you should call doClose(aBrowser) if you want to close out the AB
	// callbacks this is bound to useful stuff. all are passed by reference so modifying that modfieis the entry in AB.Insts
		// for example clicking a menu item:
			// this: Object { inststate: Object, btn: Object, menu: Array[2], menuitem: Object } bootstrap.js:501
		// clicking btn, inst will have inststate and btn
		// closing this has inststate only
	nid: -1, // stands for next_id, used for main toolbar, and also for each button, and also each menu item
	/*
	{
		id: genned id, each id gets its own container in aDOMWindow
		desc: aDesc,
		comp: stands for react component, this gets rendered
	}
	*/
	setStateDestroy: function(aInstId) {
		// destroys, and cleans up, this does not worry about callbacks. the nonDevUserSpecifiedCloseCb actually calls this

		// unmount from all windows dom && delete from all windows js
		var doit = function(aDOMWindow) {
			// start - copy block link77728110
			if (!aDOMWindow.gBrowser) {
				return; // because i am targeting cDeck, windows without gBrowser won't have it
			}
			var winAB = aDOMWindow[core.addon.id + '-AB'];
			if (winAB) {
				if (aInstId in winAB.Insts) {
					// unmount this
					console.error('aInstId:', aInstId, 'notificationbox-' + aInstId + '--' + AB.domIdPrefix);
					var cNotificationBox = aDOMWindow.document.getElementById('notificationbox-' + aInstId + '--' + AB.domIdPrefix);
					aDOMWindow.ReactDOM.unmountComponentAtNode(cNotificationBox);
					cNotificationBox.parentNode.removeChild(cNotificationBox);
					delete winAB.Insts[aInstId];
				}
			}
			// end - copy block link77728110
		};

		var DOMWindows = Services.wm.getEnumerator(null);
		while (DOMWindows.hasMoreElements()) {
			var aDOMWindow = DOMWindows.getNext();
			if (aDOMWindow.document.readyState == 'complete') { //on startup `aDOMWindow.document.readyState` is `uninitialized`
				doit(aDOMWindow);
			}//  else { // not complete means its impossible it has this aInstId mounted in here
				// // aDOMWindow.addEventListener('load', function () {
				// // 	aDOMWindow.removeEventListener('load', arguments.callee, false);
				// // 	doit(aDOMWindow);
				// // }, false);
			//}
		}

		// delete callbacks
		for (var aCallbackId in AB.Insts[aInstId].callbackids) {
			delete AB.Callbacks[aCallbackId];
		}

		// delete from bootstrap js
		delete AB.Insts[aInstId];
	},
	setState: function(aInstState) { // :note: aInstState is really aInstStateState
		// this function will add to aInstState and all bts in aInstState.aBtns a id based on this.genId()
		// this function also sends setState message to all windows to update this instances
		// aInstState should be strings only, as it is sent to all windows

		// :note: to remove a callback you have to set it to an empty function - ```getScope().AB.Insts[0].state.aClose = function() {}; getScope().AB.setState(getScope().AB.Insts[0].state);```

		// RETURNS
			// updated aInstState


		var cInstDefaults = {
			// aId: this is auto added in
			aTxt: '', // this is the message body on the toolbar
			aPos: 0, // 1 for top, on where to append it
			aIcon: 'chrome://mozapps/skin/places/defaultFavicon.png', // icon on the toolbar
			aPriority: 1, // valid values 1-10
			aBtns: [], // must be array
			aHideClose: undefined, // if set to string 'true' or bool true, in dom it will get converted to string as 'true'. setting to 1 int will not work.
			aClose: undefined
		};

		/*
		aBtns: array of objects
		[
			{
				// bId - this is auto generated and stuck in here, with this.nid
				bIcon: optional, string to image path
				bTxt: required, text shown on button
				bKey: 'B', // access key
				bMenu: [
					{
						//mId: this is auto genned and added in here,
						mTxt: 'string'
					}
				]
			},
			{
				...
			}
		]
		*/

		if (!('aId' in aInstState)) {
			validateOptionsObj(aInstState, cInstDefaults);
			aInstState.aId = AB.genId();
			AB.Insts[aInstState.aId] = {
				state: aInstState,
				callbackids: {}
			};
			AB.Callbacks[aInstState.aId] = function(aBrowser) {
				AB.nonDevUserSpecifiedCloseCb(aInstState.aId, aBrowser); // this one doesnt need bind, only devuser callbacks are bound
			};
			AB.Insts[aInstState.aId].callbackids[aInstState.aId] = 1; // the close callback id
		}
		if (aInstState.aClose) {
			var aClose = aInstState.aClose.bind({inststate:aInstState});
			delete aInstState.aClose;

			AB.Callbacks[aInstState.aId] = function(aBrowser) {
				var rez_aClose = aClose(aBrowser);
				if (rez_aClose !== false) { // :note: if onClose returns false, it cancels the closing
					AB.nonDevUserSpecifiedCloseCb(aInstState.aId, aBrowser); // this one doesnt need bind, only devuser callbacks are bound
				}
			};

		}

		// give any newly added btns and menu items an id
		if (aInstState.aBtns) {
			for (var i=0; i<aInstState.aBtns.length; i++) {
				if (!('bId' in aInstState.aBtns[i])) {
					aInstState.aBtns[i].bId = AB.genId();
				}
				if (aInstState.aBtns[i].bClick) { // i dont do this only if bId is not there, because devuser can change it up. i detect change by presenence of the bClick, because after i move it out of state obj and into callbacks obj, i delete it from state obj. so its not here unless changed
					AB.Insts[aInstState.aId].callbackids[aInstState.aBtns[i].bId] = 1; // its ok if it was already there, its the same one ill be removing
					AB.Callbacks[aInstState.aBtns[i].bId] = aInstState.aBtns[i].bClick.bind({inststate:aInstState, btn:aInstState.aBtns[i]}, AB.Callbacks[aInstState.aId]);
					delete aInstState.aBtns[i].bClick; // AB.Callbacks[aInstState.aId] is the doClose callback devuser should call if they want it to close out
				}
				if (aInstState.aBtns[i].bMenu) {
					AB.iterMenuForIdAndCbs(aInstState.aBtns[i].bMenu, aInstState.aId, aInstState.aBtns[i]);
				}
			}
		}

		// go through all windows, if this id is not in it, then mount it, if its there then setState on it

		var doit = function(aDOMWindow) {
			// start - orig block link181888888
			if (!aDOMWindow.gBrowser) {
				return; // because i am targeting cDeck, windows without gBrowser won't have it
			}
			AB.ensureInitedIntoWindow(aDOMWindow);

			if (aInstState.aId in aDOMWindow[core.addon.id + '-AB'].Insts) {
				aDOMWindow[core.addon.id + '-AB'].Insts[aInstState.aId].state = aDOMWindow.JSON.parse(aDOMWindow.JSON.stringify(aInstState));
				aDOMWindow[core.addon.id + '-AB'].Insts[aInstState.aId].setState(JSON.parse(JSON.stringify(aInstState)));
			} else {
				// mount it
				aDOMWindow[core.addon.id + '-AB'].Insts[aInstState.aId] = {};
				aDOMWindow[core.addon.id + '-AB'].Insts[aInstState.aId].state = aDOMWindow.JSON.parse(aDOMWindow.JSON.stringify(aInstState));
				var cDeck = aDOMWindow.document.getElementById('content-deck');
				var cNotificationBox = aDOMWindow.document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'notificationbox');
				console.error('inserting', 'notificationbox-' + aInstState.aId + '--' + AB.domIdPrefix);
				cNotificationBox.setAttribute('id', 'notificationbox-' + aInstState.aId + '--' + AB.domIdPrefix);
				if (!aInstState.aPos) {
					cDeck.parentNode.appendChild(cNotificationBox);
				} else {
					cDeck.parentNode.insertBefore(cNotificationBox, cDeck); // for top
				}
				aDOMWindow[core.addon.id + '-AB'].Insts[aInstState.aId].relement = aDOMWindow.React.createElement(aDOMWindow[core.addon.id + '-AB'].masterComponents.Notification, aInstState);
				aDOMWindow.ReactDOM.render(aDOMWindow[core.addon.id + '-AB'].Insts[aInstState.aId].relement, cNotificationBox);
			}
			// end - orig block link181888888
		};

		// have to do this, because if i call setState with a new object, one that is not AB.Insts[aId] then it wont get updated, and when loadInstancesIntoWindow it will not have the updated one
		AB.Insts[aInstState.aId].state = aInstState;

		var DOMWindows = Services.wm.getEnumerator(null);
		while (DOMWindows.hasMoreElements()) {
			var aDOMWindow = DOMWindows.getNext();
			if (aDOMWindow.document.readyState == 'complete') { //on startup `aDOMWindow.document.readyState` is `uninitialized`
				doit(aDOMWindow);
			} else {
				aDOMWindow.addEventListener('load', function () {
					aDOMWindow.removeEventListener('load', arguments.callee, false);
					doit(aDOMWindow);
				}, false);
			}
		}

		return aInstState;
	},
	nonDevUserSpecifiedCloseCb: function(aInstId, aBrowser) {
		// this does the unmounting from all windows, and deletes entry from this.Insts

		// aBrowser.contentWindow.alert('ok this tab sent the close message for aInstId ' + aInstId);
		// on close go through and get all id's in there and remove all callbacks for it. and then unmount from all windows.
		AB.setStateDestroy(aInstId, true);
	},
	genId: function() {
		AB.nid++;
		return AB.nid;
	},
	iterMenuForIdAndCbs: function(jMenu, aCloseCallbackId, aBtnEntry) {
		// aCloseCallbackId is same as aInstId
		// aBtnArrEntry is reference as its the btn object in the .aBtns arr
		// goes through and gives every menuitem and submenu item (anything that has cTxt) an id, as they are clickable
		// ALSO moves cClick callbacks into AB.Callbacks
		jMenu.forEach(function(jEntry, jIndex, jArr) {
			if (!jEntry.cId && jEntry.cTxt) { // cId will NEVER be 0 but if it does it would be a problem with !jEntry.cId because first the notification bar is genId and the button is genId and nid starts at 0 so its at least 2 by first jMenu
				jEntry.cId = AB.genId();
				if (jEntry.cMenu) {
					AB.iterMenuForIdAndCbs(jEntry.cMenu, aCloseCallbackId, aBtnEntry);
				}
			}
			if (jEntry.cClick) { // i dont do this only if bId is not there, because devuser can change it up. i detect change by presenence of the bClick, because after i move it out of state obj and into callbacks obj, i delete it from state obj. so its not here unless changed
				AB.Insts[aCloseCallbackId].callbackids[jEntry.cId] = 1; // its ok if it was already there, its the same one ill be removing
				AB.Callbacks[jEntry.cId] = jEntry.cClick.bind({inststate:AB.Insts[aCloseCallbackId].state, btn:aBtnEntry, menu:jMenu, menuitem:jEntry}, AB.Callbacks[aCloseCallbackId]);
				delete jEntry.cClick; // AB.Callbacks[aInst.aId] is the doClose callback devuser should call if they want it to close out
			}
		});
	},
	uninitFromWindow: function(aDOMWindow) {
		if (!aDOMWindow[core.addon.id + '-AB']) {
			return;
		}
		console.error('doing uninit from window');
		// start - original block link77728110
		var winAB = aDOMWindow[core.addon.id + '-AB'];
		for (var aInstsId in winAB.Insts) {
			// unmount this
			console.error('aInstsId:', aInstsId, 'notificationbox-' + aInstsId + '--' + AB.domIdPrefix);
			var cNotificationBox = aDOMWindow.document.getElementById('notificationbox-' + aInstsId + '--' + AB.domIdPrefix);
			aDOMWindow.ReactDOM.unmountComponentAtNode(cNotificationBox);
			cNotificationBox.parentNode.removeChild(cNotificationBox);
		}
		// end - original block link77728110
		delete aDOMWindow[core.addon.id + '-AB'];
		console.error('done uninit');
		aDOMWindow.removeEventListener(core.addon.id + '-AB', AB.msgEventListener, false);
	},
	ensureInitedIntoWindow: function(aDOMWindow) {
		// dont run this yoruself, ensureInstancesToWindow runs this. so if you want to run yourself, then run ensureInstancesToWindow(aDOMWindow)
		if (!aDOMWindow[core.addon.id + '-AB']) {
			aDOMWindow[core.addon.id + '-AB'] = {
				Insts: {},
				domIdPrefix: AB.domIdPrefix
			}; // ab stands for attention bar
			if (!aDOMWindow.React) {
				console.log('WILL NOW LOAD IN REACT');
				// resource://devtools/client/shared/vendor/react.js
				Services.scriptloader.loadSubScript(core.addon.path.scripts + '3rd/react-with-addons.js?' + core.addon.cache_key, aDOMWindow); // even if i load it into aDOMWindow.blah and .blah is an object, it goes into global, so i just do aDOMWindow now
			}
			if (!aDOMWindow.ReactDOM) {
				console.log('WILL NOW LOAD IN REACTDOM');
				// resource://devtools/client/shared/vendor/react-dom.js
				Services.scriptloader.loadSubScript(core.addon.path.scripts + '3rd/react-dom.js?' + core.addon.cache_key, aDOMWindow);
			}
			Services.scriptloader.loadSubScript(core.addon.path.scripts + 'ab-react-components.js?' + core.addon.cache_key, aDOMWindow);
			aDOMWindow.addEventListener(core.addon.id + '-AB', AB.msgEventListener, false);
		}
	},
	init: function() {
		// Services.mm.addMessageListener(core.addon.id + '-AB', AB.msgListener);

		Services.wm.addListener(AB.winListener);

		// i dont iterate all windows now and do ensureInitedIntoWindow, because i only run ensureInitedIntoWindow when there is something to add, so its lazy

		// and its impossible that Insts exists before Init, so no need to iterate through all windows.
	},
	uninit: function() {
		// Services.mm.removeMessageListener(core.addon.id + '-AB', AB.msgListener);
		// trigger close of any open bars
		for (var aId in AB.Insts) {
			AB.Callbacks[aId]();
		}

		Services.wm.removeListener(AB.winListener);

		// go through all windows and unmount
		var DOMWindows = Services.wm.getEnumerator(null);
		while (DOMWindows.hasMoreElements()) {
			var aDOMWindow = DOMWindows.getNext();
			if (aDOMWindow[core.addon.id + '-AB']) {
				AB.uninitFromWindow(aDOMWindow);
			}
		}
	},
	msgEventListener: function(e) {
		console.error('getting aMsgEvent, data:', e.detail);
		var cCallbackId = e.detail.cbid;
		var cBrowser = e.detail.browser;
		if (AB.Callbacks[cCallbackId]) { // need this check because react components always send message on click, but it may not have a callback
			AB.Callbacks[cCallbackId](cBrowser);
		}
	},
	// msgListener: {
	// 	receiveMessage: function(aMsgEvent) {
	// 		var aMsgEventData = aMsgEvent.data;
	// 		console.error('getting aMsgEvent, data:', aMsgEventData);
	// 		// this means trigger a callback with id aMsgEventData
	// 		var cCallbackId = aMsgEventData;
	// 		var cBrowser = aMsgEvent.target;
	// 		if (AB.Callbacks[cCallbackId]) { // need this check because react components always send message on click, but it may not have a callback
	// 			AB.Callbacks[cCallbackId](cBrowser);
	// 		}
	// 	}
	// },
	loadInstancesIntoWindow: function(aDOMWindow) {
		// this function is called when there may be instances in AB.Insts but and it needs to be verified that its mounted in window
		// basically this is called when a new window is opened

		var idsInsts = Object.keys(AB.Insts);
		if (!idsInsts.length) {
			return;
		}

		var doit = function(aDOMWindow) {
			// check again, in case by the time window loaded, AB.Insts changed
			var idsInsts = Object.keys(AB.Insts);
			if (!idsInsts.length) {
				return;
			}

			// start - copy of block link181888888
			if (!aDOMWindow.gBrowser) {
				return; // because i am targeting cDeck, windows without gBrowser won't have it
			}

			AB.ensureInitedIntoWindow(aDOMWindow);

			for (var aInstId in AB.Insts) {
				var aInstState = AB.Insts[aInstId].state;
				if (aInstState.aId in aDOMWindow[core.addon.id + '-AB'].Insts) {
					console.error('this is really weird, it should never happen, as i only call this function when a new window opens');
					aDOMWindow[core.addon.id + '-AB'].Insts[aInstState.aId].state = aDOMWindow.JSON.parse(aDOMWindow.JSON.stringify(aInstState));
					aDOMWindow[core.addon.id + '-AB'].Insts[aInstState.aId].setState(JSON.parse(JSON.stringify(aInstState)));
				} else {
					// mount it
					aDOMWindow[core.addon.id + '-AB'].Insts[aInstState.aId] = {};
					aDOMWindow[core.addon.id + '-AB'].Insts[aInstState.aId].state = aDOMWindow.JSON.parse(aDOMWindow.JSON.stringify(aInstState));
					var cDeck = aDOMWindow.document.getElementById('content-deck');
					var cNotificationBox = aDOMWindow.document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'notificationbox');
					console.error('inserting', 'notificationbox-' + aInstState.aId + '--' + AB.domIdPrefix);
					cNotificationBox.setAttribute('id', 'notificationbox-' + aInstState.aId + '--' + AB.domIdPrefix);
					if (!aInstState.aPos) {
						cDeck.parentNode.appendChild(cNotificationBox);
					} else {
						cDeck.parentNode.insertBefore(cNotificationBox, cDeck); // for top
					}
					aDOMWindow[core.addon.id + '-AB'].Insts[aInstState.aId].relement = aDOMWindow.React.createElement(aDOMWindow[core.addon.id + '-AB'].masterComponents.Notification, aInstState);
					aDOMWindow.ReactDOM.render(aDOMWindow[core.addon.id + '-AB'].Insts[aInstState.aId].relement, cNotificationBox);
				}
				// end - copy of block link181888888
			}
		};


		if (aDOMWindow.document.readyState == 'complete') { //on startup `aDOMWindow.document.readyState` is `uninitialized`
			doit(aDOMWindow);
		} else {
			aDOMWindow.addEventListener('load', function () {
				aDOMWindow.removeEventListener('load', arguments.callee, false);
				doit(aDOMWindow);
			}, false);
		}

	},
	winListener: {
		onOpenWindow: function (aXULWindow) {
			// Wait for the window to finish loading
			var aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
			aDOMWindow.addEventListener('load', function () {
				aDOMWindow.removeEventListener('load', arguments.callee, false);
				AB.loadInstancesIntoWindow(aDOMWindow);
			}, false);
		},
		onCloseWindow: function (aXULWindow) {},
		onWindowTitleChange: function (aXULWindow, aNewTitle) {},
	}
};
// end - AttentionBar mixin

// start - common helper functions
function Deferred() {
	this.resolve = null;
	this.reject = null;
	this.promise = new Promise(function(resolve, reject) {
		this.resolve = resolve;
		this.reject = reject;
	}.bind(this));
	Object.freeze(this);
}
function genericReject(aPromiseName, aPromiseToReject, aReason) {
	var rejObj = {
		name: aPromiseName,
		aReason: aReason
	};
	console.error('Rejected - ' + aPromiseName + ' - ', rejObj);
	if (aPromiseToReject) {
		aPromiseToReject.reject(rejObj);
	}
}
function genericCatch(aPromiseName, aPromiseToReject, aCaught) {
	var rejObj = {
		name: aPromiseName,
		aCaught: aCaught
	};
	console.error('Caught - ' + aPromiseName + ' - ', rejObj);
	if (aPromiseToReject) {
		aPromiseToReject.reject(rejObj);
	}
}

function formatStringFromNameCore(aLocalizableStr, aPackageName, aReplacements) {
	// 052316 update - renamed 2nd arg - not a big deal
	// 051916 update - made it core.addon.l10n based
    // formatStringFromNameCore is formating only version of the worker version of formatStringFromName, it is based on core.addon.l10n cache

	// try {
	// 	var cLocalizedStr = core.addon.l10n[aPackageName][aLocalizableStr];
	// } catch (ex) {
	// 	console.error('formatStringFromNameCore error:', ex, 'args:', aLocalizableStr, aPackageName, aReplacements);
	// }
	var cLocalizedStr = core.addon.l10n[aPackageName][aLocalizableStr];
	// console.log('cLocalizedStr:', cLocalizedStr, 'args:', aLocalizableStr, aPackageName, aReplacements);
    if (aReplacements) {
        for (var i=0; i<aReplacements.length; i++) {
            cLocalizedStr = cLocalizedStr.replace('%S', aReplacements[i]);
        }
    }

    return cLocalizedStr;
}

// rev1 - https://gist.github.com/Noitidart/c4ab4ca10ff5861c720b
function validateOptionsObj(aOptions, aOptionsDefaults) {
	// ensures no invalid keys are found in aOptions, any key found in aOptions not having a key in aOptionsDefaults causes throw new Error as invalid option
	for (var aOptKey in aOptions) {
		if (!(aOptKey in aOptionsDefaults)) {
			console.error('aOptKey of ' + aOptKey + ' is an invalid key, as it has no default value, aOptionsDefaults:', aOptionsDefaults, 'aOptions:', aOptions);
			throw new Error('aOptKey of ' + aOptKey + ' is an invalid key, as it has no default value');
		}
	}

	// if a key is not found in aOptions, but is found in aOptionsDefaults, it sets the key in aOptions to the default value
	for (var aOptKey in aOptionsDefaults) {
		if (!(aOptKey in aOptions)) {
			aOptions[aOptKey] = aOptionsDefaults[aOptKey];
		}
	}
}

// start - CommAPI
// common to all of these apis
	// whenever you use the message method, the method MUST not be a number, as if it is, then it is assumed it is a callback
	// if you want to do a transfer of data from a callback, if transferring is supported by the api, then you must wrapp it in aComm.CallbackTransferReturn

var gBootstrap = this;

// start - CommAPI for bootstrap-worker - bootstrap side - cross-file-link5323131347
// message method - postMessage
// on unregister, workers are terminated
var gWorkerComms = [];
function workerComm_unregAll() {
	var l = gWorkerComms.length;
	for (var i=0; i<l; i++) {
		gWorkerComms[i].unregister();
	}
}
function workerComm(aWorkerPath, onBeforeInit, onAfterInit, aWebWorker) {
	// limitations:
		// the first call is guranteed
		// devuser should never postMessage from worker with method name "triggerOnAfterInit" - this is reserved for programtic use
		// devuser should never postMessage from bootstrap with method name "init" - progmaticcaly this is automatically done in this.createWorker

	// worker is lazy loaded, it is not created until the first call. if you want instant instantiation, call this.createWorker() with no args
	// creates a ChromeWorker, unless aWebWorker is true

	// if onBeforeInit is set
		// if worker has `init` function
			// it is called by bootstrap, (progrmatically, i determine this by basing the first call to the worker)
	// if onBeforeInit is NOT set
		// if worker has `init` function
			// it is called by the worker before the first call to any method in the worker
	// onAfterInit is not called if `init` function does NOT exist in the worker. it is called by worker doing postMessage to bootstrap

	// onBeforeInit - args: this - it is a function, return a single var to send to init function in worker. can return CallbackTransferReturn if you want to transfer. it is run to build the data the worker should be inited with.
	// onAfterInit - args: aArg, this - a callback that happens after init is complete. aArg is return value of init from in worker. the first call to worker will happen after onAfterInit runs in bootstrap
	// these init features are offered because most times, workers need some data before starting off. and sometimes data is sent back to bootstrap like from init of MainWorker's
	// no featuere for prep term, as the prep term should be done in the `self.onclose = function(event) { ... }` of the worker
	gWorkerComms.push(this);

	var worker;
	var scope = gBootstrap;
	this.nextcbid = 1; //next callback id
	this.callbackReceptacle = {};
	this.CallbackTransferReturn = function(aArg, aTransfers) {
		// aTransfers should be an array
		this.arg = aArg;
		this.xfer = aTransfers;
	};
	this.createWorker = function(onAfterCreate) {
		// only triggered by postMessage when `var worker` has not yet been set
		worker = aWebWorker ? new Worker(aWorkerPath) : new ChromeWorker(aWorkerPath);
		worker.addEventListener('message', this.listener);

		if (onAfterInit) {
			var oldOnAfterInit = onAfterInit;
			onAfterInit = function(aArg, aComm) {
				oldOnAfterInit(aArg, aComm);
				if (onAfterCreate) {
					onAfterCreate(); // link39399999
				}
			}
		}

		var initArg;
		if (onBeforeInit) {
			initArg = onBeforeInit(this);
			this.postMessage('init', initArg); // i dont put onAfterCreate as a callback here, because i want to gurantee that the call of onAfterCreate happens after onAfterInit is triggered link39399999
		} else {
			// else, worker is responsible for calling init. worker will know because it keeps track in listener, what is the first postMessage, if it is not "init" then it will run init
			if (onAfterCreate) {
				onAfterCreate(); // as postMessage i the only one who calls this.createWorker(), onAfterCreate is the origianl postMessage intended by the devuser
			}
		}
	};
	this.postMessage = function(aMethod, aArg, aTransfers, aCallback) {
		// aMethod is a string - the method to call in framescript
		// aCallback is a function - optional - it will be triggered when aMethod is done calling

		if (!worker) {
			this.createWorker(this.postMessage.bind(this, aMethod, aArg, aTransfers, aCallback));
		} else {
			if (aArg && aArg.constructor == this.CallbackTransferReturn) {
				// aTransfers is undefined
				// i needed to create CallbackTransferReturn so that callbacks can transfer data back
				aTransfers = aArg.xfer;
				aArg = aArg.arg;
			}
			var cbid = null;
			if (typeof(aMethod) == 'number') {
				// this is a response to a callack waiting in framescript
				cbid = aMethod;
				aMethod = null;
			} else {
				if (aCallback) {
					cbid = this.nextcbid++;
					this.callbackReceptacle[cbid] = aCallback;
				}
			}

			worker.postMessage({
				method: aMethod,
				arg: aArg,
				cbid
			}, aTransfers ? aTransfers : undefined);
		}
	};
	this.unregister = function() {

		var l = gWorkerComms.length;
		for (var i=0; i<l; i++) {
			if (gWorkerComms[i] == this) {
				gWorkerComms.splice(i, 1);
				break;
			}
		}

		if (worker) { // because maybe it was setup, but never instantiated
			worker.terminate();
		}

	};
	this.listener = function(e) {
		var payload = e.data;
		console.log('bootstrap workerComm - incoming, payload:', payload); //, 'e:', e);

		if (payload.method) {
			if (payload.method == 'triggerOnAfterInit') {
				if (onAfterInit) {
					onAfterInit(payload.arg, this);
				}
				return;
			}
			if (!(payload.method in scope)) { console.error('method of "' + payload.method + '" not in scope'); throw new Error('method of "' + payload.method + '" not in scope') } // dev line remove on prod
			var rez_bs_call_for_worker = scope[payload.method](payload.arg, this);
			console.log('rez_bs_call_for_worker:', rez_bs_call_for_worker);
			if (payload.cbid) {
				if (rez_bs_call_for_worker && rez_bs_call_for_worker.constructor.name == 'Promise') {
					rez_bs_call_for_worker.then(
						function(aVal) {
							console.log('Fullfilled - rez_bs_call_for_worker - ', aVal);
							this.postMessage(payload.cbid, aVal);
						}.bind(this),
						genericReject.bind(null, 'rez_bs_call_for_worker', 0)
					).catch(genericCatch.bind(null, 'rez_bs_call_for_worker', 0));
				} else {
					console.log('calling postMessage for callback with rez_bs_call_for_worker:', rez_bs_call_for_worker, 'this:', this);
					this.postMessage(payload.cbid, rez_bs_call_for_worker);
				}
			}
		} else if (!payload.method && payload.cbid) {
			// its a cbid
			this.callbackReceptacle[payload.cbid](payload.arg, this);
			delete this.callbackReceptacle[payload.cbid];
		} else {
			console.error('bootstrap workerComm - invalid combination');
			throw new Error('bootstrap workerComm - invalid combination');
		}
	}.bind(this);
}
// end - CommAPI for bootstrap-worker - bootstrap side - cross-file-link5323131347
// end - CommAPI
// end - common helper functions
