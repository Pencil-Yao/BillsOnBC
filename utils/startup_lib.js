// ============================================================================================================================
// 													startup_lib.js
// This file has the functions we call during start up
// ============================================================================================================================
var async = require('async');

module.exports = function (logger, cp, fcw, marbles_lib, ws_server) {
	var startup_lib = {};
	var enrollObj = {};
	var misc = require('./misc.js')(logger);					//random non-blockchain related functions
	var more_entropy = misc.randStr(32);
	var cc_detect_attempt = 0;

	// --------------------------------------------------------
	// Handle WS Setup Messages
	// --------------------------------------------------------
	startup_lib.setup_ws_steps = function (data) {

		// --- [6] Enroll the admin (repeat if needed)  --- //
		if (data.configure === 'enrollment') {
			startup_lib.removeKVS();
			cp.write(data);																//write new config data to file
			startup_lib.enroll_admin(1, function (e) {
				if (e == null) {
					startup_lib.setup_marbles_lib('localhost', cp.getMarblesPort(), function () {
						startup_lib.detect_prev_startup({ startup: false }, function (err) {
							if (err) {
								startup_lib.create_assets(cp.getMarbleUsernames()); 	//builds marbles, then starts webapp
							}
						});
					});
				}
			});
		}

		// --- [7] Find instantiated chaincode --- //
		else if (data.configure === 'find_chaincode') {
			cp.write(data);																//write new config data to file
			startup_lib.enroll_admin(1, function (e) {									//re-enroll b/c we may be using new peer/order urls
				if (e == null) {
					startup_lib.setup_marbles_lib('localhost', cp.getMarblesPort(), function () {
						startup_lib.detect_prev_startup({ startup: true }, function (err) {
							if (err) {
								startup_lib.create_assets(cp.getMarbleUsernames()); 	//builds marbles, then starts webapp
							}
						});
					});
				}
			});
		}

		// --- [8] Register marble owners --- /
		else if (data.configure === 'register') {
			startup_lib.create_assets(data.build_marble_owners);
		}
	};


	// Wait for the user to help correct the config file so we can startup!
	startup_lib.startup_unsuccessful = function (host, port) {
		console.log('\n\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -');
		logger.info('Detected that we have NOT launched successfully yet');
		logger.debug('Open your browser to http://' + host + ':' + port + ' and login as "admin" to initiate startup');
		console.log('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n\n');
		// we wait here for the user to go the browser, then setup_marbles_lib() will be called from WS msg
	};

	// Find if marbles has started up successfully before
	startup_lib.detect_prev_startup = function (opts, cb) {
		logger.info('Checking ledger for marble owners listed in the config file');
		marbles_lib.read_everything(null, function (err, resp) {					//read the ledger for marble owners
			if (err != null) {
				logger.warn('Error reading ledger', err);
				if (cb) cb(true);
			} else {
				if (!detectCompany(resp) || startup_lib.find_missing_owners(resp)) {	//check if each user in the settings file has been created in the ledger
					logger.info('We need to make marble owners');						//there are marble owners that do not exist!
					ws_server.record_state('register_owners', 'waiting');
					ws_server.broadcast_state();
					if (cb) cb(true);
				} else {
					ws_server.record_state('register_owners', 'success');		//everything is good
					ws_server.broadcast_state();
					logger.info('Everything is in place');
					if (cb) cb(null);
				}
			}
		});
	};

	// Detect if we have created users for this company yet
	function detectCompany(data) {
		if (data && data.parsed) {
			for (let i in data.parsed.owners) {
				if (data.parsed.owners[i].company === process.env.marble_company) {
					logger.debug('This company has registered marble owners');
					return true;
				}
			}
		}

		logger.debug('This company has not registered marble owners');
		return false;
	}

	// Detect if there are marble usernames in the settings doc that are not in the ledger
	startup_lib.find_missing_owners = function (resp) {
		let ledger = (resp) ? resp.parsed : [];
		let user_base = cp.getMarbleUsernames();

		for (let x in user_base) {
			let found = false;
			logger.debug('Looking for marble owner:', user_base[x]);
			for (let i in ledger.owners) {
				if (user_base[x] === ledger.owners[i].username) {
					found = true;
					break;
				}
			}
			if (found === false) {
				logger.debug('Did not find marble username:', user_base[x]);
				return true;
			}
		}
		return false;
	};

	// setup marbles library and check if cc is instantiated
	startup_lib.setup_marbles_lib = function (host, port, cb) {
		var opts = cp.makeMarblesLibOptions();
		marbles_lib = require('./marbles_cc_lib.js')(enrollObj, opts, fcw, logger);
		ws_server.setup(null, marbles_lib);
		cc_detect_attempt++;										// keep track of how many times we've done this

		logger.debug('Checking if chaincode is already instantiated or not', cc_detect_attempt);
		const channel = cp.getChannelId();
		const first_peer = cp.getFirstPeerName(channel);
		var options = {
			peer_urls: [cp.getPeersUrl(first_peer)],
		};

		marbles_lib.check_if_already_instantiated(options, function (not_instantiated, enrollUser) {
			if (not_instantiated) {									// if this is truthy we have not yet instantiated.... error
				console.log('debug', typeof not_instantiated, not_instantiated);
				if (cc_detect_attempt <= 40 && typeof not_instantiated === 'string' && not_instantiated.indexOf('premature execution') >= 0) {
					console.log('');
					logger.debug('Chaincode is still starting! this can take a minute or two.  I\'ll check again in a moment.', cc_detect_attempt);
					ws_server.record_state('find_chaincode', 'polling');
					ws_server.broadcast_state();
					return setTimeout(function () {					// try again in a few seconds, this loops for awhile so ... beware
						startup_lib.setup_marbles_lib(host, port, cb);
					}, 15 * 1000);
				} else {
					console.log('');
					logger.debug('Chaincode was not detected: "' + cp.getChaincodeId() + '", all stop');
					logger.debug('Open your browser to http://' + host + ':' + port + ' and login to tweak settings for startup');
					ws_server.record_state('find_chaincode', 'failed');
					ws_server.broadcast_state();
				}
			} else {												// else we already instantiated
				console.log('\n----------------------------- Chaincode found on channel "' + cp.getChannelId() + '" -----------------------------\n');
				cc_detect_attempt = 0;			// reset
        if (cb) cb(null);
			}
		});
	};

	// Enroll an admin with the CA for this peer/channel
	startup_lib.enroll_admin = function (attempt, cb) {
		fcw.enroll(cp.makeEnrollmentOptions(0), function (errCode, obj) {
			if (errCode != null) {
				logger.error('could not enroll...');

				// --- Try Again ---  //
				if (attempt >= 2) {
					if (cb) cb(errCode);
				} else {
					startup_lib.removeKVS();
					startup_lib.enroll_admin(++attempt, cb);
				}
			} else {
				enrollObj = obj;
				if (cb) cb(null);
			}
		});
	};

	// Clean Up OLD KVS
	startup_lib.removeKVS = function () {
		try {
			logger.warn('removing older kvs and trying to enroll again');
			misc.rmdir(cp.getKvsPath({ going2delete: true }));			//delete old kvs folder
			logger.warn('removed older kvs');
		} catch (e) {
			logger.error('could not delete old kvs', e);
		}
	};

	// We are done, inform the clients
	startup_lib.all_done = function () {
		console.log('\n------------------------------------------ All Done ------------------------------------------\n');
		ws_server.record_state('register_owners', 'success');
		ws_server.broadcast_state();
		ws_server.check_for_updates(null);									//call the periodic task to get the state of everything
	};

	return startup_lib;
};
