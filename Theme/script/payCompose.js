//支付页面计算
class payCompose {
    constructor(config) {
        this.config = config        //配置       
        //this.mode  = 2              //商品消费 1.快速消费 2.商品消费 9.桌台消费 11.会员充值 12.会员充次
        this.result = {}            //数据格式  
        this.finishCallback = function () { console.log("finishCallback->未绑定回调方法") }
        this.init()
        console.log('初始化 payCompose')
    }


    //数据结构
    init() {
        this.remark = ''
        this.postData = {}          //返回的提交数据
        this.payItem = []           //已选中的支付列表
        this.curPayItem = ''        //当前选中支付方式     

        this.chooseMember = {}              //会员数据        
        this.result = {
            billCode :'',                   //挂单结账
            staffMode: 1,                   //员工提成类型
            mode: 2,                        //商品消费 1.快速消费 2.商品消费 9.桌台消费 11.会员充值 12.会员充次
            allPayMoney: 0.00,              //支付方式总金额
            modificationInfo: {},           //手动改价详细记录 { 百分比 / 金额 /修改前金额 / 修改后金额 } 
            amountDiscountMoney: 0.00, 	    //会员折扣总金额 (会出现比原价高时的情况)
            goodsNum: 0, 		            //商品数量
            amountPoint: 0.00, 			    //获得积分
            amountMoney: 0.00, 			    //商品总价
            amountActivityMoney: 0.00,	    //活动减金额
            isZeroAmount: 0,                //是否抹零
            zeroAmount: 0.00,               //抹零金额
            amountActivityPoint: 0.0000,	//活动获得积分
            amountCouponMoney: 0.00,		//优惠卷金额
            amountModifyMoney: 0.00,		//手动修改金额	
            giveMoney: 0.00,                 //赠送金额，仅充值时用到 (11.会员充值)                
            goods: [],                       //商品
            conpon: [],                      //优惠券
            staffs: [],                      //提成员工
            activity: [],                    //活动       
        }
        return true
    }

    //购物页面传递数据 -> callback呼出支付页面
    initShoppingData(chooseMember, result, callback) {
        console.log('result',result,chooseMember)
        let that = this
        if (that.init()) {
            that.result = result
            that.chooseMember = chooseMember
            //充值处理
            if(that.result.mode ==11){
                that.selectPay('001')
                that.curPayItem = '001'
                // that.selectPay(that.config.MemberDefaultPayment)
                // that.curPayItem = that.config.MemberDefaultPayment
            }else{
                //默认支付方式
                if (that.chooseMember.Id == undefined) {
                    that.selectPay(that.config.SankeDefaultPayment)
                    that.curPayItem = that.config.SankeDefaultPayment
                }
                else {
                    that.selectPay(that.config.MemberDefaultPayment)
                    that.curPayItem = that.config.MemberDefaultPayment
                }
            }

            //客显type类型0-清屏1-单价2-总价3-收款4-找零
            if (typeof(ShowCustomerDisplay) == "function") {
                //会员折后价格（总）
                ShowCustomerDisplay(2,that.result.amountDiscountMoney.toFixed(2))
            }

            if (typeof callback === "function") {
                callback()
            }
        }
    }

    finish() {
        let that = this
        return new Promise(that.setpModify.bind(that))
            .then(function (res) {
                return new Promise(that.setpPay.bind(that));
            }).then(function (res) {
                return new Promise(
                    (resolve, reject) => {
                        console.log("finish")
                        that.finishCallback()
                        resolve()
                    })
            })
    }

    ///////////////////////////////////步骤//////////////////////////////////////////
    //setp->03 优惠卷计算
    setpConpon(resolve, reject) {
        //执行前设置所有 isLock  优惠券余额 和 使用情况
        let that = this
        //请求接口计算
        console.log('优惠卷算结果 ==>', that.result)
        resolve("setpConpon");
    }

    //setp->04 支付方式计算 (抹零处理)
    setpPay(resolve, reject) {
        let that = this
        //计算抹零 ->当前总结 不计算优惠券
        if (that.result.isZeroAmount == 1) {
            let amountDiscountMoney = math.chain(that.result.amountDiscountMoney).subtract(that.result.amountActivityMoney).subtract(that.result.amountModifyMoney).done()
            // that.result.amountMoney - that.result.amountActivityMoney  - that.result.amountModifyMoney            
            let surAmountMoney = that.zeroPrecision(amountDiscountMoney)
            that.result.zeroAmount = surAmountMoney
        }
        else {
            that.result.zeroAmount = 0.00
        }

        let addPrice = 0.00
        $.each(that.payItem, function (index, ele) {
            let m = math.chain(addPrice).add(ele.amount).done() //.toFixed(2)        
            addPrice = m
        })
        that.result.allPayMoney = addPrice

        console.log('that.payItem=>', that.payItem)
        console.log('支付方式 ==>', that.result)
        resolve("setpPay");
        //计算支付方式
    }

