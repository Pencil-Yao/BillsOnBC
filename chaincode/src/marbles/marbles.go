package main

import (
	"github.com/hyperledger/fabric/common/flogging"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
	"encoding/json"
	"time"
	"strconv"
	"fmt"
)

// logger
var chaincodeLogger = flogging.MustGetLogger("BillsOnBC")
// 票据状态
const (
	BillInfoStateNewPublish   = "NewPublish"
	BillInfoStateEndrWaitSign = "EndrWaitSign"
	BillInfoStateEndrSigned   = "EndrSigned"
	BillInfoStateEndrReject   = "EndrReject"
)

// 票据key的前缀
const Bill_Prefix = "b"

// search表的映射名
const IndexName = "userID_billInfoID"

type Bill struct {
	BillInfoID         string        `json:"billInfoID"`         //票据号码
	BillInfoAmt        string        `json:"billInfoAmt"`        //票据金额
	BillInfoType       string        `json:"billInfoType"`       //票据类型
	BillIssueDate      string        `json:"billIssueDate"`      //票据出票日期
	BillDeadDate       string        `json:"billDeadDate"`       //票据到期日期
	IssuerName         string        `json:"issuerName"`         //出票人名称
	IssuerID           string        `json:"issuerID"`           //出票人证件号
	AcceptorName       string        `json:"acceptorName"`       //承兑人名称
	AcceptorID         string        `json:"acceptorID"`         //承兑人证件号码
	PayeeName          string        `json:"payeeName"`          //收款人名称
	PayeeID            string        `json:"payeeID"`            //收款人证件号码
	HolderName         string        `json:"holderName"`         //持票人名称
	HolderID           string        `json:"holderID"`           //持票人证件号码
	WaitEndorserID  	 string        `json:"waitEndorserID"`   	 //待背书人证件号码
	WaitEndorserName   string        `json:"waitEndorserName"`   //待背书人名称
	RejectEndorserID	 string        `json:"rejectEndorserID"`	 //拒绝背书人证件号码
	RejectEndorserName string        `json:"rejectEndorserName"` //拒绝背书人名称
	State              string        `json:"state"`              //票据状态
	OperateDate				 string				 `json:"operateDate"`				 //操作时间
	History            []HistoryItem `json:"history"`            //背书历史
}

// 背书历史item结构
type HistoryItem struct {
	TxId string `json:"txId"`
	Bill Bill   `json:"bill"`
}

// chaincode response结构
type chaincodeRet struct {
	Code int    // 0 success otherwise 1
	Des  string //description
}

// chaincode
type BillChaincode struct {
}

// response message format
func getRetByte(code int, des string) []byte {
	var r chaincodeRet
	r.Code = code
	r.Des = des

	b, err := json.Marshal(r)

	if err != nil {
		chaincodeLogger.Error("marshal Ret failed")
		return nil
	}
	return b
}

// response message format
func getRetString(code int, des string) string {
	var r chaincodeRet
	r.Code = code
	r.Des = des

	b, err := json.Marshal(r)

	if err != nil {
		chaincodeLogger.Error("marshal Ret failed")
		return ""
	}
	//chaincodeLogger.Infof("%s", string(b[:]))
	return string(b[:])
}

// 根据票号取出票据
func (a *BillChaincode) getBill(stub shim.ChaincodeStubInterface, bill_No string) (Bill, bool) {
	var bill Bill
	key := Bill_Prefix + bill_No
	b, err := stub.GetState(key)
	if b == nil {
		return bill, false
	}
	err = json.Unmarshal(b, &bill)
	if err != nil {
		return bill, false
	}
	return bill, true
}

// 保存票据
func (a *BillChaincode) putBill(stub shim.ChaincodeStubInterface, bill Bill) ([]byte, bool) {

	billbytes, err := json.Marshal(bill)
	if err != nil {
		return nil, false
	}

	err = stub.PutState(Bill_Prefix+bill.BillInfoID, billbytes)
	if err != nil {
		return nil, false
	}
	return billbytes, true
}

