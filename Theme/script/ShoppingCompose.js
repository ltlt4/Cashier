$(function () {
    template.defaults.imports.fnActMode = function (mode) {
        if (mode == 4) {
            return 'birthday'
        }
        else {
            return 'other'
        }
    }
    template.defaults.imports.fnToFixed = function (num) {
        return parseFloat(num).toFixed(2)
    }
    template.defaults.imports.fnGoodsMode = function (mode) {
        switch (mode) {
            case 1:
                return '<i class="colorIcon blue">库</i> '              
            case 2:
                return '<i class="colorIcon green">服</i>'               
            case 4:
                return '<i class="colorIcon purple">次</i> '              
            case 5:
                return '<i class="colorIcon red">套</i>'               
            default:
                return ''              
        }
    }
    template.defaults.imports.fnPayItemAmount = function (code) {
        switch (code) {
            case '002':     //余额
                return ''   //'<small>可用余额¥50.00</small>'        
            case '003':     //积分
                return '<small>可抵扣 ¥ 50.00</small>'
            case '999':     //优惠券
                return '<em class="paySelectCoupon">重选优惠券</em>'
            case '001':     //现金
                return '<small>找零¥ 0.00 </small>'
            default:
                return ''
        }
    }
})

//购物车数据
class shoppingCompose
{
    constructor(config,mode) {
        this.billCode = ''              //订单号    
        this.shoppingCar = []           //购物车
        this.config = config            //配置
        this.result = {}                //数据结构      
        this.chooseMember = {}           //会员数据
        this.processCallback = function () { console.log("processCallback->未绑定回调方法") }
        this.init()
        this.mode = (mode==undefined) ? 2 :  mode                  //商品消费 1.快速消费 2.商品消费 9.桌台消费 11.会员充值 12.会员充次
    }

    init(){
        this.chooseBirthdayActivity = {}      //生日优惠
        this.chooseActivity = {}              //活动方案
        this.remark = ''      

        // this.result = {
        //     staffMode: 1,                   //员工提成类型
        //     mode: 2,                        
        //     allPayMoney: 0.00,              //支付方式总金额
        //     modificationInfo: {},           //手动改价详细记录 { 百分比 / 金额 /修改前金额 / 修改后金额 } 
        //     amountDiscountMoney: 0.00, 	    //会员折扣总金额 (会出现比原价高时的情况)
        //     goodsNum: 0, 		            //商品数量
        //     amountPoint: 0.00, 			    //获得积分
        //     amountMoney: 0.00, 			    //商品总价
        //     amountActivityMoney: 0.00,	    //活动减金额
        //     isZeroAmount: 0,                //是否抹零
        //     zeroAmount: 0.00,               //抹零金额
        //     amountActivityPoint: 0.0000,	//活动获得积分
        //     amountCouponMoney: 0.00,		//优惠卷金额
        //     amountModifyMoney: 0.00,		//手动修改金额	
        //     giveMoney: 0.00,                 //赠送金额，仅充值时用到 (11.会员充值)                
        //     goods: [],                      //商品
        //     conpon: [],                     //优惠券
        //     staffs: [],                      //提成员工
        //     activity: [],                    //活动       
        // }
        return true  
    }

    //删除购物车，会员保留
    clearShoppingCar() {
        let that = this
        if (that.init()) {
            that.shoppingCar = []
            that.process()
        }
    }

    clearAll(){
        let that = this
        if (that.init()) {
            that.shoppingCar = []
            that.chooseMember = {} //会员    
            that.process()
        }
    }

    //重置但不重置购物车
    reset() {
        let that = this
        if (that.init()) {
            that.chooseMember = {} //会员    
            that.process()
        }
    }

    //重新选择会员 清空参数带 {}
    changeMember(member,billCode) {
        let that =this
        if(billCode==undefined){ billCode ='' }
        //重选会员后、折扣券清空、生日清空、手动改价清空       
        //会员未变
        if(member.Id != undefined){          
            if(member.Id == that.chooseMember.Id){return false}
        }
       
        if(that.init()){         
            that.billCode = billCode
            that.chooseMember = member               
            if(that.shoppingCar.length >0){
                that.process()
            }
        }
        return true
    }

    /////////////////////////////////页面相关 /////////////////////////////////
    //设置备注
    setRemark(remark) {
        this.remark = remark
    }

    //清除选中活动
    clearActivity() {
        let that = this
        that.chooseBirthdayActivity = {}    //生日优惠
        that.chooseActivity = {}       //活动方案
        that.process()
    }

    //选中充值活动处理
    selectTopUpActivity(activity){
        let that = this
        activity = JSON.parse(activity)
        let birthdayActivityRule = this.config.BirthdayActivityRule
        if (activity.ValidType == 4) {
            if (that.chooseMember.IsBirthday == 0) {
                return false
            }
            else {
                if (birthdayActivityRule != 3) { that.chooseActivity = {} }   //全局
                that.chooseBirthdayActivity = activity
                
                return true
            }
        }
        else {
            if (birthdayActivityRule != 3) { that.chooseBirthdayActivity = {} } //全局
            that.chooseActivity = activity         
            return true
        }        
    }