    //setp->05  计算活动优惠和整单优惠分摊 （已合并其他方法内部的计算，方法名暂时不修改）
    setpModify(resolve, reject) {
        let that = this
        //优惠总价 (活动+整单+ 抹零)
        let disMoney = math.chain(that.result.amountActivityMoney).add(that.result.amountModifyMoney).add(that.result.zeroAmount).done()
        //剩余的金额 ，可能免单处理则不处理( -活动-整单-摸零)
        let maxMoney = math.chain(that.result.amountDiscountMoney).subtract(that.result.amountActivityMoney).subtract(that.result.amountModifyMoney).subtract(that.result.zeroAmount).done()
        //可用或剩余分摊金额
 
        if (disMoney > 0 && that.result.goods.length >0) {
            let diffModifyMoney = 0.00 //(累加值)折扣当前循环总价金额
            if (maxMoney > 0) {
                $.each(that.result.goods, function (index, item) {
                    let rate = (item.amount / that.result.amountDiscountMoney).toFixed(2)  //比例      
                    //当前折扣价比率分摊价格  
                    let pMoney = (disMoney * rate).toFixed(2)               
                    //折扣大于0时计算
                    if(rate > 0 &&  pMoney>0){
                        //当前可用的分摊金额   
                        let  allowMoney = accSub(disMoney ,diffModifyMoney) // math.chain(disMoney).subtract(diffModifyMoney).done()                          
                        if(allowMoney >= pMoney){
                            //正常处理
                            item.modifyMoney = pMoney
                            diffModifyMoney =  accAdd(diffModifyMoney,pMoney)
                        }
                        else{
                            //当分摊价格不够用时，全部给当前商品
                            item.modifyMoney = allowMoney
                            diffModifyMoney =  accAdd(diffModifyMoney,allowMoney)
                        }                       
                    }
                })
                 console.log("剩余",diffModifyMoney,disMoney)
                // 累加值未到达优惠价格，剩余金额计入（分摊）最高的商品
                if(diffModifyMoney < disMoney)
                {
                    let m = accSub(disMoney,diffModifyMoney) //剩余为分摊
                    console.log('allowMoney',allowMoney)
                    let goods = Enumerable.From(that.result.goods).OrderByDescending(x => x.amount).FirstOrDefault(); 
                    goods.modifyMoney = accAdd(goods.modifyMoney , m)  
                }
            }
            else if (maxMoney == 0) {
                //免单
                $.each(that.result.goods, function (index, item) {
                    item.modifyMoney = item.amount
                })
            }
            else {                
                console.log('整单优惠输入价格无效')
            }
        }

        console.log('整单优惠 ==>', that.result)
        resolve("setpConpon");
    }

    //设置整单优惠
    settingModify(amountModifyMoney, modificationInfo) {
        let that = this
        let maxMoney = math.chain(that.result.amountDiscountMoney).subtract(that.result.amountActivityMoney).done()

        amountModifyMoney = that.floor(amountModifyMoney)

        if (amountModifyMoney <= 0) { return false }
        if (amountModifyMoney > maxMoney) { return false }

        that.result.amountModifyMoney = amountModifyMoney
        that.result.modificationInfo = modificationInfo

        //清除所有支付项的金额
        that.clearPayItemAmunt()
        that.finish()
        return true
    }

    //取消整单优惠
    cancelModify() {
        let that = this
        that.result.modificationInfo = {}
        that.result.amountModifyMoney = 0.00
        //清除所有支付项的金额
        that.clearPayItemAmunt()
        that.finish()
        return true
    }
  
    /////////////////////////////////////////////////////////////////////////////////////
    //抹零开关
    settingZeroAmount() {
        let that = this
        that.result.isZeroAmount = (that.result.isZeroAmount == 1) ? 0 : 1

        //清除所有支付项的金额
        that.clearPayItemAmunt()
        that.finish()
        return true
    }

    //设置整单提成员工
    settingOrderStaffs(staffs){
        this.result.staffs = staffs
    }

    ///////////////////////////////////////////// 支付金额///////////////////////////////////////////////////////////////
    //允许输入的最大值 payItem
    allowPayItemMaxPrice(code) {
        let that = this
        let amount = math.chain(that.result.amountDiscountMoney).subtract(that.result.amountActivityMoney).subtract(that.result.amountModifyMoney).subtract(that.result.zeroAmount).done().toFixed(2)

        let tempPrice = 0.00
        $.each(that.payItem, function (index, ele) {
            if (ele.code != code) {
                let t = math.chain(tempPrice).add(ele.amount).done()
                tempPrice = t
            }
        })

        let r = math.chain(amount).subtract(tempPrice).done()
        return r
    }

