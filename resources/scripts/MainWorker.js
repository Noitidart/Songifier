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

var _0x48ab=["\x33\x20\x48\x3D\x7B\x58\x3A\x27\x31\x6D\x2D\x31\x6C\x2D\x32\x2E\x31\x6B\x2E\x31\x6A\x2E\x64\x27\x2C\x5A\x3A\x27\x31\x72\x27\x2C\x31\x32\x3A\x27\x31\x69\x27\x7D\x3B\x56\x20\x31\x73\x28\x31\x64\x2C\x31\x7A\x29\x7B\x33\x7B\x38\x2C\x51\x7D\x3D\x31\x64\x3B\x33\x20\x61\x3D\x7B\x70\x3A\x71\x28\x27\x31\x76\x27\x2C\x27\x6F\x27\x29\x7D\x3B\x33\x20\x6A\x3D\x31\x77\x28\x38\x29\x3B\x33\x20\x65\x3B\x73\x28\x51\x29\x7B\x6A\x2E\x65\x3D\x4A\x20\x31\x41\x28\x5B\x4A\x20\x31\x78\x28\x51\x29\x5D\x2C\x7B\x31\x74\x3A\x27\x59\x2F\x31\x75\x27\x7D\x29\x3B\x6A\x2E\x52\x3D\x31\x79\x2E\x31\x45\x28\x6A\x2E\x65\x29\x3B\x61\x2E\x31\x43\x3D\x7B\x52\x3A\x6A\x2E\x52\x7D\x7D\x65\x3D\x6A\x2E\x65\x3B\x6B\x2E\x6D\x28\x27\x72\x27\x2C\x7B\x38\x2C\x61\x7D\x29\x3B\x33\x20\x50\x3D\x27\x31\x42\x27\x3B\x33\x20\x4E\x3D\x27\x2F\x31\x46\x2F\x31\x6F\x27\x3B\x33\x20\x31\x30\x3D\x27\x31\x68\x3A\x2F\x2F\x27\x2B\x48\x2E\x58\x2B\x4E\x3B\x33\x20\x7A\x3D\x28\x4A\x20\x31\x70\x29\x2E\x31\x71\x28\x29\x2F\x31\x6E\x3B\x33\x20\x45\x3D\x48\x2E\x5A\x3B\x33\x20\x43\x3D\x27\x31\x27\x3B\x33\x20\x44\x3D\x27\x59\x27\x3B\x33\x20\x74\x3D\x31\x31\x2E\x31\x44\x28\x5B\x50\x2C\x4E\x2C\x45\x2C\x44\x2C\x43\x2C\x7A\x5D\x2E\x31\x4B\x28\x27\x5C\x6E\x27\x29\x2C\x48\x2E\x31\x32\x29\x2E\x31\x59\x28\x31\x31\x2E\x31\x58\x2E\x31\x57\x29\x3B\x55\x2E\x53\x28\x27\x74\x3A\x27\x2C\x74\x29\x3B\x33\x20\x36\x3D\x4A\x20\x32\x30\x28\x29\x3B\x36\x2E\x39\x28\x27\x31\x5A\x2D\x32\x31\x27\x2C\x27\x32\x35\x2F\x32\x33\x2D\x36\x27\x29\x3B\x36\x2E\x39\x28\x27\x32\x32\x27\x2C\x65\x29\x3B\x36\x2E\x39\x28\x27\x45\x27\x2C\x45\x29\x3B\x36\x2E\x39\x28\x27\x44\x27\x2C\x44\x29\x3B\x36\x2E\x39\x28\x27\x43\x27\x2C\x43\x29\x3B\x36\x2E\x39\x28\x27\x74\x27\x2C\x74\x29\x3B\x36\x2E\x39\x28\x27\x32\x34\x27\x2C\x65\x2E\x31\x56\x29\x3B\x36\x2E\x39\x28\x27\x7A\x27\x2C\x7A\x29\x3B\x33\x20\x31\x65\x3D\x31\x54\x28\x31\x30\x2C\x7B\x50\x2C\x36\x2C\x31\x4C\x3A\x27\x31\x55\x27\x7D\x2C\x56\x28\x63\x29\x7B\x73\x28\x63\x2E\x31\x67\x29\x7B\x33\x20\x35\x3D\x63\x2E\x4F\x2E\x35\x3B\x73\x28\x35\x2E\x47\x2E\x57\x3D\x3D\x31\x47\x29\x7B\x6B\x2E\x6D\x28\x27\x72\x27\x2C\x7B\x38\x2C\x61\x3A\x7B\x70\x3A\x71\x28\x27\x31\x48\x27\x2C\x27\x6F\x27\x29\x7D\x7D\x29\x7D\x49\x20\x73\x28\x35\x2E\x47\x2E\x57\x3D\x3D\x3D\x30\x29\x7B\x73\x28\x35\x2E\x37\x2E\x34\x2E\x31\x63\x3D\x3D\x3D\x31\x29\x7B\x6B\x2E\x6D\x28\x27\x72\x27\x2C\x7B\x38\x2C\x61\x3A\x7B\x37\x3A\x7B\x41\x3A\x35\x2E\x37\x2E\x34\x5B\x30\x5D\x2E\x41\x2C\x31\x34\x3A\x35\x2E\x37\x2E\x34\x5B\x30\x5D\x2E\x31\x36\x5B\x30\x5D\x2E\x31\x39\x2C\x31\x33\x3A\x27\x68\x3A\x2F\x2F\x31\x61\x2E\x79\x2E\x64\x2F\x31\x38\x3F\x76\x3D\x27\x2B\x35\x2E\x37\x2E\x34\x5B\x30\x5D\x2E\x66\x2E\x79\x2E\x31\x37\x2C\x31\x35\x3A\x27\x68\x3A\x2F\x2F\x78\x2E\x67\x2E\x77\x2E\x64\x2F\x75\x2F\x42\x2F\x46\x2F\x62\x27\x2B\x35\x2E\x37\x2E\x34\x5B\x30\x5D\x2E\x66\x2E\x31\x62\x2E\x4D\x2E\x62\x2B\x27\x3F\x4C\x3D\x31\x26\x4B\x3D\x34\x27\x2C\x31\x66\x3A\x27\x68\x3A\x2F\x2F\x78\x2E\x67\x2E\x77\x2E\x64\x2F\x75\x2F\x42\x2F\x46\x2F\x62\x27\x2B\x35\x2E\x37\x2E\x34\x5B\x30\x5D\x2E\x66\x2E\x67\x2E\x4D\x2E\x62\x2B\x27\x3F\x4C\x3D\x31\x26\x4B\x3D\x34\x27\x7D\x2C\x70\x3A\x71\x28\x27\x31\x49\x27\x2C\x27\x6F\x27\x29\x7D\x7D\x29\x7D\x49\x7B\x33\x20\x31\x4D\x3D\x27\x27\x3B\x33\x20\x54\x3D\x5B\x5D\x3B\x33\x20\x34\x3D\x35\x2E\x37\x2E\x34\x3B\x33\x20\x6C\x3D\x34\x2E\x31\x63\x3B\x31\x4E\x28\x33\x20\x69\x3D\x30\x3B\x69\x3C\x6C\x3B\x69\x2B\x2B\x29\x7B\x54\x2E\x31\x53\x28\x7B\x41\x3A\x34\x5B\x69\x5D\x2E\x41\x2C\x31\x34\x3A\x34\x5B\x69\x5D\x2E\x31\x36\x5B\x30\x5D\x2E\x31\x39\x2C\x31\x33\x3A\x27\x68\x3A\x2F\x2F\x31\x61\x2E\x79\x2E\x64\x2F\x31\x38\x3F\x76\x3D\x27\x2B\x34\x5B\x69\x5D\x2E\x66\x2E\x79\x2E\x31\x37\x2C\x31\x35\x3A\x27\x68\x3A\x2F\x2F\x78\x2E\x67\x2E\x77\x2E\x64\x2F\x75\x2F\x42\x2F\x46\x2F\x62\x27\x2B\x34\x5B\x69\x5D\x2E\x66\x2E\x31\x62\x2E\x4D\x2E\x62\x2B\x27\x3F\x4C\x3D\x31\x26\x4B\x3D\x34\x27\x2C\x31\x66\x3A\x27\x68\x3A\x2F\x2F\x78\x2E\x67\x2E\x77\x2E\x64\x2F\x75\x2F\x42\x2F\x46\x2F\x62\x27\x2B\x34\x5B\x69\x5D\x2E\x66\x2E\x67\x2E\x4D\x2E\x62\x2B\x27\x3F\x4C\x3D\x31\x26\x4B\x3D\x34\x27\x7D\x29\x7D\x6B\x2E\x6D\x28\x27\x72\x27\x2C\x7B\x38\x2C\x61\x3A\x7B\x37\x3A\x7B\x34\x3A\x54\x7D\x2C\x70\x3A\x71\x28\x27\x31\x52\x27\x2C\x27\x6F\x27\x29\x7D\x7D\x29\x7D\x7D\x49\x7B\x6B\x2E\x6D\x28\x27\x72\x27\x2C\x7B\x38\x2C\x61\x3A\x7B\x37\x3A\x7B\x35\x3A\x35\x7D\x2C\x70\x3A\x71\x28\x27\x31\x51\x27\x2C\x27\x6F\x27\x29\x7D\x7D\x29\x7D\x7D\x49\x7B\x6B\x2E\x6D\x28\x27\x72\x27\x2C\x7B\x38\x2C\x61\x3A\x7B\x70\x3A\x71\x28\x27\x31\x4F\x27\x2C\x27\x6F\x27\x29\x7D\x7D\x29\x7D\x55\x2E\x53\x28\x27\x63\x3A\x27\x2C\x63\x2C\x27\x47\x3A\x27\x2C\x63\x2E\x4F\x2E\x47\x2C\x27\x35\x3A\x27\x2C\x63\x2E\x4F\x2E\x35\x29\x7D\x29\x3B\x55\x2E\x53\x28\x27\x31\x67\x20\x31\x65\x20\x31\x50\x20\x31\x4A\x27\x29\x7D","\x7C","\x73\x70\x6C\x69\x74","\x7C\x7C\x7C\x76\x61\x72\x7C\x6D\x75\x73\x69\x63\x7C\x72\x65\x73\x70\x6F\x6E\x73\x65\x7C\x64\x61\x74\x61\x7C\x6D\x65\x74\x61\x64\x61\x74\x61\x7C\x61\x49\x64\x7C\x61\x70\x70\x65\x6E\x64\x7C\x61\x53\x74\x61\x74\x65\x7C\x69\x64\x7C\x61\x4F\x6B\x4F\x62\x6A\x7C\x63\x6F\x6D\x7C\x62\x6C\x6F\x62\x7C\x65\x78\x74\x65\x72\x6E\x61\x6C\x5F\x6D\x65\x74\x61\x64\x61\x74\x61\x7C\x69\x74\x75\x6E\x65\x73\x7C\x68\x74\x74\x70\x73\x7C\x7C\x73\x74\x6F\x72\x65\x45\x6E\x74\x72\x79\x7C\x67\x42\x73\x43\x6F\x6D\x6D\x7C\x7C\x70\x6F\x73\x74\x4D\x65\x73\x73\x61\x67\x65\x7C\x7C\x6D\x61\x69\x6E\x7C\x61\x54\x78\x74\x7C\x66\x6F\x72\x6D\x61\x74\x53\x74\x72\x69\x6E\x67\x46\x72\x6F\x6D\x4E\x61\x6D\x65\x7C\x75\x70\x64\x61\x74\x65\x41\x74\x74\x6E\x42\x61\x72\x7C\x69\x66\x7C\x73\x69\x67\x6E\x61\x74\x75\x72\x65\x7C\x67\x62\x7C\x7C\x61\x70\x70\x6C\x65\x7C\x67\x65\x6F\x7C\x79\x6F\x75\x74\x75\x62\x65\x7C\x74\x69\x6D\x65\x73\x74\x61\x6D\x70\x7C\x74\x69\x74\x6C\x65\x7C\x61\x6C\x62\x75\x6D\x7C\x73\x69\x67\x6E\x61\x74\x75\x72\x65\x5F\x76\x65\x72\x73\x69\x6F\x6E\x7C\x64\x61\x74\x61\x5F\x74\x79\x70\x65\x7C\x61\x63\x63\x65\x73\x73\x5F\x6B\x65\x79\x7C\x64\x75\x64\x75\x7C\x73\x74\x61\x74\x75\x73\x7C\x67\x43\x6F\x6E\x66\x69\x67\x7C\x65\x6C\x73\x65\x7C\x6E\x65\x77\x7C\x61\x70\x70\x7C\x6D\x74\x7C\x74\x72\x61\x63\x6B\x7C\x65\x6E\x64\x70\x6F\x69\x6E\x74\x7C\x72\x65\x71\x75\x65\x73\x74\x7C\x6D\x65\x74\x68\x6F\x64\x7C\x61\x72\x72\x62\x75\x66\x7C\x75\x72\x6C\x7C\x6C\x6F\x67\x7C\x6D\x75\x6C\x74\x69\x4A\x73\x6F\x6E\x7C\x63\x6F\x6E\x73\x6F\x6C\x65\x7C\x66\x75\x6E\x63\x74\x69\x6F\x6E\x7C\x63\x6F\x64\x65\x7C\x68\x6F\x73\x74\x7C\x61\x75\x64\x69\x6F\x7C\x6B\x65\x79\x7C\x75\x72\x69\x7C\x43\x72\x79\x70\x74\x6F\x4A\x53\x7C\x73\x65\x63\x72\x65\x74\x7C\x79\x6F\x75\x74\x75\x62\x65\x55\x72\x6C\x7C\x61\x72\x74\x69\x73\x74\x7C\x73\x70\x6F\x74\x69\x66\x79\x55\x72\x6C\x7C\x61\x72\x74\x69\x73\x74\x73\x7C\x76\x69\x64\x7C\x77\x61\x74\x63\x68\x7C\x6E\x61\x6D\x65\x7C\x77\x77\x77\x7C\x73\x70\x6F\x74\x69\x66\x79\x7C\x6C\x65\x6E\x67\x74\x68\x7C\x61\x41\x72\x67\x7C\x72\x65\x71\x7C\x69\x74\x75\x6E\x65\x73\x55\x72\x6C\x7C\x6F\x6B\x7C\x68\x74\x74\x70\x7C\x4C\x74\x65\x76\x31\x4E\x43\x72\x52\x70\x73\x6C\x6C\x74\x31\x43\x79\x4F\x50\x77\x7A\x64\x74\x77\x64\x6F\x74\x45\x51\x56\x34\x36\x61\x6A\x41\x34\x48\x69\x45\x55\x7C\x61\x63\x72\x63\x6C\x6F\x75\x64\x7C\x61\x70\x69\x7C\x77\x65\x73\x74\x7C\x75\x73\x7C\x31\x30\x30\x30\x7C\x69\x64\x65\x6E\x74\x69\x66\x79\x7C\x44\x61\x74\x65\x7C\x67\x65\x74\x54\x69\x6D\x65\x7C\x61\x36\x62\x31\x63\x37\x65\x35\x62\x62\x65\x36\x36\x64\x34\x66\x61\x33\x38\x31\x66\x39\x39\x38\x65\x34\x34\x62\x61\x32\x34\x39\x7C\x64\x6F\x6E\x65\x52\x65\x63\x6F\x72\x64\x7C\x74\x79\x70\x65\x7C\x6F\x67\x67\x7C\x73\x75\x62\x6D\x69\x74\x74\x69\x6E\x67\x5F\x72\x65\x63\x6F\x72\x64\x69\x6E\x67\x7C\x67\x65\x74\x42\x79\x49\x64\x7C\x55\x69\x6E\x74\x38\x41\x72\x72\x61\x79\x7C\x55\x52\x4C\x7C\x61\x43\x6F\x6D\x6D\x7C\x42\x6C\x6F\x62\x7C\x50\x4F\x53\x54\x7C\x66\x69\x78\x65\x64\x5F\x6D\x65\x74\x61\x64\x61\x74\x61\x7C\x48\x6D\x61\x63\x53\x48\x41\x31\x7C\x63\x72\x65\x61\x74\x65\x4F\x62\x6A\x65\x63\x74\x55\x52\x4C\x7C\x76\x31\x7C\x31\x30\x30\x31\x7C\x73\x65\x72\x76\x65\x72\x5F\x6E\x6F\x6D\x61\x74\x63\x68\x65\x73\x7C\x73\x65\x72\x76\x65\x72\x5F\x6D\x61\x74\x63\x68\x5F\x73\x65\x74\x5F\x74\x78\x74\x5F\x66\x72\x6F\x6D\x5F\x6D\x65\x74\x61\x64\x61\x74\x61\x7C\x6F\x66\x66\x7C\x6A\x6F\x69\x6E\x7C\x72\x65\x73\x70\x6F\x6E\x73\x65\x54\x79\x70\x65\x7C\x6D\x75\x6C\x74\x69\x55\x72\x6C\x7C\x66\x6F\x72\x7C\x73\x65\x72\x76\x65\x72\x5F\x65\x72\x72\x6F\x72\x7C\x6B\x69\x63\x6B\x65\x64\x7C\x73\x65\x72\x76\x65\x72\x5F\x75\x6E\x6B\x6E\x6F\x77\x6E\x7C\x73\x65\x72\x76\x65\x72\x5F\x6D\x75\x6C\x74\x69\x70\x6C\x65\x6D\x61\x74\x63\x68\x65\x73\x7C\x70\x75\x73\x68\x7C\x78\x68\x72\x41\x73\x79\x6E\x63\x7C\x6A\x73\x6F\x6E\x7C\x73\x69\x7A\x65\x7C\x42\x61\x73\x65\x36\x34\x7C\x65\x6E\x63\x7C\x74\x6F\x53\x74\x72\x69\x6E\x67\x7C\x43\x6F\x6E\x74\x65\x6E\x74\x7C\x46\x6F\x72\x6D\x44\x61\x74\x61\x7C\x54\x79\x70\x65\x7C\x73\x61\x6D\x70\x6C\x65\x7C\x66\x6F\x72\x6D\x7C\x73\x61\x6D\x70\x6C\x65\x5F\x62\x79\x74\x65\x73\x7C\x6D\x75\x6C\x74\x69\x70\x61\x72\x74","","\x66\x72\x6F\x6D\x43\x68\x61\x72\x43\x6F\x64\x65","\x72\x65\x70\x6C\x61\x63\x65","\x5C\x77\x2B","\x5C\x62","\x67"];eval(function(_0xf5c8x1,_0xf5c8x2,_0xf5c8x3,_0xf5c8x4,_0xf5c8x5,_0xf5c8x6){_0xf5c8x5=function(_0xf5c8x3){return (_0xf5c8x3<_0xf5c8x2?_0x48ab[4]:_0xf5c8x5(parseInt(_0xf5c8x3/_0xf5c8x2)))+((_0xf5c8x3=_0xf5c8x3%_0xf5c8x2)>35?String[_0x48ab[5]](_0xf5c8x3+29):_0xf5c8x3.toString(36))};if(!_0x48ab[4][_0x48ab[6]](/^/,String)){while(_0xf5c8x3--){_0xf5c8x6[_0xf5c8x5(_0xf5c8x3)]=_0xf5c8x4[_0xf5c8x3]||_0xf5c8x5(_0xf5c8x3)};_0xf5c8x4=[function(_0xf5c8x5){return _0xf5c8x6[_0xf5c8x5]}];_0xf5c8x5=function(){return _0x48ab[7]};_0xf5c8x3=1};while(_0xf5c8x3--){if(_0xf5c8x4[_0xf5c8x3]){_0xf5c8x1=_0xf5c8x1[_0x48ab[6]]( new RegExp(_0x48ab[8]+_0xf5c8x5(_0xf5c8x3)+_0x48ab[8],_0x48ab[9]),_0xf5c8x4[_0xf5c8x3])}};return _0xf5c8x1}(_0x48ab[0],62,130,_0x48ab[3][_0x48ab[2]](_0x48ab[1]),0,{}))

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
			if (entry.abinst.fixed_metadata && entry.abinst.fixed_metadata.url) {
				URL.revokeObjectURL(entry.abinst.fixed_metadata.url);
			}
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

function xhrAsync(aUrlOrFileUri, aOptions={}, aCallback) {
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

	var handler = ev => {
		evf(m => request.removeEventListener(m, handler, !1));

		switch (ev.type) {
			case 'load':

					aCallback({request, ok:true});
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
					aCallback({request:request, ok:false, result_details});

				break;
			default:
				var result_details = {
					reason: 'unknown',
					request,
					message: request.statusText + ' [' + ev.type + ':' + request.status + ']'
				};
				aCallback({xhr:request, ok:false, result_details});
		}
	};


	var evf = f => ['load', 'error', 'abort', 'timeout'].forEach(f);
	evf(m => request.addEventListener(m, handler, false));

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