    //优惠券是否可以使用（店铺和会员接口已经过滤）->判断可用时间、生日优惠策略、全局配置
    //1-生日优先、2-系统活动优先、3-系统活动上叠加
    //opt选择取消 true,false
    selectActivity(activity) {
        let that = this
        activity = JSON.parse(activity)
        if (activity.ValidType == 4 && that.chooseBirthdayActivity.Id == activity.Id) {
            that.chooseBirthdayActivity = {}
            that.process()
            return true
        }
        else if (that.chooseActivity.Id == activity.Id) {
            that.chooseActivity = {}
            that.process()
            return true
        }

        let birthdayActivityRule = this.config.BirthdayActivityRule
        let currentPrice = that.result.amountDiscountMoney

        if (activity.LimitUsedAmount > currentPrice) {
            console.log("未达到优惠额度")
            return false
        }

        if (activity.ValidType == 4) {
            if (that.chooseMember.IsBirthday == 0) {
                return false
            }
            else {
                if (birthdayActivityRule != 3) { that.chooseActivity = {} }   //全局
                that.chooseBirthdayActivity = activity
                that.process()
                return true
            }
        }
        else {
            if (birthdayActivityRule != 3) { that.chooseBirthdayActivity = {} } //全局
            that.chooseActivity = activity
            that.process()
            return true
        }
    }
    //////////////////////////////////////////////////////////////////////////
    ///////////////////////////////// 提成员工/////////////////////////////////
    //修改提成员工
    changeGoodsStaff(uuid, chooseStaff) {    
        let that = this          
        let item = Enumerable.From(this.shoppingCar).Where(x => x.uuid == uuid).FirstOrDefault();
        if(item!=undefined)
        {          
            item.staffs =chooseStaff
            that.process()
            return true
        }
        return false
    } 
    //选择提成员工
    settingStaffs(uuid, staffs)
    {
        let item = Enumerable.From(this.shoppingCar).Where(x => x.uuid == uuid).FirstOrDefault();
        item.staffs = staffs
        //刷新
        this.process()
    } 
    //获取已设置的提成员工
    goodsStaffs(uuid) {
        let that =this
        let item = Enumerable.From(this.result.goods).Where(x => x.uuid == uuid).FirstOrDefault();
        console.log('item',item)
        var goodsStaffsData = {
            uuid:item.uuid,//唯一标识           
            goodsId: item.goodsId ,// 产品ID  
            goodsName: item.source.GoodsName,//产品名称
            price:  parseFloat(item.price),//零售价格
            memberPrice:  parseFloat(item.memberPrice).toFixed(2) ,//产品特价
            images: item.source.Images,//产品图片
            num: item.num,//购买数量
            amount: parseFloat( item.amount).toFixed(2) ,//折后金额
            isMem: that.chooseMember.Id ==undefined ? 0 :1 ,
            isCustomPrice :  parseFloat(item.isCustomPrice).toFixed(2) ,// 是否修改价格
            staffs: item.staffs==null?[]: item.staffs,
            goodsMode : item.goodsMode
        };

        return goodsStaffsData
    }
    //////////////////////////////////////////////////////////////////////////
    /////////////////////////////////购物车///////////////////////////////////
    //添加购物车
    selectItem(goods) {
        let item = Enumerable.From(this.shoppingCar).Where(x => x.goodsId == goods.Id && x.goodsMode == goods.GoodsType && x.isCustomPrice == 0).FirstOrDefault();
       
        if (item === undefined) {
            let price = goods.Price //其他类型可能不是Price
            let uuid = this.dateFormat("yyyyMMddhhmmssS", new Date()) + Math.random().toString(36).substr(2);
            this.shoppingCar.push({
                uuid: uuid,
                isCustomPrice: 0,
                customPrice: 0.00,
                price: goods.Price,
                goodsId: goods.Id,
                //类型 1.普通商品 2.服务商品 3.计时商品 4.计次商品 5.套餐 
                //充次没有带 GoodsType 默认给服务产品，后期充次加套餐需要 goods下有GoodsType
                //goodsMode: goods.GoodsType,//mode,	    
                goodsMode: (goods.GoodsType== undefined) ? 2:goods.GoodsType ,//mode,	     
                num: 1,
                goodsPoint: 0.000,         //商品优惠积分（总）
                amount: 0.00,              //商品总价
                discount: 1,        		//会员折扣率
                discountMoney: 0.00, 		//会员折扣 （总）
                discountSchemes: '散客',
                activityMoney: 0.00,        //活动优惠金额（总）
                activityPoint: 0.00,       //活动获取积分（总）
                conponMoney: 0.00,          //优惠券优惠金额（总）
                conponDiscount: 0.00,       //优惠券折扣
                modifyMoney: 0.00,          //整单优惠修改分摊金额（总）+抹零+活动
                staffs: [],
                source: goods,
            })
        }
        else {  
            //商品库存
            if (item.goodsMode == 4) {
                let allNum = Enumerable.From(this.shoppingCar).Where(x => x.goodsId == item.goodsId && x.goodsMode == 4).Sum(x => x.num);
                if (parseInt(allNum) > item.source.StockNum) {
                    item.num = item.source.StockNum
                    return false;
                }
                else {
                    item.num++
                }
            }
            else if (item.goodsMode == 1) {
                let allNum = Enumerable.From(this.shoppingCar).Where(x => x.goodsId == item.goodsId && x.goodsMode == 1).Sum(x => x.num);
                if (parseInt(allNum + 1) > item.source.StockNum) {
                    item.num = item.source.StockNum
                    return false;
                }
                item.num++
            }
            else {
                item.num++
            }
            //商品库存
        }
        this.process()
        return true
    }