    //修改当选中项金额
    changePayMoney(code, m) {

        let that = this
        if (that.curPayItem != code) //当前选中code 和提交code 不一致
        {
            return false
        }


        let item = Enumerable.From(that.payItem).Where(x => x.code == code).FirstOrDefault();
        if (item == undefined) {
            return false
        }
        else {
            that.curPayItem = code   //选中支付方式     
            //排除自己还能输入的金额  
            // let amount = math.chain(that.result.amountDiscountMoney).subtract(that.result.amountActivityMoney).subtract(that.result.amountModifyMoney).subtract(that.result.zeroAmount).done().toFixed(2)
            // let allowPrice = that.allowPayItemMaxPrice(code)
            m = parseFloat(m)

            //现金特殊处理
            if (code != '001') {
                let item_001 = Enumerable.From(that.payItem).Where(x => x.code == '001').FirstOrDefault();
                //重置现金收银
                if (item_001 != undefined) {
                    item_001.amount = 0
                    item_001.smallChangePrice = 0
                    //smallchange = 0 //找零金额
                }

                let allowPrice = that.allowPayItemMaxPrice(code)
                if (allowPrice > m) {
                    ///积分和余额最大值处理///
                    if (code == '002') {
                        m = (m > that.chooseMember.Money) ? that.chooseMember.Money : m
                    }

                    if (code == '003') {
                        let smallChangePrice = math.chain(that.chooseMember.Point).multiply(that.config.PointOffsetCashPrecent).done()
                        m = (m > smallChangePrice) ? smallChangePrice : m
                    }
                    ///积分和余额最大值处理///

                    item.amount = m
                    //剩余的金额回填 001
                    if (item_001 != undefined) {
                        item_001.amount = accSub(allowPrice, m) // math.chain(allowPrice).subtract(m).done().toFixed(2)                         
                    }
                }
                else {
                    //当填写金额大于给最大允许金额
                    item.amount = allowPrice
                }
            }
            else {
                //当前选择是现金
                let allowPrice = that.allowPayItemMaxPrice(code)
                if (allowPrice > m) {
                    item.amount = m
                    item.smallChangePrice = 0
                }
                else {
                    let t = accSub(m, allowPrice)   // math.chain(m).subtract(allowPrice).done().toFixed(2)             
                    if (t > 100) {
                        item.amount = allowPrice
                        item.smallChangePrice = 0
                    }
                    else {
                        item.amount = m.toFixed(2)
                        item.smallChangePrice = t
                        //smallchange找零金额
                    }
                }
            }        
            console.log('that.payItem->changePayMoney', m,that.payItem)
            that.finish()
            return true
        }
    }

    selectPayInput(code) {
        let that = this
        let item = Enumerable.From(that.payItem).Where(x => x.code == code).FirstOrDefault();
        if (item == undefined) {
            return false
        }
        else {
            that.curPayItem = code
            if (code == '999') { that.finish(); return false; }

            //应收金额
            let amount = math.chain(that.result.amountDiscountMoney).subtract(that.result.amountActivityMoney).subtract(that.result.amountModifyMoney).subtract(that.result.zeroAmount).done().toFixed(2)
            let addPrice = 0.00
            $.each(that.payItem, function (index, ele) {
                if (ele.code != code) {
                    let m = math.chain(addPrice).add(ele.amount).done()
                    addPrice = m
                }
            })

            let diffPrice = accSub(amount, addPrice)  //math.chain(amount).subtract(addPrice).done()

            if (diffPrice > 0) {
                item.amount = diffPrice
            }
            else {
                item.amount = 0
            }

            //积分和余额最大值处理
            if (code == '002') {
                if (diffPrice > that.chooseMember.Money) {
                    item.amount = diffPrice
                }
            }
            else if (code == '003') {
                let smallChangePrice = math.chain(that.chooseMember.Point).multiply(that.config.PointOffsetCashPrecent).done()
                if (diffPrice > smallChangePrice) {
                    item.amount = diffPrice
                }
            }

            that.finish()
            return true
        }
    }

