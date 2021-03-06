

var billsList = [];
var waitBillsList = [];
const BillInfoStateNewPublish   = "NewPublish";
const BillInfoStateEndrWaitSign = "EndrWaitSign";
const BillInfoStateEndrSigned   = "EndrSigned";
const BillInfoStateEndrReject   = "EndrReject";

// =================================================================================
//	UI Building
// =================================================================================
//build note
function build_note(msg) {
  $('#noteWrap').fadeIn();
  if (msg.e) {
    var h1Html = msg.content;
    $('#noteH1').html(h1Html);
    var txHtml = msg.e;
    $('#noteTxId').html(txHtml);
  }else if(msg.state === "finished") {
    var h1Html = msg.content;
    $('#noteH1').html(h1Html);
    var txHtml = msg.data;
    $('#noteTxId').html(txHtml);
  }
}

//build user bills wrap
function build_user_bills(userBills){
  billsList = userBills;
  //reset
  console.log('[ui] clearing all user bills');
  $('#billsList').html('');
  var htmlTableHead = `<caption id="billsListCaption">票据列表</caption>
    <tr class="billsListFTR">
      <th>票据号</th>
      <th>票据状态</th>
      <th>所属关系</th>
      <th>操作</th>
    </tr>`;
  $('#billsList').append(htmlTableHead);
  for (var i = 0; i < billsList.length; i++){
    var html = '';
    var bill = billsList[i];
    console.log('[ui] building user bill ' + bill.billInfoID);
    html += `<tr billIndex="`+ bill.billInfoID + `">
        <td>` + bill.billInfoID + `</td>
        <td>` + bill.state + `</td>
        <td>A公司</td>
        <td><button type="button" class="billButton" billIndex="` + i + `" billID="` + bill.billInfoID + `">详情</button></td>
      </tr>`;
    $('#billsList').append(html);
  }
}

//build user waitbills wrap
function build_user_wait_bills(userWaitBills){
  waitBillsList = userWaitBills;
  //reset
  console.log('[ui] clearing all user wait bills');
  $('#LUbillsList').html('');
  var htmlTableHead = `<caption id="LUbillsListCaption">票据列表</caption>
    <tr class="billsListFTR">
      <th>票据号</th>
      <th>票据状态</th>
      <th>所属关系</th>
      <th>操作</th>
    </tr>`;
  $('#LUbillsList').append(htmlTableHead);
  for (var i = 0; i < waitBillsList.length; i++){
    var html = '';
    var bill = waitBillsList[i];
    console.log('[ui] building user wait bill ' + bill.billInfoID);
    html += `<tr billIndex="`+ bill.billInfoID + `">
        <td>` + bill.billInfoID + `</td>
        <td>` + bill.state + `</td>
        <td>A公司 </td>
        <td><button type="button" class="LUbillButton" billIndex="` + i + `" billID="` + bill.billInfoID + `">详情</button></td>
      </tr>`;
    $('#LUbillsList').append(html);
  }
}

//build bill handle
function build_billhandle(billData) {
  console.log('[ui] build bill handle');
  $('#billHandleWrap').fadeIn();
  $('input[name="BHbillInfoID"]').val(billData.billInfoID);
  $('input[name="BHbillInfoAmt"]').val(billData.billInfoAmt);
  $('input[name="BHbillInfoType"]').val(billData.billInfoType);
  $('input[name="BHbillIssueDate"]').val(billData.billIssueDate);
  $('input[name="BHbillDeadDate"]').val(billData.billDeadDate);
  $('input[name="BHissuerName"]').val(billData.issuerName);
  $('input[name="BHissuerID"]').val(billData.issuerID);
  $('input[name="BHacceptorName"]').val(billData.acceptorName);
  $('input[name="BHacceptOrID"]').val(billData.acceptorID);
  $('input[name="BHpayeeName"]').val(billData.payeeName);
  $('input[name="BHpayeeID"]').val(billData.payeeID);
  $('input[name="BHholderName"]').val(billData.holderName);
  $('input[name="BHholderID"]').val(billData.holderID);
  console.log('[ui] clearing bill history table');
  $('#billsHandleList').html('');
  var htmlTableHead = `<caption id="billsHandleListCaption">历史流转信息</caption>
    <tr class="billsHandleListFTR">
      <th>TxID</th>
      <th>操作业务</th>
      <th>操作描述</th>
      <th>操作时间</th>
      <th>当前持票人</th>
    </tr>`;
  $('#billsHandleList').append(htmlTableHead);
  for (var i = 0; i < billData.history.length; i++){
    var html = '';
    var billHis = billData.history[i];
    var htmlstate = '';
    htmlstate = build_state(billHis.bill);
    console.log('[ui] building bill history table ' + billData.billInfoID);
    html += `<tr>
        <td class="firstcol">` + "0x" + billHis.txId + `</td>
        <td>` + billHis.bill.state + `</td>   
        <td>` + htmlstate + `</td>
        <td>` + billHis.bill.operateDate + `</td>
        <td>` + billHis.bill.holderID + "(" + billHis.bill.holderName + ")" + `</td>
      </tr>`;
    $('#billsHandleList').append(html);
  }
}

//build tip info account name
function build_actip(acnames) {
  var tiptext = "The account name in the system: " + acnames;
  $('.tooltiptext').html(tiptext);
}

function build_state(bill) {
  if (bill.state === BillInfoStateNewPublish) {
    return bill.issuerName + "向" + bill.holderName + "发布票据";
  } else if (bill.state === BillInfoStateEndrSigned) {
    return bill.holderName + "签收票据";
  } else if (bill.state === BillInfoStateEndrReject) {
    return bill.rejectEndorserName + "拒绝" + bill.holderName + "的背书票据";
  } else if (bill.state === BillInfoStateEndrWaitSign) {
    return bill.holderName + "的票据背书等待" + bill.waitEndorserName + "签收";
  }
}