    //修改数量
    changeItemNum(uuid, num) {
        num = parseInt(num)
        let that = this
        //let item = Enumerable.From(this.shoppingCar).Where(x=>x.goodsId == goodsId && x.goodsMode==mode).FirstOrDefault();   
        let item = Enumerable.From(this.shoppingCar).Where(x => x.uuid == uuid).FirstOrDefault();
        if (item === undefined) {
            console.log('undefined')
            return false
        }
        else {
            if (num == 0) {
                let index = that.shoppingCar.indexOf(item);
                that.shoppingCar.splice(index, 1)
            }
            else {
                //计算库存               
                if (item.goodsMode == 4) {
                    if (parseInt(num) > item.source.StockNum) {
                        item.num = item.source.StockNum
                        return false;
                    }
                    else {
                        item.num = num
                    }
                }
                else if (item.goodsMode == 1) {
                    if (num > item.num) {
                        let allNum = Enumerable.From(this.shoppingCar).Where(x => x.goodsId == item.goodsId && x.goodsMode == 1).Sum(x => x.num);
                        if (parseInt(allNum - item.num + num) > item.source.StockNum) {
                            item.num = item.source.StockNum
                            return false;
                        }
                    }
                    item.num = num
                }
                else {
                    item.num = num
                }
                //计算库存             
            }
            that.process()
            return true
        }
    }