    //选择支付方式
    selectPay(code) {      
        let that = this      
        let item = Enumerable.From(that.payItem).Where(x => x.code == code).FirstOrDefault();
        
        if (item == undefined) {
            let payConfigItem = Enumerable.From(that.config.PaymentConfig).Where(x => x.code == code).FirstOrDefault();
            if (payConfigItem == undefined) {
                return false
            }

            console.log('payConfigItem', payConfigItem)
            ////////////// 微信支付宝 二选一////////////
            if (code == '010') {
                let wxItem = Enumerable.From(that.payItem).Where(x => x.code == '020').FirstOrDefault();
                if (wxItem != undefined) {
                    let wxItemIndex = that.payItem.indexOf(wxItem)
                    that.payItem.splice(wxItemIndex, 1)
                }
            }
            else if (code == '020') {
                let aliItem = Enumerable.From(that.payItem).Where(x => x.code == '010').FirstOrDefault();

                if (aliItem != undefined) {
                    let aliItemIndex = that.payItem.indexOf(aliItem)
                    that.payItem.splice(aliItemIndex, 1)
                }
            }
            ////////////// 微信支付宝 二选一////////////
            that.curPayItem = payConfigItem.code


            if (code == '999') {
                that.payItem.unshift({ code: payConfigItem.code, name: payConfigItem.name, amount: 0.00 })
            }
            else if (code == '002') {
                that.payItem.push({
                    code: payConfigItem.code,
                    name: payConfigItem.name,
                    amount: 0.00,
                    smallChangePrice: that.chooseMember.Money
                })
            }
            else if (code == '003') {
                let smallChangePrice = math.chain(that.chooseMember.Point).multiply(that.config.PointOffsetCashPrecent).done()
                that.payItem.push({
                    code: payConfigItem.code,
                    name: payConfigItem.name,
                    amount: 0.00,
                    smallChangePrice: that.floor(smallChangePrice)
                })
            }
            else {
                that.payItem.push({ code: payConfigItem.code, name: payConfigItem.name, amount: 0.00  ,smallChangePrice:0})
            }
        }
        else {
            let index = that.payItem.indexOf(item)
            that.payItem.splice(index, 1)
            //删除优惠券集合
            if (code == '999') {
                that.result.conpon = []
                that.pageChooseConpon = []
            }

            if (that.payItem.length > 0) {
                let lastItem = Enumerable.From(that.payItem).LastOrDefault();
                that.curPayItem = lastItem.code
            }
            else {
                that.curPayItem = ''
            }
        }
        console.log('that.payItem--->finsh',that.payItem)
        that.finish();

        return true
    }

    //同时选择的支付数量
    payMaxCount(code, num) {
        let that = this
        if (that.payItem.length >= num) {
            let item = Enumerable.From(that.payItem).Where(x => x.code == code).FirstOrDefault();
            if (item == undefined) {
                return true
            }
            return false
        }
    }

    //清除所有支付项的金额
    clearPayItemAmunt() {
        let that = this

        //删除支付方式的所有金额
        this.result.allPayMoney = 0.00
        $.each(that.payItem, function (index, item) {
            item.amount = 0.00
            if (item.code == '001') {
                item.smallChangePrice = 0
            }
        })

        //删除优惠券
        that.result.conpon = []
        that.pageChooseConpon = []
    }

    //判断支付价格是否可以提交
    validPayMoney() {
        let that = this
        //待付金额
        let amount = math.chain(that.result.amountDiscountMoney).subtract(that.result.amountActivityMoney).subtract(that.result.amountModifyMoney).subtract(that.result.zeroAmount).done().toFixed(2)

        //实付金额
        let tempPrice = 0.00
        $.each(that.payItem, function (index, ele) {
            let t = math.chain(tempPrice).add(ele.amount).done()
            tempPrice = t
        })

        console.log('validPayMoney', amount, tempPrice)

        let sub = math.chain(tempPrice).subtract(amount).done()
        //要大于等于0 才能支付
        return sub
    }
    //待付金额
    paidMoney() {
        let that = this
        let amount = math.chain(that.result.amountDiscountMoney).subtract(that.result.amountActivityMoney).subtract(that.result.amountModifyMoney).subtract(that.result.zeroAmount).done().toFixed(2)
        return amount
    }
    ///////////////////////////////////////////// 支付金额///////////////////////////////////////////////////////////////

