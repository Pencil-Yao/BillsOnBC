

var billsList = [];

// =================================================================================
//	UI Building
// =================================================================================
//build note
function build_note(msg) {
  $('#noteWrap').fadeIn();
  if(msg.msg === "tx_issue") {
    if(msg.state === "finished") {
      var h1Html = "票据发布成功";
      $('#noteH1').html(h1Html);
      var txHtml = msg.data;
      $('#noteTxId').html(txHtml);
    }
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
        <td>` + bill.State + `</td>
        <td>TBD</td>
        <td><button type="button" class="billButton" billIndex="` + i + `" billID="` + bill.billInfoID + `">详情</button></td>
      </tr>`;
    $('#billsList').append(html);
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
  $('input[name="BHacceptOrID"]').val(billData.acceptOrID);
  $('input[name="BHpayeeName"]').val(billData.payeeName);
  $('input[name="BHpayeeID"]').val(billData.payeeID);
  $('input[name="BHholderName"]').val(billData.holderName);
  $('input[name="BHholderID"]').val(billData.holderID);
  console.log('[ui] clearing bill history table');
  $('#billsHandleList').html('');
  var htmlTableHead = `<caption id="billsHandleListCaption">历史流转信息</caption>
    <tr class="billsHandleListFTR">
      <th class="firstcol">TxID</th>
      <th>操作业务</th>
      <th>操作描述</th>
      <th>操作时间</th>
      <th>当前持票人</th>
    </tr>`;
  $('#billsHandleList').append(htmlTableHead);
  for (var i = 0; i < billData.History.length; i++){
    var html = '';
    var billHis = billData.History[i];
    console.log('[ui] building bill history table ' + billData.billInfoID);
    html += `<tr>
        <td>` + billHis.txId + `</td>
        <td>` + billHis.bill.State + `</td>   
        <td>TBD</td>
        <td>` + billHis.bill.operateDate + `</td>
        <td>` + billHis.bill.holderID + `</td>
      </tr>`;
    $('#billsHandleList').append(html);
  }

}