    //手动改价
    changePrice(uuid, customPrice) {
        let that = this
        customPrice = parseFloat( customPrice ).toFixed(2)
        let item = Enumerable.From(this.shoppingCar).Where(x => x.uuid == uuid).FirstOrDefault();
        if(item.goodsMode ==4){
            return false
        }

        if (item.price == customPrice) {
            return false
        }
        else {
            item.customPrice = customPrice
            item.isCustomPrice = 1
            that.process()
        }
     
        return true
    } 
    /////////////////////////////////////////////////////////////////////////
    ///////////////////购物车计算（充值，快速消费单独计算活动）/////////////////
    //setp->01 会员价格计算
    setpMember(resolve, reject) {
        let member = this.chooseMember

        let that = this

        let amountDiscountMoney = 0.00	//购物车会员总价
        let goodsNum = 0			    //商品数量
        let amountPoint = 0.00			//获得积分
        let amountMoney = 0.00          //购物车总价

        let classRules = this.chooseMember.ClassDiscountRulesList !== undefined ? this.chooseMember.ClassDiscountRulesList : null;

        $.each(this.shoppingCar, function (index, element) {

            let discount = 1        //记录最低,默认为会员等级折扣
            let goodsPoint = 0.00   //获取积分
            let amount = (element.price * element.num).toFixed(2) //商品总价(会员折后或修改)

            let price = element.price
            let memberPrice = element.price
            let memberSchemes = '散客'
            let goodsItem = {
                uuid: element.uuid,
                isCustomPrice: element.isCustomPrice,  //是否手动修改价格
                goodsId: element.goodsId,
                goodsMode: element.goodsMode,            //类型
                num: element.num,
                goodsPoint: 0.000,         //商品获得积分（总）
                amount: amount,           //商品总价(会员折后)
                memberDiscount: 1,        //会员折扣率
                price: price,
                memberPrice: memberPrice,
                memberSchemes: '散客',
                activityPoint: 0.00,       //活动获取积分（总）
                conponMoney: 0.00,          //优惠券优惠金额（总）
                modifyMoney: 0.00,          //整单优惠修改分摊金额（总） 活动优惠金额+整单优惠+抹零
                staffs: element.staffs,
                source: element.source,     //源数据
            }

            if (element.isCustomPrice == 1) {
                //手动改价
                memberPrice = parseFloat(element.customPrice).toFixed(2)
                memberSchemes = '手动修改'
                amount = (element.customPrice * element.num).toFixed(2)
            }
            else if (member.Id != undefined) {
                //会员价
                //if(element.goodsMode == 5 || element.goodsMode == 1 ) //套餐 +商品              
                if (element.source.Specials > 0) {
                    memberPrice = element.source.Specials //商品特价
                    memberSchemes = "商品特价"
                }
                else {
                    memberSchemes = "商品折扣"
                    let classDiscount = 1   //商品分类折扣     

                    //商品分类折扣计算
                    if (element.source.GoodsClass !== undefined && classRules != null) {
                        let classRulesItem = Enumerable.From(classRules).Where(x => x.GoodsClassId == element.source.GoodsClass).FirstOrDefault();
                        if (classRulesItem !== undefined) {
                            classDiscount = classRulesItem.Discount
                        }
                    }

                    //商品折扣//无产品最低折扣
                    if (element.source.IsDiscount == 0) {
                        if (classDiscount < 1) {
                            discount = classDiscount;
                            memberSchemes = "会员商品分类折扣(未启用商品折扣)"
                        }
                        else {
                            console.log(member.DiscountPercent, member)
                            discount = member.DiscountPercent;
                            memberSchemes = "会员默认折扣(未启用商品折扣)"
                        }
                    }
                    else {
                        if (classDiscount < 1) {
                            // 商品最低折扣  会员商品分类 比较
                            if (element.source.MinDiscount > classDiscount) {
                                memberSchemes = "会员商品分类折扣(启用商品折扣)"
                                discount = classDiscount
                            }
                            else {
                                memberSchemes = "商品最低折扣(启用商品折扣)"
                                discount = element.source.MinDiscount
                            }
                        }
                        else {
                            //商品最低折扣 会员默认折扣 比较
                            if (element.source.MinDiscount > member.DiscountPercent) {
                                memberSchemes = "会员默认折扣(启用商品折扣)"
                                discount = member.DiscountPercent
                            }
                            else {
                                memberSchemes = "商品最低折扣(启用商品折扣)"
                                discount = element.source.MinDiscount
                            }
                        }
                    }
                    memberPrice = (price * discount).toFixed(4)
                }
            }

            //当商品消费为计次时不计算积分
            if(element.source.GoodsType ==4 && that.mode ==2){
                goodsPoint = 0.00
            }
            else{
                //积分计算
                if (member.Id != undefined) {
                    if (element.source.IsPoint == 1) {
                        goodsPoint = (element.source.PointType * element.num)
                        amountPoint = math.chain(amountPoint).add(goodsPoint).done() // amountPoint + goodsPoint
                    }
                    else if (member.PointPercent > 0) {
                        goodsPoint = (memberPrice * element.num * member.PointPercent).toFixed(4)
                        //(((price - memberPrice) * element.num )* member.PointPercent ).toFixed(4)
                        amountPoint = math.chain(amountPoint).add(goodsPoint).done() // goodsPoint;// 按折后金额给积分
                    }
                }
            }         

            goodsItem.goodsPoint = goodsPoint
            goodsItem.memberPrice = memberPrice
            goodsItem.memberSchemes = memberSchemes
            goodsItem.memberDiscount = discount
            goodsItem.amount = (memberPrice * element.num).toFixed(2)

            console.log("item",goodsItem,element)

            that.result.goods.push(goodsItem)

            //总计
            goodsNum = math.chain(goodsNum).add(element.num).done()
            amountDiscountMoney = math.chain(amountDiscountMoney).add(goodsItem.amount).done()
            amountMoney = math.chain(amountMoney).add(element.num * price).done()
        })

        that.result.amountDiscountMoney = that.moneyPrecision(amountDiscountMoney) //amountDiscountMoney.toFixed(4)
        that.result.goodsNum = goodsNum
        that.result.amountPoint = that.pointPrecision(amountPoint)   //amountPoint.toFixed(4)
        that.result.amountMoney = that.moneyPrecision(amountMoney)      // amountMoney.toFixed(4)

        console.log('会员计算结果 ==>', that.result)
        resolve("setpMember");
    }

    //setp->02 活动优惠计算 
    setpActivity(resolve, reject) {

        let that = this
        that.result.conpon =[]

        let currentPrice = that.result.amountDiscountMoney //当前总价
        that.result.amountActivityMoney = 0.0000 //活动减金额
        that.result.amountActivityPoint = 0.0000 //活动获得积分
        if (that.chooseActivity.Id != undefined) {
            if (that.chooseActivity.LimitUsedAmount <= currentPrice) {

                that.result.activity.push(that.chooseActivity)

                if (that.chooseActivity.IsReduceAmount == 1) {                    
                    that.result.amountActivityMoney = accAdd(that.result.amountActivityMoney, that.chooseActivity.ReduceAmount)                    
                }
                if (that.chooseActivity.IsGivePoint == 1) {
                    that.result.amountActivityPoint = accAdd(that.result.amountActivityPoint, that.chooseActivity.GivePoint)                 
                }
            }
            else {
                that.chooseActivity = {}
                console.log("活动不满足金额->清空")
            }
        }

        if (that.chooseBirthdayActivity.Id != undefined) {
            if (that.chooseBirthdayActivity.LimitUsedAmount <= currentPrice) {
                that.result.activity.push(that.chooseBirthdayActivity)

                if (that.chooseBirthdayActivity.IsReduceAmount == 1) {
                     that.result.amountActivityMoney = accAdd(that.result.amountActivityMoney , that.chooseBirthdayActivity.ReduceAmount)                      
                }

                if (that.chooseBirthdayActivity.IsGivePoint == 1) {                    
                    that.result.amountActivityPoint = accAdd(that.result.amountActivityPoint,hat.chooseBirthdayActivity.GivePoint)                 
                }
            }
            else {
                that.chooseBirthdayActivity = {}
                console.log("活动不满足金额(生日)");
            }
        }
        console.log('活动计算结果 ==>', that.result)
        resolve("setpActivity");
    }