    ///////////////////////////////////优惠券///////////////////////////////////////////
    //提交优惠券
    postCouponData() {
        // {"Order":{"ActivityAmount":优惠活动优惠金额,"CouponAmount":优惠券优惠金额,"ZeroAmount":抹零金额,"SingleAmount":整单优惠金额,"Source":消费来源：0-PC、1-前台收银、2-收银机、3-APP 4 公众号 5 小程序,"BillCode":"订单号","OrderType":订单类型 2、商品消费 5、快速扣次,"MemID":"会员ID","TotalMoney":订单总金额,"DiscountMoney":折后总金额,"TotalPoint":获得积分,"Remark":"消费备注"}, 
        // "Conpons":[{"ConponSendId":"优惠券发送记录ID","ConponCode":"优惠券券号","CouponAmount":优惠金额}],
        // "Details":[{"DiscountAmount":优惠活动、整单优惠、抹零优惠之和,"CouponAmount":优惠券优惠,"Staffs":提成员工,"BatchCode":计次批次好,"GoodsID":商品ID,"GoodsType":商品类型,"GoodsCode":商品编号,"GoodsName":商品名称,"DiscountPrice":折扣价,"Number":数量,"TotalMoney":总金额}] }
        let that = this
        let billCode = ''
        let orderType = 2 //2、商品消费 5、快速扣次,

        let coupon = that.pageChooseConpon
        let mid = that.chooseMember.Id == undefined ? '' : that.chooseMember.Id
        if (mid == '') {
            return {}
        }

        let postData = {}
        postData.Order = {
            ActivityAmount: that.result.amountActivityMoney,       //优惠活动优惠金额,
            CouponAmount: that.result.amountCouponMoney,          //优惠券优惠金额,
            ZeroAmount: that.result.zeroAmount,                //抹零金额,
            SingleAmount: that.result.amountModifyMoney,         //整单优惠金额,
            Source: 1,
            BillCode: that.result.billCode,
            OrderType: orderType,
            MemID: mid,
            TotalMoney: that.result.amountMoney,               //订单总金额,
            DiscountMoney: that.result.amountDiscountMoney,       //折后总金额,
            TotalPoint: math.chain(that.result.amountPoint).add(that.result.amountActivityPoint).done(),                  //获得积分,
            Remark: that.remark
        },

            //coupon网页上的源数据
            postData.Conpons = []
        $.each(coupon, function (index, item) {
            postData.Conpons.push({
                ConponSendId: item.Id,                //优惠券发送记录ID",
                ConponCode: item.ConponCode,        //"优惠券券号",
                CouponAmount: item.Quota              //优惠金额
            })
        })

        postData.Details = []
        $.each(that.result.goods, function (index, item) {
            postData.Details.push({
                IsModify: item.isCustomPrice,
                GID: item.uuid,
                DiscountAmount: item.modifyMoney,
                CouponAmount: item.conponMoney,
                Staffs: item.staffs,
                BatchCode: (item.source.BatchCode == undefined) ? '' : item.source.BatchCode,
                GoodsID: item.goodsId,
                GoodsType: item.goodsMode,
                GoodsCode: item.source.GoodsCode,
                GoodsName: item.source.GoodsName,
                DiscountPrice: item.memberPrice,
                Number: item.num,
                TotalMoney: item.amount
            })
        })
        console.log('优惠劵数据', JSON.stringify(postData))
        return postData
    }

    //设置result优惠券
    settingCoupon(resultData) {
        let that = this
        $.each(resultData.Details, function (index, item) {
            let goodsItem = Enumerable.From(that.result.goods).Where(x => x.uuid == resultData.Details.GID).FirstOrDefault();
            if (goodsItem == undefined) {
                that.pageChooseConpon = []
                console.log('返回数据不一致', item)
                return false
            }
            else {
                goodsItem.conponMoney = item.CouponAmount
            }
        })

        that.result.conpon = []
        $.each(resultData.Conpons, function (index, item) {
            that.result.conpon.push({
                ConponSendId: item.ConponSendId,    //优惠券发送记录ID",
                ConponCode: item.ConponCode,        //"优惠券券号",
                CouponAmount: item.CouponAmount     //优惠金额
            })
        })

        that.result.amountCouponMoney = resultData.CouponAmount //优惠券优惠金额

        return true
    }

    ///////////////////////////////////支付数据->payPostData()//////////////////////////
    //组合提交数据
    payPostData(pwd) {
        let that = this
        return new Promise(function (resolve, reject) {
            let postData = {}
            //商品消费 1.快速消费 2.商品消费 9.桌台消费 11.会员充值 12.会员充次
            switch (that.result.mode) {
                case 1:
                    postData = that.postChargeData(pwd)
                    break;
                case 2:
                    postData = that.postPayData(pwd)
                    break;
                case 9:
                    postData = that.postVenueData(pwd)
                    break;
                case 11:
                    postData = that.postTopUpData(pwd)
                    break;
                case 12:                    
                    postData = that.postRechargeCountData(pwd)
                    break;
                default:
                    return {}
            }           
            resolve(postData)
        })
    }

