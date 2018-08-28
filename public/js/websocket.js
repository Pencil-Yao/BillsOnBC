var getEverythingWatchdog = null;
var wsTxt = '[ws]';
var pendingTransaction = null;
var pendingTxDrawing = [];

// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server() {
  var connected = false;
  var ws_keep_alive = null;
  connect();

  function connect() {
    var wsUri = null;
    if (document.location.protocol === 'https:') {
      wsTxt = '[wss]';
      wsUri = 'wss://' + document.location.hostname + ':' + document.location.port;
    } else {
      wsUri = 'ws://' + document.location.hostname + ':' + document.location.port;
    }
    console.log(wsTxt + ' Connecting to websocket', wsUri);

    ws = new WebSocket(wsUri);
    ws.onopen = function (evt) {
      onOpen(evt);
    };
    ws.onclose = function (evt) {
      onClose(evt);
    };
    ws.onmessage = function (evt) {
      onMessage(evt);
    };
    ws.onerror = function (evt) {
      onError(evt);
    };
  }

  function onOpen(evt) {
    console.log(wsTxt + ' CONNECTED');
    // addshow_notification(build_notification(false, 'Connected to Marbles application'), false); //todo notification
    connected = true;

    clearInterval(ws_keep_alive);
    ws_keep_alive = setInterval(function () {
      ws.send(JSON.stringify({ type: 'ping' }));
      console.log(wsTxt + ' ping sent');								// send a keep alive faster than 2 minutes
    }, 90 * 1000);
  }

  function onClose(evt) {
    clearInterval(ws_keep_alive);
    setTimeout(() => {
      console.log(wsTxt + ' DISCONNECTED', evt);
      connected = false;
      // addshow_notification(build_notification(true, 'Lost connection to Marbles application'), true); //todo notification
      setTimeout(function () { connect(); }, 5000);					//try again one more time, server restarts are quick
    }, 1000);
  }


  function onMessage(msg) {
    try {
      var msgObj = JSON.parse(msg.data);

      if (msgObj.msg === 'data1') {
      }

      //transaction
      else if (msgObj.msg === 'tx_step') {
        console.log(wsTxt + ' rec', msgObj.msg, msgObj);
        // show_tx_step(msgObj);
      }

      else if (msgObj.msg === 'tx_error') {
        console.log(wsTxt + ' rec', msgObj.msg, msgObj);
        if (msgObj.e) {
          var err_msg = (msgObj.e.parsed) ? msgObj.e.parsed : msgObj.e;
          // addshow_notification(build_notification(true, escapeHtml(err_msg)), true);
          // $('#txStoryErrorTxt').html(err_msg);
          // $('#txStoryErrorWrap').show();
          console.log(msgObj.e);
        }
      }

      //general error
      else if (msgObj.msg === 'error') {
        console.log(wsTxt + ' rec', msgObj.msg, msgObj);
        if (msgObj.e && msgObj.e.parsed) {
          // addshow_notification(build_notification(true, escapeHtml(msgObj.e.parsed)), true);
          console.log(msgObj.e.parsed);
        } else if (msgObj.e) {
          // addshow_notification(build_notification(true, escapeHtml(msgObj.e)), true);
          console.log(msgObj.e);
        }
      }

      //unknown
      else console.log(wsTxt + ' rec', msgObj.msg, msgObj);
    }
    catch (e) {
      console.log(wsTxt + ' error handling a ws message', e);
    }
  }
}