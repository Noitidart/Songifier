// Imports
importScripts('resource://gre/modules/osfile.jsm');

// Globals
var core;
var gBsComm;
var gStore = []; // array of active things, id is held in gStore[i].abinst.aId



function init(aArg, aComm) {
	core = aArg;

	// imports
	importScripts(core.addon.path.scripts + 'hmac-sha1.js');
	importScripts(core.addon.path.scripts + 'enc-base64-min.js');

	// add stuff to core
	core.os.name = OS.Constants.Sys.Name.toLowerCase();
	core.os.mname = core.os.toolkit.indexOf('gtk') == 0 ? 'gtk' : core.os.name; // mname stands for modified-name // this will treat solaris, linux, unix, *bsd systems as the same. as they are all gtk based
	// core.os.version
	switch (core.os.name) {
		case 'winnt':
				var version_win = navigator.userAgent.match(/Windows NT (\d+.\d+)/);
				if (version_win) {
					core.os.version = parseFloat(version_win[1]);
					// http://en.wikipedia.org/wiki/List_of_Microsoft_Windows_versions
					switch (core.os.version) {
						case 5.1:
						case 5.2:
							core.os.version_name = 'xp';
							break;
						case 6:
							core.os.version_name = 'vista';
							break;
						case 6.1:
							core.os.version_name = '7';
							break;
						case 6.2:
							core.os.version_name = '8';
							break;
						case 6.3:
							core.os.version_name = '8.1';
							break;
						case 10:
							core.os.version_name = '10';
							break;
					}
				}
			break;
		case 'darwin':
				var version_osx = navigator.userAgent.match(/Mac OS X 10\.([\d\.]+)/);
				if (version_osx) {
					var version_osx_str = version_osx[1];
					var ints_split = version_osx[1].split('.');
					if (ints_split.length == 1) {
						core.os.version = parseInt(ints_split[0]);
					} else if (ints_split.length >= 2) {
						core.os.version = ints_split[0] + '.' + ints_split[1];
						if (ints_split.length > 2) {
							core.os.version += ints_split.slice(2).join('');
						}
						core.os.version = parseFloat(core.os.version);
					}
				}
			break;
	}

	// locale
	formatStringFromName('blah', 'main');
	core.addon.l10n = _cache_formatStringFromName_packages;

	core.addon.path.storage = OS.Path.join(OS.Constants.Path.profileDir, 'jetpack', core.addon.id, 'simple-storage'); // const JETPACK_DIR_BASENAME = 'jetpack';

	return core;
}

self.onclose = function() {

};

function instantInstantiation() {}

function countdownRecord(aId) {
	var storeEntry = getById(aId);
	storeEntry.secleft--;
	if (!storeEntry.secleft) {
		clearInterval(storeEntry.countdownInterval);
		gBsComm.postMessage('stopRecord', {aId});
	} else {
		gBsComm.postMessage('countdownRecord', {aId, aSeconds:storeEntry.secleft});
	}
}

function doneRecord(aArg, aComm) {
	var { arrbuf } = aArg;

	var arrbuf_copy = arrbuf.slice();
	try {
		OS.File.writeAtomic(OS.Path.join(OS.Constants.Path.desktopDir, Date.now() + '.ogg'), new Uint8Array(arrbuf_copy));
	} catch(ex) {
		console.error('failed to save, ex:', ex);
		throw new Error('failed to save, ex: ' + ex);
	}
	console.log('succesfully saved');

	 var blob = new Blob([new Uint8Array(arrbuf)], {type: 'audio/ogg'});

	// keep this file saved, until succesfully identified
	var method = 'POST';
	var endpoint = '/v1/identify';
	var uri = 'http://' + host + endpoint;
	var timestamp = (new Date).getTime() / 1000;
	var access_key = key;
	var signature_version = '1';
	var data_type = 'audio';

	var signature = CryptoJS.HmacSHA1([method, endpoint, access_key, data_type, signature_version, timestamp].join('\n'), secret).toString(CryptoJS.enc.Base64);
	console.log('signature:', signature);

	var data = new FormData();
	data.append('Content-Type', 'multipart/form-data');
	data.append('sample', blob);
	data.append('access_key', access_key);
	data.append('data_type', data_type);
	data.append('signature_version', signature_version);
	data.append('signature', signature);
	data.append('sample_bytes', blob.size);
	data.append('timestamp', timestamp);

	var req = xhr(uri, {
		method,
		data,
		responseType: 'json'
	});
	console.log('req:', req.status, req.response);
}

function transcribeEntry(aArg, aComm) {
	var { storeEntry } = aArg;
	gStore.push(storeEntry);
}