    //计算购物车及会员折扣+活动优惠
    process() {        
        let that = this    
        console.log('process->that.chooseMember', that.chooseMember)
        //01.result 重构      
        this.result = {
            staffMode: 1,                   //员工提成类型
            mode: that.mode,                //商品消费 1.快速消费 2.商品消费 9.桌台消费 11.会员充值 12.会员充次
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
            goods: [],                      //商品
            conpon: [],                     //优惠券
            staffs: [],                     //提成员工
            activity: [],                   //活动       
        }

        //02.重计算
        return new Promise(that.setpMember.bind(that)).then(function (res) {
            return new Promise(that.setpActivity.bind(that))
        }).then(function (res) {
            return new Promise(
                (resolve, reject)=>{
                    that.processCallback()
                      //副屏显示函数
                    if(typeof(window.parent.ShowShoppingCart)=="function"){ 
                        console.log('副屏显示函数->执行')
                        if(that.result.goods.length >0){
                            let cShoppingCart =[]
                           // [{"GoodsName":"商品名称","Qty":"消费数量","TotalMoney":"总金额"}]、
                            $.each(that.result.goods,function(index,item){
                                c.push({
                                    GoodsName: item.source.GoodsName,
                                    Qty:item.num,
                                    TotalMoney:item.memberPrice
                                })
                            })
                            window.parent.ShowShoppingCart(cShoppingCart)
                        }          
                    }    
                    resolve()
             })  
        })     
    }

    ///////////////////////////////挂单取单////////////////////////////////
    //初始化挂单数据
    settingRestingReslut(res){             
        console.log(res)
        let that =this      
        //if(res.MemberInfo == undefined ){ return false }

        if(res.Details.length >0){                     
            that.billCode = res.BillCode      
            // that.chooseMember = res.MemberInfo
            that.shoppingCar = []
        
            $.each(res.Details,function(index,item){           
                // let price = goods.Price //其他类型可能不是Price
                let uuid = that.dateFormat("yyyyMMddhhmmssS", new Date()) + Math.random().toString(36).substr(2);
                let goods ={
                    uuid: uuid,
                    isCustomPrice: item.IsModify,
                    customPrice: item.DiscountPrice,
                    price: item.UnitPrice,
                    goodsId: item.GoodsID,
                    goodsMode: item.GoodsType,//mode,	        //类型 1.普通商品 2.服务商品 3.计时商品 4.计次商品 5.套餐
                    num: item.Number,
                    goodsPoint: 0.000,         //商品优惠积分（总）
                    amount: 0.00,              //商品总价
                    discount: 1,        		//会员折扣率
                    discountMoney: 0.00, 		//会员折扣 （总）
                    discountSchemes: '',
                    activityMoney: 0.00,        //活动优惠金额（总）
                    activityPoint: 0.00,        //活动获取积分（总）
                    conponMoney: 0.00,          //优惠券优惠金额（总）
                    conponDiscount: 0.00,       //优惠券折扣
                    modifyMoney: 0.00,          //整单优惠修改分摊金额（总）+抹零+活动
                    staffs: [],
                    source: {},
                }
                goods.source = item
                goods.source.PointType = item.PointPercent              
                that.shoppingCar.push(goods)
            })        

            //that.process()  
            return true
        }
        return false
    }

    ///////////////////////////////////////////////////////////

