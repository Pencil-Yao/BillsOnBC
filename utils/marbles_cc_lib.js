//-------------------------------------------------------------------
// Marbles Chaincode Library
// - this contains the most interesting code pieces of marbles.
// - each function is using the FCW library to communicate to the peer/orderer
// - from here we can interact with our chaincode.
//   - the cc_function is the chaincode function we will call
//   - the cc_args are the arguments to pass to your chaincode function
//-------------------------------------------------------------------

module.exports = function (enrollObj, g_options, fcw, logger) {
	var marbles_chaincode = {};

	// Chaincode -------------------------------------------------------------------------------

	//check if chaincode exists
	marbles_chaincode.check_if_already_instantiated = function (options, cb) {
		console.log('');
		logger.info('Checking for chaincode...');

		var opts = {
			peer_urls: g_options.peer_urls,
			peer_tls_opts: g_options.peer_tls_opts,
			channel_id: g_options.channel_id,
			chaincode_id: g_options.chaincode_id,
			chaincode_version: g_options.chaincode_version,
			cc_function: 'check',
			cc_args: ['selftest']
		};
		fcw.query_chaincode(enrollObj, opts, function (err, resp) {  // send a request to our peer
			if (err != null) {
				if (cb) return cb(err, resp);
			}
			else {
				if (resp.parsed == null || isNaN(resp.parsed)) {	 //if nothing is here, no chaincode
					if (cb) return cb({ error: 'chaincode not found' }, resp);
				}
				else {
					if (cb) return cb(null, resp);
				}
			}
		});
	};

	//check chaincode version
	marbles_chaincode.check_version = function (options, cb) {
		console.log('');
		logger.info('Checking chaincode and ui compatibility...');

		var opts = {
			peer_urls: g_options.peer_urls,
			peer_tls_opts: g_options.peer_tls_opts,
			channel_id: g_options.channel_id,
			chaincode_id: g_options.chaincode_id,
			chaincode_version: g_options.chaincode_version,
			cc_function: 'read',
			cc_args: ['marbles_ui']
		};
		fcw.query_chaincode(enrollObj, opts, function (err, resp) {
			if (err != null) {
				if (cb) return cb(err, resp);
			}
			else {
				if (resp.parsed == null) {							//if nothing is here, no chaincode
					if (cb) return cb({ error: 'chaincode not found' }, resp);
				}
				else {
					if (cb) return cb(null, resp);
				}
			}
		});
	};


	// Marbles -------------------------------------------------------------------------------
	//build full name
	marbles_chaincode.build_owner_name = function (username, company) {
		return build_owner_name(username, company);
	};


	// All ---------------------------------------------------------------------------------
	// get block height of the channel
	marbles_chaincode.channel_stats = function (options, cb) {
		var opts = {
			peer_urls: g_options.peer_urls,
			peer_tls_opts: g_options.peer_tls_opts
		};
		fcw.query_channel(enrollObj, opts, cb);
	};


	// Other -------------------------------------------------------------------------------

	// Format Owner's Actual Key Name
	function build_owner_name(username, company) {
		return username.toLowerCase() + '.' + company;
	}

	// random string of x length
	function randStr(length) {
		var text = '';
		var possible = 'abcdefghijkmnpqrstuvwxyz0123456789ABCDEFGHJKMNPQRSTUVWXYZ';
		for (var i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	}

	// left pad string with "0"s
	function leftPad(str, length) {
		for (var i = str.length; i < length; i++) str = '0' + String(str);
		return str;
	}

  //Bill ----------------------------------------------------------------------------------
  //issue a bill
  marbles_chaincode.issue_a_bill = function (options, cb) {
    logger.info('Issuing a bill...');
    var opts = {
      peer_urls: g_options.peer_urls,
      peer_tls_opts: g_options.peer_tls_opts,
      channel_id: g_options.channel_id,
      chaincode_id: g_options.chaincode_id,
      chaincode_version: g_options.chaincode_version,
      event_urls: g_options.event_urls,
      endorsed_hook: options.endorsed_hook,
      ordered_hook: options.ordered_hook,
      cc_function: 'issue',
      cc_args: [JSON.stringify(options.args)],
    };
    fcw.invoke_chaincode(enrollObj, opts, function (err, resp) {
      if (cb) {
        if (!resp) resp = {};
        cb(err, resp);
      }
    });
  };
  //endorse a bill
  marbles_chaincode.endorse_a_bill = function (options, cb) {
    logger.info('Endorse a bill...');
    var opts = {
      peer_urls: g_options.peer_urls,
      peer_tls_opts: g_options.peer_tls_opts,
      channel_id: g_options.channel_id,
      chaincode_id: g_options.chaincode_id,
      chaincode_version: g_options.chaincode_version,
      event_urls: g_options.event_urls,
      endorsed_hook: options.endorsed_hook,
      ordered_hook: options.ordered_hook,
      cc_function: 'endorse',
      cc_args: [
      	options.args.billInfoID,
				options.args.waitEndorserID,
				options.args.waitEndorserName
			],
    };
    fcw.invoke_chaincode(enrollObj, opts, function (err, resp) {
      if (cb) {
        if (!resp) resp = {};
        cb(err, resp);
      }
    });
  };
  //accept a bill
  marbles_chaincode.accept_a_bill = function (options, cb) {
    logger.info('Accept a bill...');
    var opts = {
      peer_urls: g_options.peer_urls,
      peer_tls_opts: g_options.peer_tls_opts,
      channel_id: g_options.channel_id,
      chaincode_id: g_options.chaincode_id,
      chaincode_version: g_options.chaincode_version,
      event_urls: g_options.event_urls,
      endorsed_hook: options.endorsed_hook,
      ordered_hook: options.ordered_hook,
      cc_function: 'accept',
      cc_args: [
        options.args.billInfoID,
        options.args.endorseeID,
        options.args.endorseeName
      ],
    };
    fcw.invoke_chaincode(enrollObj, opts, function (err, resp) {
      if (cb) {
        if (!resp) resp = {};
        cb(err, resp);
      }
    });
  };
  //accept a bill
  marbles_chaincode.reject_a_bill = function (options, cb) {
    logger.info('Reject a bill...');
    var opts = {
      peer_urls: g_options.peer_urls,
      peer_tls_opts: g_options.peer_tls_opts,
      channel_id: g_options.channel_id,
      chaincode_id: g_options.chaincode_id,
      chaincode_version: g_options.chaincode_version,
      event_urls: g_options.event_urls,
      endorsed_hook: options.endorsed_hook,
      ordered_hook: options.ordered_hook,
      cc_function: 'reject',
      cc_args: [
        options.args.billInfoID,
        options.args.endorseeID,
        options.args.endorseeName
      ],
    };
    fcw.invoke_chaincode(enrollObj, opts, function (err, resp) {
      if (cb) {
        if (!resp) resp = {};
        cb(err, resp);
      }
    });
  };


  //query bills list by userID
  marbles_chaincode.queryByUserID = function (options, cb) {
    logger.info('Query by User ID...');

    var opts = {
      peer_urls: g_options.peer_urls,
      peer_tls_opts: g_options.peer_tls_opts,
      channel_id: g_options.channel_id,
      chaincode_version: g_options.chaincode_version,
      chaincode_id: g_options.chaincode_id,
      cc_function: 'queryMyBill',
      cc_args: [options.args.holderID]
    };
    fcw.query_chaincode(enrollObj, opts, cb);
  };
  //query bills list by userID
  marbles_chaincode.queryByBillID = function (options, cb) {
    logger.info('Query by Bill ID...');

    var opts = {
      peer_urls: g_options.peer_urls,
      peer_tls_opts: g_options.peer_tls_opts,
      channel_id: g_options.channel_id,
      chaincode_version: g_options.chaincode_version,
      chaincode_id: g_options.chaincode_id,
      cc_function: 'queryByBillID',
      cc_args: [options.args.billInfoID]
    };
    fcw.query_chaincode(enrollObj, opts, cb);
  };
  //query bills list by endorseeID
  marbles_chaincode.queryMyWaitBill = function (options, cb) {
    logger.info('Query Wait Bill by Endorsee ID...');

    var opts = {
      peer_urls: g_options.peer_urls,
      peer_tls_opts: g_options.peer_tls_opts,
      channel_id: g_options.channel_id,
      chaincode_version: g_options.chaincode_version,
      chaincode_id: g_options.chaincode_id,
      cc_function: 'queryMyWaitBill',
      cc_args: [options.args.edreeID]
    };
    fcw.query_chaincode(enrollObj, opts, cb);
  };

	return marbles_chaincode;
};