function startRecord(aArg, aComm) {
	var { aId } = aArg;
	var storeEntry = getById(aId);
	storeEntry.secleft = 8;
	aComm.postMessage('startRecord', { aId, aSeconds:storeEntry.secleft });
	storeEntry.countdownInterval = setInterval(countdownRecord.bind(null, aId), 1000);
}

// store functions
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

// start - common helper functions
function Deferred() { // revFinal
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

// rev4 - https://gist.github.com/Noitidart/6d8a20739b9a4a97bc47
var _cache_formatStringFromName_packages = {}; // holds imported packages
function formatStringFromName(aKey, aLocalizedPackageName, aReplacements) {
	// depends on ```core.addon.path.locale``` it must be set to the path to your locale folder

	// aLocalizedPackageName is name of the .properties file. so mainworker.properties you would provide mainworker // or if it includes chrome:// at the start then it fetches that
	// aKey - string for key in aLocalizedPackageName
	// aReplacements - array of string

	// returns null if aKey not found in pacakage

	var packagePath;
	var packageName;
	if (aLocalizedPackageName.indexOf('chrome:') === 0 || aLocalizedPackageName.indexOf('resource:') === 0) {
		packagePath = aLocalizedPackageName;
		packageName = aLocalizedPackageName.substring(aLocalizedPackageName.lastIndexOf('/') + 1, aLocalizedPackageName.indexOf('.properties'));
	} else {
		packagePath = core.addon.path.locale + aLocalizedPackageName + '.properties';
		packageName = aLocalizedPackageName;
	}

	if (!_cache_formatStringFromName_packages[packageName]) {
		var packageStr = xhr(packagePath).response;
		var packageJson = {};

		var propPatt = /(.*?)=(.*?)$/gm;
		var propMatch;
		while (propMatch = propPatt.exec(packageStr)) {
			packageJson[propMatch[1]] = propMatch[2];
		}

		_cache_formatStringFromName_packages[packageName] = packageJson;

		console.log('packageJson:', packageJson);
	}

	var cLocalizedStr = _cache_formatStringFromName_packages[packageName][aKey];
	if (!cLocalizedStr) {
		return null;
	}
	if (aReplacements) {
		for (var i=0; i<aReplacements.length; i++) {
			cLocalizedStr = cLocalizedStr.replace('%S', aReplacements[i]);
		}
	}

	return cLocalizedStr;
}
// rev1 - https://gist.github.com/Noitidart/ec1e6b9a593ec7e3efed
function xhr(aUrlOrFileUri, aOptions={}) {
	// console.error('in xhr!!! aUrlOrFileUri:', aUrlOrFileUri);

	// all requests are sync - as this is in a worker
	var aOptionsDefaults = {
		responseType: 'text',
		timeout: 0, // integer, milliseconds, 0 means never timeout, value is in milliseconds
		headers: null, // make it an object of key value pairs
		method: 'GET', // string
		data: null // make it whatever you want (formdata, null, etc), but follow the rules, like if aMethod is 'GET' then this must be null
	};
	Object.assign(aOptionsDefaults, aOptions);
	aOptions = aOptionsDefaults;

	var cRequest = new XMLHttpRequest();

	cRequest.open(aOptions.method, aUrlOrFileUri, false); // 3rd arg is false for synchronus

	if (aOptions.headers) {
		for (var h in aOptions.headers) {
			cRequest.setRequestHeader(h, aOptions.headers[h]);
		}
	}

	cRequest.responseType = aOptions.responseType;
	cRequest.send(aOptions.data);

	// console.log('response:', cRequest.response);

	// console.error('done xhr!!!');
	return cRequest;
}

function xhrAsync(aUrlOrFileUri, aCallback, aOptions={}) {
	// console.error('in xhr!!! aUrlOrFileUri:', aUrlOrFileUri);

	// all requests are sync - as this is in a worker
	var aOptionsDefaults = {
		responseType: 'text',
		timeout: 0, // integer, milliseconds, 0 means never timeout, value is in milliseconds
		headers: null, // make it an object of key value pairs
		method: 'GET', // string
		data: null // make it whatever you want (formdata, null, etc), but follow the rules, like if aMethod is 'GET' then this must be null
	};
	Object.assign(aOptionsDefaults, aOptions);
	aOptions = aOptionsDefaults;

	var request = new XMLHttpRequest();

	var evf = f => ['load', 'error', 'abort', 'timeout'].forEach(f);
	evf(m => request.addEventListener(m, handler, false));

	var handler = ev => {
		evf(m => request.removeEventListener(m, handler, !1));

		switch (ev.type) {
			case 'load':

					aCallback({request, result:true});
					// if (xhr.readyState == 4) {
					// 	if (xhr.status == 200) {
					// 		deferredMain_xhr.resolve(xhr);
					// 	} else {
					// 		var rejObj = {
					// 			name: 'deferredMain_xhr.promise',
					// 			aReason: 'Load Not Success', // loaded but status is not success status
					// 			xhr: xhr,
					// 			message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
					// 		};
					// 		deferredMain_xhr.reject(rejObj);
					// 	}
					// } else if (xhr.readyState == 0) {
					// 	var uritest = Services.io.newURI(aStr, null, null);
					// 	if (uritest.schemeIs('file')) {
					// 		deferredMain_xhr.resolve(xhr);
					// 	} else {
					// 		var rejObj = {
					// 			name: 'deferredMain_xhr.promise',
					// 			aReason: 'Load Failed', // didnt even load
					// 			xhr: xhr,
					// 			message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
					// 		};
					// 		deferredMain_xhr.reject(rejObj);
					// 	}
					// }

				break;
			case 'abort':
			case 'error':
			case 'timeout':

					var result_details = {
						reason: ev.type,
						request,
						message: request.statusText + ' [' + ev.type + ':' + request.status + ']'
					};
					aCallback({request:request, result:false, result_details});

				break;
			default:
				var result_details = {
					reason: 'unknown',
					request,
					message: request.statusText + ' [' + ev.type + ':' + request.status + ']'
				};
				aCallback({xhr:request, result:false, result_details});
		}
	};


	request.open(aOptions.method, aUrlOrFileUri, true); // 3rd arg is false for async

	if (aOptions.headers) {
		for (var h in aOptions.headers) {
			request.setRequestHeader(h, aOptions.headers[h]);
		}
	}

	request.responseType = aOptions.responseType;
	request.send(aOptions.data);

	// console.log('response:', request.response);

	// console.error('done xhr!!!');

}

// start - CommAPI
var gWorker = this;

// start - CommAPI for bootstrap-worker - worker side - cross-file-link5323131347
function workerComm() {

	var scope = gWorker;
	var firstMethodCalled = false;
	this.nextcbid = 1; // next callback id
	this.callbackReceptacle = {};
	this.CallbackTransferReturn = function(aArg, aTransfers) {
		// aTransfers should be an array
		this.arg = aArg;
		this.xfer = aTransfers;
	};
	this.postMessage = function(aMethod, aArg, aTransfers, aCallback) {
		// aMethod is a string - the method to call in bootstrap
		// aCallback is a function - optional - it will be triggered in scope when aMethod is done calling

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

		self.postMessage({
			method: aMethod,
			arg: aArg,
			cbid
		}, aTransfers ? aTransfers : undefined);
	};
	this.listener = function(e) {
		var payload = e.data;
		console.log('worker workerComm - incoming, payload:', payload); //, 'e:', e);

		if (payload.method) {
			if (!firstMethodCalled) {
				firstMethodCalled = true;
				if (payload.method != 'init' && scope.init) {
					this.postMessage('triggerOnAfterInit', scope.init(undefined, this));
				}
			}
			console.log('scope:', scope);
			if (!(payload.method in scope)) { console.error('method of "' + payload.method + '" not in scope'); throw new Error('method of "' + payload.method + '" not in scope') } // dev line remove on prod
			var rez_worker_call_for_bs = scope[payload.method](payload.arg, this);
			console.log('rez_worker_call_for_bs:', rez_worker_call_for_bs);
			if (payload.cbid) {
				if (rez_worker_call_for_bs && rez_worker_call_for_bs.constructor.name == 'Promise') {
					rez_worker_call_for_bs.then(
						function(aVal) {
							console.log('Fullfilled - rez_worker_call_for_bs - ', aVal);
							this.postMessage(payload.cbid, aVal);
						}.bind(this),
						genericReject.bind(null, 'rez_worker_call_for_bs', 0)
					).catch(genericCatch.bind(null, 'rez_worker_call_for_bs', 0));
				} else {
					console.log('calling postMessage for callback with rez_worker_call_for_bs:', rez_worker_call_for_bs, 'this:', this);
					this.postMessage(payload.cbid, rez_worker_call_for_bs);
				}
			}
			// gets here on programtic init, as it for sure does not have a callback
			if (payload.method == 'init') {
				this.postMessage('triggerOnAfterInit', rez_worker_call_for_bs);
			}
		} else if (!payload.method && payload.cbid) {
			// its a cbid
			this.callbackReceptacle[payload.cbid](payload.arg, this);
			delete this.callbackReceptacle[payload.cbid];
		} else {
			console.error('worker workerComm - invalid combination');
			throw new Error('worker workerComm - invalid combination');
		}
	}.bind(this);

	self.onmessage = this.listener;
}
// end - CommAPI for bootstrap-worker - worker side - cross-file-link5323131347
// end - CommAPI
// end - common helper functions

// startup
 gBsComm = new workerComm();