// chaincode Init 接口
func (a *BillChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	chaincodeLogger.Info("Marbles Is Starting Up")
	_, args := stub.GetFunctionAndParameters()
	var number int
	var err error

	// expecting 1 arg for instantiate or upgrade
	if len(args) == 1 {
		chaincodeLogger.Info("  GetFunctionAndParameters() arg[0] length", len(args[0]))

		// expecting arg[0] to be length 0 for upgrade
		if len(args[0]) == 0 {
			chaincodeLogger.Info("  Uh oh, args[0] is empty...")
		} else {

			// convert numeric string to integer
			number, err = strconv.Atoi(args[0])
			if err != nil {
				return shim.Error("Expecting a numeric string argument to Init() for instantiate")
			}

			// this is a very simple test. let's write to the ledger and error out on any errors
			// it's handy to read this right away to verify network is healthy if it wrote the correct value
			err = stub.PutState("selftest", []byte(strconv.Itoa(number)))
			if err != nil {
				return shim.Error(err.Error())                  //self-test fail
			}
		}
	}

	// showing the alternative argument shim function
	alt := stub.GetStringArgs()
	chaincodeLogger.Info("  GetStringArgs() args found:", alt)

	chaincodeLogger.Info("Ready for action")                          //self-test pass
	return shim.Success(nil)
}

// 票据发布
// args: 0 - {Bill Object}
func (a *BillChaincode) issue(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		res := getRetString(1, "Invoke issue args!=1")
		return shim.Error(res)
	}

	var bill Bill
	err := json.Unmarshal([]byte(args[0]), &bill)
	if err != nil {
		res := getRetString(1, "Invoke issue unmarshal failed")
		return shim.Error(res)
	}

	_, existbl := a.getBill(stub, bill.BillInfoID)
	if existbl {
		res := getRetString(1, "Invoke issue failed : the billNo has exist ")
		return shim.Error(res)
	}

	timestamp, err := stub.GetTxTimestamp()
	if err != nil {
		res := getRetString(1, "Invoke issue failed :get time stamp failed ")
		return shim.Error(res)
	}
	chaincodeLogger.Infof("%s", timestamp)

	// 更改票据信息和状态并保存票据:票据状态设为新发布
	bill.State = BillInfoStateNewPublish
	bill.OperateDate = "UTC " + time.Now().Local().Format("2006-01-02 15:04:05")
	// 保存票据
	_, bl := a.putBill(stub, bill)
	if !bl {
		res := getRetString(1, "Invoke issue put bill failed")
		return shim.Error(res)
	}
	// 以持票人ID和票号构造复合key 向search表中保存 value为空即可 以便持票人批量查询
	holderNameBillNoIndexKey, err := stub.CreateCompositeKey(IndexName, []string{bill.HolderID, bill.BillInfoID})
	chaincodeLogger.Info(holderNameBillNoIndexKey)
	if err != nil {
		res := getRetString(1, "Invoke issue put search table failed")
		return shim.Error(res)
	}
	stub.PutState(holderNameBillNoIndexKey, []byte{0x00})

	res := getRetByte(0, "invoke issue success")
	return shim.Success(res)
}