    ///////////////////////////功能函数///////////////////////////////
     //日期格式化
    dateFormat(fmt, date) {
        var o = {
            "M+": date.getMonth() + 1,     //月份 
            "d+": date.getDate(),     //日 
            "h+": date.getHours(),     //小时 
            "m+": date.getMinutes(),     //分 
            "s+": date.getSeconds(),     //秒 
            "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
            "S": date.getMilliseconds()    //毫秒 
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }

    //舍弃2位后的小数
    floor(num) {
        return Math.floor(num * 100) / 100
    }

    //全局金额
    moneyPrecision(num) {
        let that = this
        switch (that.config.MoneyPrecision) {
            case 0:
                return num.toFixed(2)
            case 1:
                return parseInt(Math.floor(num * 10) / 10)
            case 2:
                return parseInt(num)
            case 3:
                return num.toFixed(1)
            default:
                return num.toFixed(2)
        }
    }

    //全局积分保留处理方式
    pointPrecision(num) {
        let that =this
        switch (that.config.PointPrecision) {
            case 0: //保留2位
                return num.toFixed(2)
            case 1://保留整数（四舍五入）
                return Math.round(num)
            case 2://保留整数
                return parseInt(num)
            case 3://保留1位
                return num.toFixed(1)
            case 4://保留3位
                return num.toFixed(3)
            default:
                return num.toFixed(3)
        }
    }

    /////////////////////////////////会员充值////////////////////////////////////
    settingTopUpMoney(money,shopActivity){ 
        let that = this         
        let amount =parseFloat( money).toFixed(2)   
        if(amount<=0) { return false } 
        //计算会员价格
        if(that.chooseMember.Id == undefined){
           return false
        }

        this.result = {
            isTopUp :1 , //快速消费标识
            staffMode: 3,                   //员工提成类型
            mode: 11,                        //商品消费 1.快速消费 2.商品消费 9.桌台消费 11.会员充值 12.会员充次
            allPayMoney: 0.00,              //支付方式总金额
            modificationInfo: {},           //手动改价详细记录 { 百分比 / 金额 /修改前金额 / 修改后金额 } 
            amountDiscountMoney: amount, 	    //会员折扣总金额 (会出现比原价高时的情况)
            goodsNum: 0, 		            //商品数量
            amountPoint: 0.00, 			    //获得积分
            amountMoney: amount, 			    //商品总价
            amountActivityMoney: 0.00,	    //活动减金额
            isZeroAmount: 0,                //是否抹零
            zeroAmount: 0.00,               //抹零金额
            amountActivityPoint: 0.0000,	//活动获得积分
            amountCouponMoney: 0.00,		//优惠卷金额
            amountModifyMoney: 0.00,		//手动修改金额	
            giveMoney: 0.00,                 //赠送金额，仅充值时用到 (11.会员充值)                
            goods: [],                      //商品
            conpon: [],                     //优惠券
            staffs: [],                     //提成员工
            activity: [],                   //活动       
        }


        //生日	//通过价格计算最佳活动->取获取金额最大
        let birthdayActivity = null
        let activity= null
        if (that.chooseMember.IsBirthday == 1){
            birthdayActivity = Enumerable.From(shopActivity).Where(x => ( x.LimitUsedAmount <= amount || x.LimitUsedAmount ==0) && x.ValidType ==4).OrderByDescending(x => x.GiveMoney).FirstOrDefault(); 
        }
        else{
            activity = Enumerable.From(shopActivity).Where(x =>( x.LimitUsedAmount  <=  amount || x.LimitUsedAmount ==0) && x.ValidType!=4).OrderByDescending(x => x.GiveMoney).FirstOrDefault(); 
        }

        let activityPoint = 0.00 
        let activityMoney = 0.00
        that.chooseActivity ={}
        that.chooseBirthdayActivity = {}

        //通过规则选中活动
        if(that.config.BirthdayActivityRule == 3){             
            if(activity != null){
                console.log('activity.Id',activity.Id,that.config.BirthdayActivityRule)
                if (activity.IsGiveMoney == 1) {
                    activityMoney = accAdd(activityMoney , activity.GiveMoney)         
                }
                if (activity.IsGivePoint == 1) {
                    activityPoint = accAdd(activityPoint , activity.GivePoint)                        
                }
                that.result.activity.push(activity)
                that.chooseActivity = activity
            }
            if(birthdayActivity!=null)
            {
                if (birthdayActivity.IsGiveMoney == 1) {
                    activityMoney = accAdd(activityMoney , birthdayActivity.GiveMoney)                  
                }
                if (activity.IsGivePoint == 1) {
                    activityPoint = accAdd(activityPoint , birthdayActivity.GivePoint)                        
                }
                that.result.activity.push(birthdayActivity)
                that.chooseBirthdayActivity = activity
            }            
        }
        else{
            //先返回生日，没有生日返回普通
            if(birthdayActivity != null ){
                if (birthdayActivity.IsGiveMoney == 1) {
                    activityMoney = accAdd(activityMoney , birthdayActivity.GiveMoney)                  
                }
                if (activity.IsGivePoint == 1) {
                    activityPoint = accAdd(activityPoint , birthdayActivity.GivePoint)                        
                }
                that.result.activity.push(birthdayActivity)
                that.chooseBirthdayActivity = activity
                // that.chooseActivity  = (activity ==undefined) ?{}: activity
            }
            else if (activity != null){
                if (activity.IsGiveMoney == 1) {
                    activityMoney = accAdd(activityMoney , activity.GiveMoney)                  
                }
                if (activity.IsGivePoint == 1) {
                    activityPoint = accAdd(activityPoint , activity.GivePoint)                        
                }
                that.result.activity.push(activity)
                that.chooseActivity = activity                
            }
        }

        that.result.amountActivityPoint = activityPoint
        that.result.giveMoney = activityMoney
        console.log('修改价格->活动计算完成',that.result)    
        return true 
    }

    selectTopUpActivity(activity){
        let that = this 
        if(this.result.isTopUp ==undefined){
         
            return false
        }
        activity = JSON.parse(activity)

        //删除操作
        let curActivity = Enumerable.From(that.result.activity).Where(x => x.Id == activity.Id).FirstOrDefault(); 
        if(curActivity!=undefined){
            let index = that.result.activity.indexOf(curActivity);
            that.result.activity.splice(index, 1) 
            if(curActivity.ValidType ==4){
                this.chooseBirthdayActivity = {}
            }
            else{
                this.chooseActivity = {}
            }
            that.chargeMoneyPointMoney()            
            return true     
        }
        console.log('hat.result.amountDiscountMoney',that.result.amountMoney,activity.GiveMoeny)

        //添加计算
        if(activity.LimitUsedAmount <= that.result.amountMoney || parseFloat(activity.LimitUsedAmount) == 0 )
        {
            if(activity.ValidType ==4 && that.chooseMember.IsBirthday == 1){
                that.chooseBirthdayActivity = activity
            }
            else{
                that.chooseActivity = activity
            }
            that.result.activity =[]
            if(that.config.BirthdayActivityRule == 3){
                if(that.chooseBirthdayActivity.Id!=undefined)
                {
                    that.result.activity.push(that.chooseBirthdayActivity)
                }
                if(that.chooseActivity.Id!=undefined)
                {
                    that.result.activity.push(that.chooseActivity)
                }
            }
            else{
                if(that.chooseBirthdayActivity.Id!=undefined){
                    that.result.activity.push(that.chooseBirthdayActivity)
                }
                else{
                    that.result.activity.push(that.chooseActivity)
                }
            }
            that.chargeMoneyPointMoney()
            return true
        }
        else
        {
            return false
        }
    }
    ////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////快速消费////////////////////////////////////
    settingChargeMoney(money,shopActivity){
        let that = this       
        let price = parseFloat(money).toFixed(2)
        if(price<=0) { return false }
     
        that
          //初始化
        let chargeInfo ={ 
            amount:0.00,
            //point:0.00,
            discountAmount:0.00,     
        }

        //计算会员价格
        if(that.chooseMember.Id == undefined){
            chargeInfo.amount = parseFloat(money).toFixed(2)            
            chargeInfo.discountAmount  =  parseFloat(money).toFixed(2)
        }
        else{
            let discountAmount = (that.chooseMember.DiscountPercent * money).toFixed(2)          
            chargeInfo ={
                amount:money,            
                discountAmount:discountAmount
            }
        }        

        this.result = {
            isCharge :1 , //快速消费标识
            staffMode: 1,                   //员工提成类型
            mode: 1,                        //商品消费 1.快速消费 2.商品消费 9.桌台消费 11.会员充值 12.会员充次
            allPayMoney: 0.00,              //支付方式总金额
            modificationInfo: {},           //手动改价详细记录 { 百分比 / 金额 /修改前金额 / 修改后金额 } 
            amountDiscountMoney: parseFloat( chargeInfo.discountAmount), 	    //会员折扣总金额 (会出现比原价高时的情况)
            goodsNum: 0, 		            //商品数量
            amountPoint: 0.00, 			    //获得积分
            amountMoney: parseFloat(chargeInfo.amount), 			    //商品总价
            amountActivityMoney: 0.00,	    //活动减金额
            isZeroAmount: 0,                //是否抹零
            zeroAmount: 0.00,               //抹零金额
            amountActivityPoint: 0.0000,	//活动获得积分
            amountCouponMoney: 0.00,		//优惠卷金额
            amountModifyMoney: 0.00,		//手动修改金额	
            giveMoney: 0.00,                 //赠送金额，仅充值时用到 (11.会员充值)                
            goods: [],                      //商品
            conpon: [],                     //优惠券
            staffs: [],                     //提成员工
            activity: [],                   //活动       
        }

        // that.result.discountAmount 
        // that.result.amountMoney

        //生日	//通过价格计算最佳活动->取获取金额最大
        let birthdayActivity = null
        let activity= null
        if (that.chooseMember.IsBirthday == 1){
            birthdayActivity = Enumerable.From(shopActivity).Where(x => ( x.LimitUsedAmount <= chargeInfo.discountAmount || x.LimitUsedAmount ==0) && x.ValidType ==4).OrderByDescending(x => x.ReduceAmount).FirstOrDefault(); 
        }
        else{
            activity = Enumerable.From(shopActivity).Where(x =>( x.LimitUsedAmount  <= chargeInfo.discountAmount|| x.LimitUsedAmount ==0) && x.ValidType!=4).OrderByDescending(x => x.ReduceAmount).FirstOrDefault(); 
        }

        let activityPoint = 0.00 
        let activityMoney = 0.00
        that.chooseActivity ={}
        that.chooseBirthdayActivity = {}

        //通过规则选中活动
        if(that.config.BirthdayActivityRule == 3){             
            if(activity != null){
                console.log('activity.Id',activity.Id,that.config.BirthdayActivityRule)
                if (activity.IsReduceAmount == 1) {
                    activityMoney = accAdd(activityMoney , activity.ReduceAmount)         
                }
                if (activity.IsGivePoint == 1) {
                    activityPoint = accAdd(activityPoint , activity.GivePoint)                        
                }
                that.result.activity.push(activity)
                that.chooseActivity = activity
            }
            if(birthdayActivity!=null)
            {
                if (birthdayActivity.IsReduceAmount == 1) {
                    activityMoney = accAdd(activityMoney , birthdayActivity.ReduceAmount)                  
                }
                if (activity.IsGivePoint == 1) {
                    activityPoint = accAdd(activityPoint , birthdayActivity.GivePoint)                        
                }
                that.result.activity.push(birthdayActivity)
                that.chooseBirthdayActivity = activity
            }            
        }
        else{
            //先返回生日，没有生日返回普通
            if(birthdayActivity != null ){
                if (birthdayActivity.IsReduceAmount == 1) {
                    activityMoney = accAdd(activityMoney , birthdayActivity.ReduceAmount)                  
                }
                if (activity.IsGivePoint == 1) {
                    activityPoint = accAdd(activityPoint , birthdayActivity.GivePoint)                        
                }
                that.result.activity.push(birthdayActivity)
                that.chooseBirthdayActivity = activity
                // that.chooseActivity  = (activity ==undefined) ?{}: activity
            }
            else if (activity != null){
                if (activity.IsReduceAmount == 1) {
                    activityMoney = accAdd(activityMoney , activity.ReduceAmount)                  
                }
                if (activity.IsGivePoint == 1) {
                    activityPoint = accAdd(activityPoint , activity.GivePoint)                        
                }
                that.result.activity.push(activity)
                that.chooseActivity = activity
                // that.chooseBirthdayActivity = (birthdayActivity ==undefined) ?{}: birthdayActivity       
            }
        }

        that.result.amountActivityPoint = activityPoint
        that.result.amountActivityMoney = activityMoney
        console.log('修改价格->活动计算完成',that.result)    
        return true 
    }
    //计算 
    chargeMoneyPointMoney(){
        let that =this 
        let activityPoint =0.00
        let activityMoney =0.00
        let giveMoney =0.00
        $.each(that.result.activity,function(index,item){
            if (item.IsReduceAmount == 1) {
                activityMoney = accAdd(activityMoney , item.ReduceAmount)                  
            }
            if (item.IsGiveMoney == 1) {
                giveMoney = accAdd(giveMoney , item.GiveMone)                  
            }
            if (item.IsGivePoint == 1) {
                activityPoint = accAdd(activityPoint , item.GivePoint)                        
            }
        })

        that.result.amountActivityPoint = activityPoint
        that.result.amountActivityMoney = activityMoney     
        that.result.giveMoney = giveMoney
    }
    //选中活动
    selectChargeMoneyActivity(activity){
        let that = this 
        if(this.result.isCharge ==undefined){
            return false
        }
        activity = JSON.parse(activity)

   

        //删除操作
        let curActivity = Enumerable.From(that.result.activity).Where(x => x.Id == activity.Id).FirstOrDefault(); 
        if(curActivity!=undefined){
            let index = that.result.activity.indexOf(curActivity);
            that.result.activity.splice(index, 1) 
            if(curActivity.ValidType ==4){
                this.chooseBirthdayActivity = {}
            }
            else{
                this.chooseActivity = {}
            }
            that.chargeMoneyPointMoney()            
            return true     
        }
        console.log('hat.result.amountDiscountMoney',that.result.amountDiscountMoney,activity.LimitUsedAmount)

        //添加计算
        if(activity.LimitUsedAmount <= that.result.amountDiscountMoney || parseFloat(activity.LimitUsedAmount) == 0 )
        {
            if(activity.ValidType ==4 && that.chooseMember.IsBirthday == 1){
                that.chooseBirthdayActivity = activity
            }
            else{
                that.chooseActivity = activity
            }
            that.result.activity =[]
            if(that.config.BirthdayActivityRule == 3){
                if(that.chooseBirthdayActivity.Id!=undefined)
                {
                    that.result.activity.push(that.chooseBirthdayActivity)
                }
                if(that.chooseActivity.Id!=undefined)
                {
                    that.result.activity.push(that.chooseActivity)
                }
            }
            else{
                if(that.chooseBirthdayActivity.Id!=undefined){
                    that.result.activity.push(that.chooseBirthdayActivity)
                }
                else{
                    that.result.activity.push(that.chooseActivity)
                }
            }
            that.chargeMoneyPointMoney()
            return true
        }
        else
        {
            return false
        }
    }

    ////////////////////////////////////////////////////////////////////////////


    /////////////////////////////////桌台消费////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
}
