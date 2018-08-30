
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

  $('#lookupBill').click(function () {
    if (mp_stat !== mainpannel[2]){
      mp_dom.hide();
      $('#lookupbillWrap').show();
      mp_stat = mainpannel[2];
      mp_dom = $('#lookupbillWrap');
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
    console.log('query billID sending', obj)
    ws.send(JSON.stringify(obj));
  });


  //billhandl---------------------------------------------------------------------
  //close the pannel
  $('#BHbuttonClose').click(function () {
    $('#billHandleWrap').fadeOut();
  });

  //submitbill---------------------------------------------------------------------
  //issuer's id autofill
  $('input[name="issuerName"]').bind('input propertychange', function () {
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
    var horName = $('input[name="holderName"]').val();
    if (acNames.indexOf(horName) >= 0) {
      for (var i =0; i < know_accounts.length; i++) {
        if (know_accounts[i].acName === horName) {
          $('input[name="holderID"]').val(know_accounts[i].acID);
        }
      }
    }
  });
});