// 背书请求
//  args: 0 - Bill_No ; 1 - Endorsee Id ; 2 - Endorsee Name
func (a *BillChaincode) endorse(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) < 3 {
		res := getRetString(1, "Invoke endorse args<3")
		return shim.Error(res)
	}
	// 根据票号取得票据
	bill, bl := a.getBill(stub, args[0])
	if !bl {
		res := getRetString(1, "Invoke endorse get bill error")
		return shim.Error(res)
	}

	if (bill.State != BillInfoStateNewPublish && bill.State != BillInfoStateEndrReject && bill.State != BillInfoStateEndrSigned) {
		res := getRetString(1, "Invoke endorse failed: Bill state not be the newpublish or endreject or endrsigned")
		return shim.Error(res)
	}

	if bill.HolderID == args[1] {
		res := getRetString(1, "Invoke endorse failed: Endorser should not be same with current Holder")
		return shim.Error(res)
	}

	// 查询背书人是否以前持有过该数据
	// 取得背书历史: 通过fabric api取得该票据的变更历史
	resultsIterator, err := stub.GetHistoryForKey(Bill_Prefix + args[0])
	if err != nil {
		res := getRetString(1, "queryByBillNo GetHistoryForKey error")
		return shim.Error(res)
	}
	defer resultsIterator.Close()

	var hisBill Bill
	for resultsIterator.HasNext() {
		historyData, err := resultsIterator.Next()
		if err != nil {
			res := getRetString(1, "queryByBillNo resultsIterator.Next() error")
			return shim.Error(res)
		}

		var hodlerNameList []string
		json.Unmarshal(historyData.Value, &hisBill) //un stringify it aka JSON.parse()
		if historyData.Value == nil { //bill has been deleted
			var emptyBill Bill
			hisBill = emptyBill //copy nil marble
		} else {
			json.Unmarshal(historyData.Value, &hisBill) //un stringify it aka JSON.parse()
		}
		hodlerNameList = append(hodlerNameList, hisBill.HolderID) //add this tx to the list

		if hisBill.HolderID == args[1] {
			res := getRetString(1, "Invoke endorse failed: Endorser should not be the bill history holder")
			return shim.Error(res)
		}
	}

	// 更改票据信息和状态并保存票据: 添加待背书人信息,重制已拒绝背书人, 票据状态改为待背书
	bill.WaitEndorserID = args[1]
	bill.WaitEndorserName = args[2]
	bill.RejectEndorserID = ""
	bill.RejectEndorserName = ""
	bill.State = BillInfoStateEndrWaitSign
	bill.OperateDate = "UTC " + time.Now().Local().Format("2006-01-02 15:04:05")
	// 保存票据
	_, bl = a.putBill(stub, bill)
	if !bl {
		res := getRetString(1, "Invoke endorse put bill failed")
		return shim.Error(res)
	}
	// 以待背书人ID和票号构造复合key 向search表中保存 value为空即可 以便待背书人批量查询
	holderNameBillNoIndexKey, err := stub.CreateCompositeKey(IndexName, []string{bill.WaitEndorserID, bill.BillInfoID})
	if err != nil {
		res := getRetString(1, "Invoke endorse put search table failed")
		return shim.Error(res)
	}
	stub.PutState(holderNameBillNoIndexKey, []byte{0x00})

	res := getRetByte(0, "invoke endorse success")
	return shim.Success(res)
}

// 背书人接受背书
// args: 0 - Bill_No ; 1 - Endorsee Id ; 2 - Endorsee Name
func (a *BillChaincode) accept(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) < 3 {
		res := getRetString(1, "Invoke accept args<3")
		return shim.Error(res)
	}
	// 根据票号取得票据
	bill, bl := a.getBill(stub, args[0])
	if !bl {
		res := getRetString(1, "Invoke accept get bill error")
		return shim.Error(res)
	}

	// 维护search表: 以前手持票人ID和票号构造复合key 从search表中删除该key 以便前手持票人无法再查到该票据
	holderNameBillNoIndexKey, err := stub.CreateCompositeKey(IndexName, []string{bill.HolderID, bill.BillInfoID})
	if err != nil {
		res := getRetString(1,"Invoke accept put search table failed")
		return shim.Error(res)
	}
	stub.DelState(holderNameBillNoIndexKey)

	// 更改票据信息和状态并保存票据: 将前手持票人改为背书人,重置待背书人,票据状态改为背书签收
	bill.HolderID = args[1]
	bill.HolderName = args[2]
	bill.WaitEndorserID = ""
	bill.WaitEndorserName = ""
	bill.State = BillInfoStateEndrSigned
	bill.OperateDate = "UTC " + time.Now().Local().Format("2006-01-02 15:04:05")
	// 保存票据
	_, bl = a.putBill(stub, bill)
	if !bl {
		res := getRetString(1, "Invoke accept put bill failed")
		return shim.Error(res)
	}

	res := getRetByte(0, "invoke accept success")
	return shim.Success(res)
}