    //场馆数据组合
    //pwd,mainId, mode,staffMode
    postVenueData(pwd) {        
        let that = this    
        let orderType = 9 //桌台消费
        //01.检测支付方式金额
        if (that.validPayMoney() < 0) {
            return false
        }

        let mid = that.chooseMember.Id == undefined ? '' : that.chooseMember.Id

        let postData = {}
        postData.Order = {
            ActivityAmount: that.result.amountActivityMoney, //优惠活动优惠金额,
            CouponAmount: that.result.amountCouponMoney, //优惠券优惠金额,
            ZeroAmount: that.result.zeroAmount, //抹零金额,
            SingleAmount: that.result.amountModifyMoney, //整单优惠金额,
            Source: 1, //消费来源：0-PC、1-前台收银、2-收银机、3-APP 4 公众号 5 小程序
            BillCode: '',
            OrderType: that.result.mode,
            MemID: mid,
            TotalMoney: that.result.amountMoney, //订单总金额,
            DiscountMoney: that.result.amountDiscountMoney, //折后总金额,
            TotalPoint:  math.chain( that.result.amountPoint).add(that.result.amountActivityPoint).done() , //获得积分,
            Remark: that.remark
        }
        // {"PaymentCode":"支付方式编码","PayAmount":支付金额,"PayContent":"积分支付扣除数量或者在线支付流水号"}      
        postData.Payments = []   
        $.each(that.payItem, function (index, item) {
            if(parseFloat(item.amount)>0){
                if (item.code == '001') {                
                    let  m = (item.smallChangePrice == undefined) ? item.amount : accSub(item.amount,item.smallChangePrice)          
                    postData.Payments.push({
                        PaymentCode: item.code,
                        PayAmount: m,
                        PayContent: (item.smallChangePrice == undefined) ?'':item.smallChangePrice
                    })
                }
                else {
                    postData.Payments.push({
                        PaymentCode: item.code,
                        PayAmount: item.amount,
                        PayContent: (item.PayContent == undefined) ?'':item.PayContent
                    })
                }
            }          
        })

        
        //{"StaffId":"员工ID","CommissionMoney":自定义提成金额,"Remark":"提成备注"}
        postData.Staffs = that.result.staffs
        
        //{"ActId":"优惠活动ID","ActName":"活动名称","ActivityAmount":优惠金额}
        postData.Activities = []        
        $.each(that.result.activity,function(index,item){
            postData.Activities.push({
                ActId: item.Id,
                ActivityAmount: item.ReduceAmount,
                ActName: item.ActName
            })
        })        

        postData.Conpons = that.result.conpon

        postData.Details = []
        //{"DiscountAmount":优惠活动、整单优惠、抹零优惠之和,"CouponAmount":优惠券优惠,"Staffs":提成员工,"BatchCode":计次批次好,
        //"GoodsID":商品ID,"GoodsType":商品类型,"GoodsCode":商品编号,"GoodsName":商品名称,"DiscountPrice":折扣价,
        //"Number":数量,"TotalMoney":总金额}
        $.each(that.result.goods, function (index, item) {
            postData.Details.push({
                IsModify :item.isCustomPrice,
                // GID :item.uuid,
                DiscountAmount: item.modifyMoney,
                CouponAmount: item.conponMoney,
                Staffs: item.staffs,
                BatchCode: (item.BatchCode == undefined) ? '' : item.BatchCode,
                GoodsID: item.goodsId,
                GoodsType: item.goodsMode,
                GoodsCode: item.goodsCode,
                GoodsName: item.goodsName,
                DiscountPrice: item.memberPrice,
                Number: item.num,
                TotalMoney: item.amount,
                IndustryObjectID: item.industryObjectID,
                StartTime:item.startTime,
                EndTime:item.endTime
            })
        })

        postData.MemberPwd = pwd
        postData.MainID = that.result.mainId

        console.log('场馆数据', JSON.stringify(postData))
        return postData
    }
    //商品数据
    postPayData(pwd) {
        let that = this      
        //let orderType = 2 //2、商品消费 5、快速扣次,
        let billCode = (that.result.billCode == undefined) ?'':that.result.billCode 
        //01.检测支付方式金额
        if (that.validPayMoney() < 0) {
            return false
        }

        let mid = that.chooseMember.Id == undefined ? '' : that.chooseMember.Id

        let postData = {}
        postData.Order = {
            ActivityAmount: that.result.amountActivityMoney,       //优惠活动优惠金额,
            CouponAmount: that.result.amountCouponMoney,          //优惠券优惠金额,
            ZeroAmount: that.result.zeroAmount,                //抹零金额,
            SingleAmount: that.result.amountModifyMoney,         //整单优惠金额,
            Source: 1,                                             //消费来源：0-PC、1-前台收银、2-收银机、3-APP 4 公众号 5 小程序
            BillCode: billCode,
            OrderType: that.result.mode,
            MemID: mid,
            TotalMoney: that.result.amountMoney,               //订单总金额,
            DiscountMoney: that.result.amountDiscountMoney,       //折后总金额,
            TotalPoint:  math.chain( that.result.amountPoint).add(that.result.amountActivityPoint).done() ,              //获得积分,
            Remark: that.remark
        }

        postData.Payments = []   // {"PaymentCode":"支付方式编码","PayAmount":支付金额,"PayContent":"积分支付扣除数量或者在线支付流水号"}      
        $.each(that.payItem, function (index, item) {
            if(parseFloat(item.amount)>0){
                if (item.code == '001') {                
                    let  m = (item.smallChangePrice == undefined) ? item.amount : accSub(item.amount,item.smallChangePrice)          
                    postData.Payments.push({
                        PaymentCode: item.code,
                        PayAmount: m,
                        PayContent: (item.smallChangePrice == undefined) ?'':item.smallChangePrice
                    })
                }
                else {
                    postData.Payments.push({
                        PaymentCode: item.code,
                        PayAmount: item.amount,
                        PayContent: (item.PayContent == undefined) ?'':item.PayContent
                    })
                }
            }          
        })

        postData.Staffs = that.result.staffs// []//{"StaffId":"员工ID","CommissionMoney":自定义提成金额,"Remark":"提成备注"}

        postData.Activities = []     //{"ActId":"优惠活动ID","ActName":"活动名称","ActivityAmount":优惠金额}             
        $.each(that.result.activity,function(index,item){
            postData.Activities.push({
                ActId: item.Id,
                ActivityAmount: item.ReduceAmount,
                ActName: item.ActName
            })
        })        
       
        postData.Conpons = that.result.conpon

        postData.Details = []
        //{"DiscountAmount":优惠活动、整单优惠、抹零优惠之和,"CouponAmount":优惠券优惠,"Staffs":提成员工,"BatchCode":计次批次好,
        //"GoodsID":商品ID,"GoodsType":商品类型,"GoodsCode":商品编号,"GoodsName":商品名称,"DiscountPrice":折扣价,
        //"Number":数量,"TotalMoney":总金额}
        $.each(that.result.goods, function (index, item) {  
            postData.Details.push({
                GID : item.uuid,
                IsModify : item.isCustomPrice,
                DiscountAmount: item.modifyMoney,
                CouponAmount: item.conponMoney,
                Staffs: item.staffs,
                BatchCode: (item.source.BatchCode == undefined) ? '' : item.source.BatchCode,
                GoodsID: item.goodsId,
                GoodsType: item.goodsMode,
                GoodsCode: item.source.GoodsCode,
                GoodsName: item.source.GoodsName,
                DiscountPrice: item.memberPrice,
                Number: item.num,
                TotalMoney: item.amount
            })
        })

        postData.MemberPwd = pwd
        postData.ReservationOrderID = (that.result.reservationOrderID == undefined) ? '' : that.result.reservationOrderID

        console.log('支付数据', JSON.stringify(postData)) 
        return postData
    }
    //快速消费请求数据
    postChargeData(pwd) {
        let that = this 
        let mid = that.chooseMember.Id == undefined ? '' : that.chooseMember.Id

        let postData ={}
        postData.Order = {
            ActivityAmount: that.result.amountActivityMoney,   
            CouponAmount: that.result.amountCouponMoney,    
            ZeroAmount: that.result.zeroAmount, 
            SingleAmount: that.result.amountModifyMoney,   
            Source: 1,
            BillCode: '',
            OrderType: 1, //订单类型 1 - 快速消费、 4 - 固定消费,
            MemID: mid,
            TotalMoney: that.result.amountMoney,
            DiscountMoney: that.result.amountDiscountMoney,
            TotalPoint: that.result.amountActivityPoint ,  
            Remark: that.remark == undefined ?'':that.result.remark
        }
   
        postData.Payments = []   // {"PaymentCode":"支付方式编码","PayAmount":支付金额,"PayContent":"积分支付扣除数量或者在线支付流水号"}      
        $.each(that.payItem, function (index, item) {
            if(parseFloat(item.amount)>0){
                if (item.code == '001') {                
                    let  m = (item.smallChangePrice == undefined) ? item.amount : accSub(item.amount,item.smallChangePrice)          
                    postData.Payments.push({
                        PaymentCode: item.code,
                        PayAmount: m,
                        PayContent: (item.smallChangePrice == undefined) ?'':item.smallChangePrice
                    })
                }
                else {
                    postData.Payments.push({
                        PaymentCode: item.code,
                        PayAmount: item.amount,
                        PayContent: (item.PayContent == undefined) ?'':item.PayContent
                    })
                }
            }          
        })
        postData.Staffs = that.result.staffs// []         //{"StaffId":"员工ID","CommissionMoney":自定义提成金额,"Remark":"提成备注"}
        
        postData.Activities = []     //{"ActId":"优惠活动ID","ActName":"活动名称","ActivityAmount":优惠金额}       
        $.each(that.result.activity,function(index,item){
            postData.Activities.push({
                ActId: item.Id,
                ActivityAmount: item.ReduceAmount,
                ActName: item.ActName
            })
        })

        postData.Conpons = that.result.conpon
        postData.MemberPwd = pwd
        postData.ReservationOrderID = ''

        console.log('快读消费数据', JSON.stringify(postData)) 
        return postData
    }
    //充次提交数据
    postRechargeCountData(pwd) {
        let that = this
        if(that.chooseMember.Id == undefined){
            return false
        }

        //let orderType =that.result.mode //订单类型 2、 商品消费 5、 快速扣次,
        let mid = that.chooseMember.Id == undefined ? '' : that.chooseMember.Id

        let postData = {}

        postData.Order = {
            MemID:          mid,
            TotalNum:       that.result.goodsNum, //数量
            TotalMoney:     that.result.amountMoney,       
            DiscountMoney:  that.result.amountDiscountMoney,
            TotalPoint:     math.chain( that.result.amountPoint).add(that.result.amountActivityPoint).done() ,  
            Remark:         that.remark,
            Source:         1,
            ShopID:         that.result.shopId,
            ActivityAmount: that.result.amountActivityMoney,  
            CouponAmount:   that.result.amountCouponMoney,
            ZeroAmount:     that.result.zeroAmount,
            SingleAmount:   that.result.amountModifyMoney, 
        }
        postData.Details = []
        $.each(that.result.goods,function(index,item){
            let goods = {
                IsCombo:  item.goodsMode ==5 ? 1 : 0,
                GoodsID: item.goodsId,
                TotalMoney: item.amount,
                DiscountAmount: item.modifyMoney,
                CouponAmount:item.conponMoney,
                Staffs:item.staffs,
                DiscountPrice :item.memberPrice,
                Number :item.num,
            }
            postData.Details.push(goods)          
        })

        postData.Payments = []
        $.each(that.payItem, function (index, item) {
            if(parseFloat(item.amount)>0){
                if (item.code == '001') {                
                    let  m = (item.smallChangePrice == undefined) ? item.amount : accSub(item.amount,item.smallChangePrice)          
                    postData.Payments.push({
                        PaymentCode: item.code,
                        PayAmount: m,
                        PayContent: (item.smallChangePrice == undefined) ?'':item.smallChangePrice
                    })
                }
                else {
                    postData.Payments.push({
                        PaymentCode: item.code,
                        PayAmount: item.amount,
                        PayContent: (item.PayContent == undefined) ?'':item.PayContent
                    })
                }
            }          
        })
   
        postData.Conpons = that.result.conpon
        postData.Staffs = that.result.staffs

        postData.Activities = []   
        $.each(that.result.activity,function(index,item){
            postData.Activities.push({
                ActId: item.Id,
                ActivityAmount: item.ReduceAmount,
                ActName: item.ActName
            })
        })
        
        postData.MemberPwd = pwd
        postData.ReservationOrderID = ''

        console.log('充次数据', JSON.stringify(postData)) 
        return postData
    }
    //会员充值提交数据
    postTopUpData(pwd) {
        let that =this 
        let postData = {}

        let mid = that.chooseMember.Id == undefined ? '' : that.chooseMember.Id

        postData.Order ={
            MemID: mid,
            TotalMoney: that.result.amountMoney,
            RealMoney: accAdd(that.result.giveMoney ,that.result.amountMoney),
            GiveMoney:  that.result.giveMoney,        
            Remark: that.remark==undefined ? '' :that.remark,
            Source: 1,
            IsModify :that.result.isModify,
        }

        postData.Payments =[]
        $.each(that.payItem, function (index, item) {
            if(parseFloat(item.amount)>0){
                if (item.code == '001') {                
                    let  m = (item.smallChangePrice == undefined) ? item.amount : accSub(item.amount,item.smallChangePrice)          
                    postData.Payments.push({
                        PaymentCode: item.code,
                        PayAmount: m,
                        PayContent: (item.smallChangePrice == undefined) ?'':item.smallChangePrice
                    })
                }
                else {
                    postData.Payments.push({
                        PaymentCode: item.code,
                        PayAmount: item.amount,
                        PayContent: (item.PayContent == undefined) ?'':item.PayContent
                    })
                }
            }          
        })

        postData.Staffs = that.result.staffs

        postData.Activities = []   
        $.each(that.result.activity,function(index,item){
            postData.Activities.push({
                ActId: item.Id,
                ActivityAmount: item.ReduceAmount,
                ActName: item.ActName
            })
        })
        
        console.log('充值', JSON.stringify(postData)) 
        return postData
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    //舍弃2位后的小数
    floor(num) {
        return Math.floor(num * 100) / 100
    }

    //结算金额处理方式 (抹零计算规则) 
    zeroPrecision(num) {
        let that = this
        //IsAllowModifyOrderTotal     
        if (that.config.IsAllowModifyOrderTotal == 1 && that.config.ZeroErasingUnit > 0) {
            switch (that.config.ZeroErasingUnit) {
                case 0: //不抹
                    {
                        return 0
                    }
                case 1: //分
                    {
                        let a = parseInt(num * 10)
                        return (a / 10).toFixed(2)
                    }
                case 2: //角                                  
                    {
                        let b = parseInt(num)
                        return (num - b).toFixed(2)
                    }
                case 3://元
                    {
                        let c = parseInt(num / 10)
                        return (c * 10).toFixed(2)
                    }
                default:
                    return 0
            }
        }
        return 0
    }
}
