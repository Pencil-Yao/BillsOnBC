
var mainpannel = ["submitBill", "mybills", "lookupbills"];
var mp_stat = null;
var mp_dom = null;
$(document).on('ready', function () {
  mp_stat = mainpannel[0];
  mp_dom = $('#SBusedtohidden');

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
});