// 背书人拒绝背书
// args: 0 - Bill_No ; 1 - Endorsee Id ; 2 - Endorsee Name
func (a *BillChaincode) reject(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) < 3 {
		res := getRetString(1, "Invoke reject args<3")
		return shim.Error(res)
	}
	// 根据票号取得票据
	bill, bl := a.getBill(stub, args[0])
	if !bl {
		res := getRetString(1, "Invoke reject get bill error")
		return shim.Error(res)
	}

	// 维护search表: 以当前背书人ID和票号构造复合key 从search表中删除该key 以便当前背书人无法再查到该票据
	holderNameBillNoIndexKey, err := stub.CreateCompositeKey(IndexName, []string{args[1], bill.BillInfoID})
	if err != nil {
		res := getRetString(1, "Invoke reject put search table failed")
		return shim.Error(res)
	}
	stub.DelState(holderNameBillNoIndexKey)

	// 更改票据信息和状态并保存票据: 将拒绝背书人改为当前背书人，重置待背书人,票据状态改为背书拒绝
	bill.WaitEndorserID = ""
	bill.WaitEndorserName = ""
	bill.RejectEndorserID = args[1]
	bill.RejectEndorserName = args[2]
	bill.State = BillInfoStateEndrReject
	bill.OperateDate = "UTC " + time.Now().Local().Format("2006-01-02 15:04:05")
	// 保存票据
	_, bl = a.putBill(stub, bill)
	if !bl {
		res := getRetString(1, "Invoke reject put bill failed")
		return shim.Error(res)
	}

	res := getRetByte(0, "invoke accept success")
	return shim.Success(res)
}

// 查询我的票据:根据持票人编号 批量查询票据
//  0 - Holder CmId ;
func (a *BillChaincode) queryMyBill(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		res := getRetString(1, "queryMyBill args!=1")
		return shim.Error(res)
	}
	// 以持票人ID从search表中批量查询所持有的票号
	billsIterator, err := stub.GetStateByPartialCompositeKey(IndexName, []string{args[0]})
	if err != nil {
		res := getRetString(1, "queryMyBill get bill list error")
		return shim.Error(res)
	}
	defer billsIterator.Close()

	var billList = []Bill{}

	for billsIterator.HasNext() {
		kv, _ := billsIterator.Next()
		// 取得持票人名下的票号
		_, compositeKeyParts, err := stub.SplitCompositeKey(kv.Key)
		if err != nil {
			res := getRetString(1, "queryMyBill SplitCompositeKey error")
			return shim.Error(res)
		}
		// 根据票号取得票据
		bill, bl := a.getBill(stub, compositeKeyParts[1])
		if !bl {
			res := getRetString(1, "queryMyBill get bill error")
			return shim.Error(res)
		}
		billList = append(billList, bill)
	}
	// 取得并返回票据数组
	b, err := json.Marshal(billList)
	if err != nil {
		res := getRetString(1, "Marshal queryMyBill billList error")
		return shim.Error(res)
	}
	return shim.Success(b)
}

// 查询我的待背书票据: 根据背书人编号 批量查询票据
//  0 - Endorser CmId ;
func (a *BillChaincode) queryMyWaitBill(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		res := getRetString(1, "queryMyWaitBill args!=1")
		return shim.Error(res)
	}
	// 以背书人ID从search表中批量查询所持有的票号
	billsIterator, err := stub.GetStateByPartialCompositeKey(IndexName, []string{args[0]})
	if err != nil {
		res := getRetString(1, "queryMyWaitBill GetStateByPartialCompositeKey error")
		return shim.Error(res)
	}
	defer billsIterator.Close()

	var billList = []Bill{}

	for billsIterator.HasNext() {
		kv, _ := billsIterator.Next()
		// 从search表中批量查询与背书人有关的票号
		_, compositeKeyParts, err := stub.SplitCompositeKey(kv.Key)
		if err != nil {
			res := getRetString(1, "queryMyWaitBill SplitCompositeKey error")
			return shim.Error(res)
		}
		// 根据票号取得票据
		bill, bl := a.getBill(stub, compositeKeyParts[1])
		if !bl {
			res := getRetString(1, "queryMyWaitBill get bill error")
			return shim.Error(res)
		}
		// 取得状态为待背书的票据 并且待背书人是当前背书人
		if bill.State == BillInfoStateEndrWaitSign && bill.WaitEndorserID == args[0] {
			billList = append(billList, bill)
		}
	}
	// 取得并返回票据数组
	b, err := json.Marshal(billList)
	if err != nil {
		res := getRetString(1, "Marshal queryMyWaitBill billList error")
		return shim.Error(res)
	}
	return shim.Success(b)
}

