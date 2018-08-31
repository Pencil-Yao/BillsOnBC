
var mainpannel = ["submitBill", "mybills", "lookupbills"];
var mp_stat = null;
var mp_dom = null;
var know_accounts = {};
var acNames = [];
var curUser = {};
var loginuser = ''
var block_ui_delay = 5000; 								//default, gets set in ws block msg
$(document).on('ready', function () {
  mp_stat = mainpannel[0];
  mp_dom = $('#SBusedtohidden');

  connect_to_server();

  //nav------------------------------------------------------------------------
  $('#whoAmI').click(function () {
    if ($('#userSelect').is(':visible')) {
      $('#userSelect').fadeOut();
      $('#carrot').removeClass('fa-angle-up').addClass('fa-angle-down');
    }
    else {
      $('#userSelect').fadeIn();
      $('#carrot').removeClass('fa-angle-down').addClass('fa-angle-up');
    }
  });

  //paudit---------------------------------------------------------------------
  $('#menuDrop').click(function () {
    if ($('#menuChoice').is(':visible')) {
      $('#menuChoice').fadeOut();
      $('#carrot2').removeClass('fa-angle-down').addClass('fa-angle-up');
    }
    else {
      $('#menuChoice').fadeIn();
      $('#carrot2').removeClass('fa-angle-up').addClass('fa-angle-down');
    }
  });

  //paudit menu oprate
  $('#submitBill').click(function () {
    if (mp_stat !== mainpannel[0]){
      mp_dom.hide();
      $('#SBusedtohidden').show();
      mp_stat = mainpannel[0];
      mp_dom = $('#SBusedtohidden');
    }
  });

  $('#myBill').click(function () {
    if (mp_stat !== mainpannel[1]){
      mp_dom.hide();
      $('#mybillWrap').show();
      mp_stat = mainpannel[1];
      mp_dom = $('#mybillWrap');
      getBillsByUserID(curUser.acID);
    }
  });

  $('#waitBill').click(function () {
    if (mp_stat !== mainpannel[2]){
      mp_dom.hide();
      $('#lookupbillWrap').show();
      mp_stat = mainpannel[2];
      mp_dom = $('#lookupbillWrap');
      getWaitBillsByUserID(curUser.acID);
    }
  });

  //mainpanel---------------------------------------------------------------------
  //submit bill button
  $('#submitButton').click(function () {
    console.log('Issue Bill');
    var obj = {
      type: 'issue',
      billInfoID: $('input[name="billInfoID"]').val(),
      billInfoAmt: $('input[name="billInfoAmt"]').val(),
      billInfoType: $('input[name="billInfoType"]').val(),
      billIssueDate: $('input[name="billIssueDate"]').val(),
      billDeadDate: $('input[name="billDeadDate"]').val(),
      issuerName: $('input[name="issuerName"]').val(),
      issuerID: $('input[name="issuerID"]').val(),
      acceptorName: $('input[name="acceptorName"]').val(),
      acceptorID: $('input[name="acceptorID"]').val(),
      payeeName: $('input[name="payeeName"]').val(),
      payeeID: $('input[name="payeeID"]').val(),
      holderName: $('input[name="holderName"]').val(),
      holderID: $('input[name="holderID"]').val(),
      version: 1
    };
    console.log('Issue bill, sending', obj);
    ws.send(JSON.stringify(obj));
    //todo loading step
  });

  //note---------------------------------------------------------------------
  //note ok
  $('#noteButton').click(function () {
    $('#noteWrap').fadeOut();
  });

  //mybill---------------------------------------------------------------------
  //bill index button
  $(document).on('click', '.billButton', function () {
    var billID = $(this).attr('billID');
    var obj = {
      type: 'queryByBillID',
      billInfoID: billID,
      version: 1
    };
    console.log('query billID sending', obj);
    ws.send(JSON.stringify(obj));
  });

  //waitbill---------------------------------------------------------------------
  //wait bill index button
  $(document).on('click', '.LUbillButton', function () {
    var billID = $(this).attr('billID');
    var obj = {
      type: 'queryByBillID',
      billInfoID: billID,
      version: 2
    };
    console.log('query billID sending', obj);
    ws.send(JSON.stringify(obj));
  });


  //billhandl---------------------------------------------------------------------
  //close the pannel
  $('#BHbuttonClose').click(function () {
    $('#billHandleWrap').fadeOut();
    $('#BHusedtohidden').fadeOut();
    $('#BHbuttonEndorse').fadeOut();
    $('#BHbuttonAccept').fadeOut();
    $('#BHbuttonReject').fadeOut();
  });

  $('#BHbuttonEndorse').click(function () {
    console.log("endorse bill");
    var obj = {
      type: 'endorse',
      billInfoID: $('input[name="BHbillInfoID"]').val(),
      waitEndorserName: $('input[name="BHendorseeName"]').val(),
      waitEndorserID: $('input[name="BHendorseeID"]').val(),
      version: 1
    }
    console.log("Endorse bill, sending ", obj)
    ws.send(JSON.stringify(obj));
  //  todo loading step
  });

  $('#BHbuttonAccept').click(function () {
    console.log("accept bill");
    var obj = {
      type: "accept",
      billInfoID: $('input[name="BHbillInfoID"]').val(),
      endorseeName: curUser.acName,
      endorseeID: curUser.acID
    };
    console.log("Accept bill, sending ", obj)
    ws.send(JSON.stringify(obj));
    //  todo loading step
  });

  $('#BHbuttonReject').click(function () {
    console.log("reject bill");
    var obj = {
      type: "reject",
      billInfoID: $('input[name="BHbillInfoID"]').val(),
      endorseeName: curUser.acName,
      endorseeID: curUser.acID
    };
    console.log("Reject bill, sending ", obj)
    ws.send(JSON.stringify(obj));
    //  todo loading step
  });

  //submitbill---------------------------------------------------------------------
  //issuer's id autofill
  $('input[name="issuerName"]').bind('input propertychange', function () {
    $('input[name="issuerID"]').val('');
    var isrName = $('input[name="issuerName"]').val();
    if (acNames.indexOf(isrName) >= 0) {
      for (var i =0; i < know_accounts.length; i++) {
        if (know_accounts[i].acName === isrName) {
          $('input[name="issuerID"]').val(know_accounts[i].acID);
        }
      }
    }
  });

  //acceptor's id autofill
  $('input[name="acceptorName"]').bind('input propertychange', function () {
    $('input[name="acceptorID"]').val('');
    var acrName = $('input[name="acceptorName"]').val();
    if (acNames.indexOf(acrName) >= 0) {
      for (var i =0; i < know_accounts.length; i++) {
        if (know_accounts[i].acName === acrName) {
          $('input[name="acceptorID"]').val(know_accounts[i].acID);
        }
      }
    }
  });

  //payee's id autofill
  $('input[name="payeeName"]').bind('input propertychange', function () {
    $('input[name="payeeID"]').val('');
    var paeName = $('input[name="payeeName"]').val();
    if (acNames.indexOf(paeName) >= 0) {
      for (var i =0; i < know_accounts.length; i++) {
        if (know_accounts[i].acName === paeName) {
          $('input[name="payeeID"]').val(know_accounts[i].acID);
        }
      }
    }
  });

  //holder's id autofill
  $('input[name="holderName"]').bind('input propertychange', function () {
    $('input[name="holderID"]').val('');
    var horName = $('input[name="holderName"]').val();
    if (acNames.indexOf(horName) >= 0) {
      for (var i =0; i < know_accounts.length; i++) {
        if (know_accounts[i].acName === horName) {
          $('input[name="holderID"]').val(know_accounts[i].acID);
        }
      }
    }
  });

  //endorsee's id autofill
  $('input[name="BHendorseeName"]').bind('input propertychange', function () {
    $('input[name="BHendorseeID"]').val('');
    var horName = $('input[name="BHendorseeName"]').val();
    if (acNames.indexOf(horName) >= 0) {
      for (var i =0; i < know_accounts.length; i++) {
        if (know_accounts[i].acName === horName) {
          $('input[name="BHendorseeID"]').val(know_accounts[i].acID);
        }
      }
    }
  });
});