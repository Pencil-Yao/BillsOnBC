
var mainpannel = ["submitBill", "mybills", "lookupbills"];
var mp_stat = null;
var mp_dom = null;
$(document).on('ready', function () {
  mp_stat = mainpannel[0];
  mp_dom = $('#SBusedtohidden');

  connect_to_server();

  //login event
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

  //paudit
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

  //mainpanel
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
      acceptOrID: $('input[name="acceptOrID"]').val(),
      payeeName: $('input[name="payeeName"]').val(),
      payeeID: $('input[name="payeeID"]').val(),
      holderName: $('input[name="holderName"]').val(),
      holderID: $('input[name="holderID"]').val(),
      version: 1
    };
    console.log('Issue bill, sending', obj);
    ws.send(JSON.stringify(obj));
  });
});