// 根据票号取得票据 以及该票据背书历史
//  0 - Bill_No ;
func (a *BillChaincode) queryByBillID(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		res := getRetString(1, "queryByBillNo args!=1")
		return shim.Error(res)
	}
	// 取得该票据
	bill, bl := a.getBill(stub, args[0])
	if !bl {
		res := getRetString(1, "queryByBillNo get bill error")
		return shim.Error(res)
	}

	// 取得背书历史: 通过fabric api取得该票据的变更历史
	resultsIterator, err := stub.GetHistoryForKey(Bill_Prefix + args[0])
	if err != nil {
		res := getRetString(1, "queryByBillNo GetHistoryForKey error")
		return shim.Error(res)
	}
	defer resultsIterator.Close()

	var history []HistoryItem
	var hisBill Bill
	for resultsIterator.HasNext() {
		historyData, err := resultsIterator.Next()
		if err != nil {
			res := getRetString(1, "queryByBillNo resultsIterator.Next() error")
			return shim.Error(res)
		}

		var hisItem HistoryItem
		hisItem.TxId = historyData.TxId             //copy transaction id over
		if historyData.Value == nil { //bill has been deleted
			var emptyBill Bill
			hisItem.Bill = emptyBill //copy nil marble
		} else {
			json.Unmarshal(historyData.Value, &hisBill) //un stringify it aka JSON.parse()
			hisItem.Bill = hisBill                      //copy bill over
		}
		history = append(history, hisItem) //add this tx to the list
	}
	// 将背书历史做为票据的一个属性 一同返回
	bill.History = history

	b, err := json.Marshal(bill)
	if err != nil {
		res := getRetString(1, "Marshal queryByBillNo billList error")
		return shim.Error(res)
	}
	return shim.Success(b)
}

func (a *BillChaincode) check(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var key string
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting key of the var to query")
	}

	// input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	key = args[0]
	valAsbytes, err := stub.GetState(key)           //get the var from ledger
	if err != nil {
		return shim.Error(fmt.Sprintf("Error: Failed to get state for %s", key))
	}

	return shim.Success(valAsbytes)
}

// chaincode Invoke 接口
func (a *BillChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()
	chaincodeLogger.Infof("function=%s, args=%s", function, args)

	// invoke
	if function == "issue" {
		return a.issue(stub, args)
	} else if function == "endorse" {
		return a.endorse(stub, args)
	} else if function == "accept" {
		return a.accept(stub, args)
	} else if function == "reject" {
		return a.reject(stub, args)
	} else if function == "check" {
		return a.check(stub, args)
	}
	// query
	if function == "queryMyBill" {
		return a.queryMyBill(stub, args)
	} else if function == "queryByBillID" {
		return a.queryByBillID(stub, args)
	} else if function == "queryMyWaitBill" {
		return a.queryMyWaitBill(stub, args)
	}

	res := getRetString(1, "Unkown method!")
	chaincodeLogger.Infof("%s", res)
	return shim.Error(res)
}

func main() {
	if err := shim.Start(new(BillChaincode)); err != nil {
		chaincodeLogger.Errorf("Error starting BillChaincode: %s", err)
	}
}

// ========================================================
// Input Sanitation - dumb input checking, look for empty strings
// ========================================================
func sanitize_arguments(strs []string) error{
	//for i, val:= range strs {
	//	if len(val) <= 0 {
	//		return errors.New("Argument " + strconv.Itoa(i) + " must be a non-empty string")
	//	}
	//	if len(val) > 32 {
	//		return errors.New("Argument " + strconv.Itoa(i) + " must be <= 32 characters")
	//	}
	//}
	return nil
}
