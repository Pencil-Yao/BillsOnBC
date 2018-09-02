// ==================================
// Websocket Server Side Code
// ==================================

module.exports = function (cp, fcw, logger) {
	var ws_server = {};
	var known_everything = {};
	var marbles_lib = {};
	var wss = {};
	var known_height = 0;
	var checkPeriodically = null;
	var enrollInterval = null;
	var start_up_states = {												//Marbles Startup Steps
		checklist: { state: 'waiting', step: 'step1' },					// Step 1 - check config files for somewhat correctness
		enrolling: { state: 'waiting', step: 'step2' },					// Step 2 - enroll the admin
		find_chaincode: { state: 'waiting', step: 'step3' },			// Step 3 - find the chaincode on the channel
		register_owners: { state: 'waiting', step: 'step4' },			// Step 4 - create the marble owners
	};
	var know_accounts = [
    {acName: 'alice'},
    {acName: 'jack'},
    {acName: 'tom'},
    {acName: 'mike'},
    {acName: 'fei'}
  ];
	for (var i in know_accounts) {
    gotacID(know_accounts[i]);
    logger.info(know_accounts[i]);
  }
	//--------------------------------------------------------
	// Setup WS Module
	//--------------------------------------------------------
	ws_server.setup = function (l_wss, l_marbles_lib) {
		marbles_lib = (l_marbles_lib) ? l_marbles_lib : marbles_lib;
		wss = (l_wss) ? l_wss : wss;

		// --- Keep Alive  --- //
		clearInterval(enrollInterval);
		enrollInterval = setInterval(function () {						//to avoid REQUEST_TIMEOUT errors we periodically re-enroll
			let enroll_options = cp.makeEnrollmentOptions(0);
			fcw.enroll(enroll_options, function (err, enrollObj2) { });	//this seems to be safe 3/27/2017
		}, cp.getKeepAliveMs());										//timeout happens at 5 minutes, so this interval should be faster than that
	};

	// Message to client to communicate where we are in the start up
	ws_server.build_state_msg = function () {
		return {
			msg: 'app_state',
			state: start_up_states,
		};
	};

	// record new app state
	ws_server.record_state = function (change_state, outcome) {
		start_up_states[change_state].state = outcome;
	};

	// Send to all connected clients
	ws_server.broadcast_state = function () {
		try {
			wss.broadcast(ws_server.build_state_msg());						//tell client our app state
		} catch (e) { }														//this is expected to fail for "checking"
	};

	//--------------------------------------------------------
	// Process web socket messages - blockchain code is near. "marbles_lib"
	//--------------------------------------------------------
	ws_server.process_msg = function (ws, data) {
		const channel = cp.getChannelId();
		const first_peer = cp.getFirstPeerName(channel);
		var options = {
			peer_urls: [cp.getPeersUrl(first_peer)],
			ws: ws,
			endorsed_hook: endorse_hook,
			ordered_hook: orderer_hook
		};
		if (marbles_lib === null) {
			logger.error('marbles lib is null...');				//can't run in this state
			return;
		}

		//issue bill
		else if (data.type === 'issue'){
      logger.info('[ws] issue bill req');
      options.args = {
        billInfoID: leftPad(data.billInfoID, 19),
        billInfoAmt: data.billInfoAmt,
        billInfoType: data.billInfoType,
        billIssueDate: data.billIssueDate,
        billDeadDate: data.billDeadDate,
        issuerName: data.issuerName,
        issuerID: data.issuerID,
        acceptorName: data.acceptorName,
        acceptorID: data.acceptorID,
        payeeName: data.payeeName,
        payeeID: data.payeeID,
        holderName: data.holderName,
        holderID: data.holderID,
      };
      marbles_lib.issue_a_bill(options, function (err, resp) {
      	if (err != null) send_err(err, data);
        else {
        	options.ws.send(JSON.stringify({ msg: 'tx_issue', state: 'finished', data: options.args.billInfoID}));
        	ws_server.check_for_updates(ws);
        }
      });
		}

    //endorse bill
    else if (data.type === 'endorse') {
      logger.debug("[ws] endorse bill req");
      options.args = {
        billInfoID: data.billInfoID,
        waitEndorserID: data.waitEndorserID,
        waitEndorserName: data.waitEndorserName
      }
      marbles_lib.endorse_a_bill(options, function (err, resp) {
        if (err != null) send_err(err, data);
        else {
          options.ws.send(JSON.stringify({ msg: 'tx_endorse', state: 'finished', data: options.args.billInfoID}));
          ws_server.check_for_updates(ws);
        }
      });
    }

    //endorse bill
    else if (data.type === 'accept') {
      logger.debug("[ws] accept bill req");
      options.args = {
        billInfoID: data.billInfoID,
        endorseeID: data.endorseeID,
        endorseeName: data.endorseeName
      }
      marbles_lib.accept_a_bill(options, function (err, resp) {
        if (err != null) send_err(err, data);
        else {
          options.ws.send(JSON.stringify({ msg: 'tx_accept', state: 'finished', data: options.args.billInfoID}));
          ws_server.check_for_updates(ws);
        }
      });
    }

    //endorse bill
    else if (data.type === 'reject') {
      logger.debug("[ws] reject bill req");
      options.args = {
        billInfoID: data.billInfoID,
        endorseeID: data.endorseeID,
        endorseeName: data.endorseeName
      }
      marbles_lib.reject_a_bill(options, function (err, resp) {
        if (err != null) send_err(err, data);
        else {
          options.ws.send(JSON.stringify({ msg: 'tx_reject', state: 'finished', data: options.args.billInfoID}));
          ws_server.check_for_updates(ws);
        }
      });
    }

		//query by uerID
		else if(data.type === 'queryByUserID'){
      logger.info('[ws] query by userID req');
      options.args = {
        holderID: data.hdrid
      };
      marbles_lib.queryByUserID(options, function (err, resp) {
        if (err != null) {
          logger.debug('[checking] could not query by holder id:', err);
          var obj = {
            msg: 'error',
            e: err,
          };
          options.ws.send(JSON.stringify(obj)); 								//send to a client
        }
        else {
          var billWithHistory = resp.parsed;
          if (billWithHistory) {
            logger.debug('[checking] queryByUserID lookup bill: ', billWithHistory);
          }
          options.ws.send(JSON.stringify({ msg: 'everything', state: "finished", data: billWithHistory }));
        }
      });
		}

    //query wait bill by uerID
    else if(data.type === 'queryMyWaitBill'){
      logger.info('[ws] query wait bill by userID req');
      options.args = {
        edreeID: data.edree
      };
      marbles_lib.queryMyWaitBill(options, function (err, resp) {
        if (err != null) {
          logger.debug('[checking] could not query by bill id:', err);
          var obj = {
            msg: 'error',
            e: err,
          };
          options.ws.send(JSON.stringify(obj)); 								//send to a client
        }
        else {
          var billWithHistory = resp.parsed;
          if (billWithHistory) {
            logger.debug('[checking] queryMyWaitBill wait bill: ', billWithHistory);
          }
          options.ws.send(JSON.stringify({msg: 'tx_queryWaitBill', state: 'finished', data: billWithHistory}));
        }
      });
    }

		//query by billID
    else if(data.type === 'queryByBillID'){
		  logger.info('[ws] query by billID req');
		  options.args = {
		    billInfoID: leftPad(data.billInfoID, 19)
      };
      marbles_lib.queryByBillID(options, function (err, resp) {
        if (err != null) {
          logger.debug('[checking] could not query by bill id:', err);
          var obj = {
            msg: 'error',
            e: err,
          };
          options.ws.send(JSON.stringify(obj)); 								//send to a client
        }
        else {
          var billWithHistory = resp.parsed;
          if (billWithHistory) {
            logger.debug('[checking] queryByBillID lookup bill: ', billWithHistory);
          }
          if (data.version === 1) {
          	options.ws.send(JSON.stringify({msg: 'tx_queryBillID', state: 'finished', data: billWithHistory}));
          } else if (data.version === 2) {
            options.ws.send(JSON.stringify({msg: 'tx_queryWaitBillID', state: 'finished', data: billWithHistory}));
					}
        }
      });
    }

    //get user account name and id
    else if (data.type === 'get_account'){
      logger.debug('[ac] get user account info req');
		  options.ws.send(JSON.stringify({msg: 'send_account', data: know_accounts}));
    }

		// send transaction error msg
		function send_err(msg, input) {
			sendMsg({ msg: 'tx_error', e: msg, input: input });
			sendMsg({ msg: 'tx_step', state: 'committing_failed' });
		}

		// send a message, socket might be closed...
		function sendMsg(json) {
			if (ws) {
				try {
					ws.send(JSON.stringify(json));
				}
				catch (e) {
					logger.debug('[ws error] could not send msg', e);
				}
			}
		}

		// endorsement stage callback
		function endorse_hook(err) {
			if (err) sendMsg({ msg: 'tx_step', state: 'endorsing_failed' });
			else sendMsg({ msg: 'tx_step', state: 'ordering' });
		}

		// ordering stage callback
		function orderer_hook(err) {
			if (err) sendMsg({ msg: 'tx_step', state: 'ordering_failed' });
			else sendMsg({ msg: 'tx_step', state: 'committing' });
		}
	};

	// sch next periodic check
	function sch_next_check() {
		clearTimeout(checkPeriodically);
		checkPeriodically = setTimeout(function () {
			try {
				ws_server.check_for_updates(null);
			}
			catch (e) {
				logger.error('Error in sch next check\n\n', e);
				sch_next_check();
				ws_server.check_for_updates(null);
			}
		}, cp.getBlockDelay() + 2000);
	}

	// --------------------------------------------------------
	// Check for Updates to Ledger
	// --------------------------------------------------------
	ws_server.check_for_updates = function (ws_client) {
		marbles_lib.channel_stats(null, function (err, resp) {
			var newBlock = false;
			if (err != null) {
				var eObj = {
					msg: 'error',
					e: err,
				};
				if (ws_client) ws_client.send(JSON.stringify(eObj)); 									//send to a client
				else wss.broadcast(eObj);																//send to all clients
			} else {
				if (resp && resp.height && resp.height.low) {
					if (resp.height.low > known_height || ws_client) {
						if (!ws_client) {
							logger.info('New block detected!', resp.height.low, resp);
							known_height = resp.height.low;
							newBlock = true;
							logger.debug('[checking] there are new things, sending to all clients');
							wss.broadcast({ msg: 'block', e: null, block_height: resp.height.low });	//send to all clients
						} else {
							logger.debug('[checking] on demand req, sending to a client');
							var obj = {
								msg: 'block',
								e: null,
								block_height: resp.height.low,
								block_delay: cp.getBlockDelay()
							};
							ws_client.send(JSON.stringify(obj)); 										//send to a client
						}
					}
				}
			}
			sch_next_check();						//check again
		});
	};

	// read complete state of bills world
	function queryByUserID(ws_client, options, cb) {
		marbles_lib.queryByUserID(options, function (err, resp) {
			if (err != null) {
				console.log('');
				logger.debug('[checking] could not query by user id:', err);
				var obj = {
					msg: 'error',
					e: err,
				};
				if (ws_client) ws_client.send(JSON.stringify(obj)); 								//send to a client
				else wss.broadcast(obj);																//send to all clients
				if (cb) cb();
			}
			else {
				var billsList = resp.parsed;
				if (billsList) {
					logger.debug('[checking] number of bills:', billsList.length);
				}

				var knownAsString = JSON.stringify(known_everything);			//stringify for easy comparison (order should stay the same)
				var latestListAsString = JSON.stringify(billsList);

				if (knownAsString === latestListAsString) {
					logger.debug('[checking] same bills list as last time');
					if (ws_client !== null) {									//if this is answering a clients req, send to 1 client
						logger.debug('[checking] sending to 1 client');
						ws_client.send(JSON.stringify({ msg: 'everything', e: err, everything: latestListAsString }));
					}
				}
				else {															//detected new things, send it out
					logger.debug('[checking] there are new things, sending to all clients');
					known_everything = latestListAsString;
					wss.broadcast({ msg: 'everything', e: err, everything: latestListAsString });	//sent to all clients
				}
				if (cb) cb();
			}
		});
	}

	// alpha sort everyone else
	function sort_usernames(temp) {
		temp.sort(function (a, b) {
			var entryA = a.company + a.username;
			var entryB = b.company + b.username;
			if (entryA < entryB) return -1;
			if (entryA > entryB) return 1;
			return 0;
		});
		return temp;
	}

  // left pad string with "0"s
  function leftPad(str, length) {
    for (var i = str.length; i < length; i++) str = '0' + String(str);
    return str;
  }

  //sanitize the account
  function gotacID(ac) {
    if (!ac.acName){
      logger.error("[ac] initial the account without acName");
      return
    }
    else {
      var acCode = toASC(ac.acName.toLowerCase());
      ac.acID = 'CIM' + leftPad(acCode, 15);
    }
  }

  function toASC(acname) {
	  var ascname = '';
    for(var i=acname.length-1;i>=0;i--){
      var str = acname.charAt(i);
      var astr = str.charCodeAt();
      ascname += astr;
    }
    return ascname;
  }

	return ws_server;
};
