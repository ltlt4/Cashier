
$(function(){
    template.defaults.imports.fnActMode = function(mode) {
        if(mode == 4){
            return 'birthday'
        }
        else{
            return 'other'
        }
    }
    template.defaults.imports.fnToFixed = function(num)
    {     
        return parseFloat(num).toFixed(2)
    }
    template.defaults.imports.fnGoodsMode = function (mode) {
        switch(mode){
            case 1:
                return '<i class="colorIcon blue">库</i> '
            break;
            case 2:
                return '<i class="colorIcon green">服</i>'
            break;
            case 4:
                return '<i class="colorIcon purple">次</i> '
            break;
            case 5:
                return '<i class="colorIcon red">套</i>'
            break;
            default:
                return ''
                break;        
        }    
    }

    template.defaults.imports.fnPayItemAmount= function (code) {
        switch(code){
            case '002':     //余额
                return ''   //'<small>可用余额¥50.00</small>'        
            case '003':     //积分
                return ''   //'<small>可用积分50.00</small>'        
            case '999':     //优惠券
                return '<em class="paySelectCoupon">重选优惠券</em>'        
            case '001':     //现金
                return '<small>找零¥ 50.00 </small>'        
            default:
                return ''          
        }    
    }
})


/* 购物车结算计算流程,调用修改原则.外部调用不允许修改内部变量,必须写内部方法修改变量 */
class payCompose
{
    constructor(config){
        this.config = config    
        this.shoppingCar = []        
        this.result = {}
        this.payItem =[]
        this.curPayItem =''  
        this.remark =''
        this.processCallback = function(){ console.log("processCallback->未绑定回调方法")}
        this.finishCallback =  function(){ console.log("finishCallback->未绑定回调方法")}
        this.reset()
    }
    

    init()
    {
        this.chooseBirthdayActivity = {}     //生日优惠
        this.chooseActivity = {}              //活动方案
        //this.chooseMember   = {}              //会员      

        //this.shoppingCar = []               //购物车

        this.payItem =[]
        this.curPayItem =''
        this.remark =''
        this.conpon = []
       

        this.result = {         
            allPayMoney  :0.00 ,            //支付方式总金额
            modificationInfo :{}  ,          //手动改价详细记录 { 百分比 / 金额 /修改前金额 / 修改后金额 } 
            amountDiscountMoney : 0.00, 	//会员折扣总金额 (会出现比原价高时的情况)
            goodsNum : 0, 		            //商品数量
            amountPoint	: 0.00, 			//获得积分
            amountMoney	: 0.00, 			//商品总价
            amountActivityMoney: 0.00 ,	    //活动减金额
            isZeroAmount: 0,
            zeroAmount :0.00,               //抹零金额
            amountActivityPoint: 0.0000,	//活动获得积分
            amountCouponMoney:0.00	,		//优惠卷金额
            amountModifyMoney:0.00 ,		//手动修改金额	
            goods:[], 
        }
        return true 
    }

    //待付金额
    //总金额
    //优惠金额
    //支付方式金额

    setRemark(remark)
    {
        this.remark = remark
    }

     //删除购物车，会员保留
    clearShoppingCar()
     {
         let that =this 
         if(that.init())
         {
            that.shoppingCar = []   
            that.process()
         }
    }

    //重置但不重置购物车
    reset(){
        let that =this 
        if(that.init())
        {
            that.chooseMember = {} //会员    
            that.process()
        }     
    }

    //修改当选中项金额
    changePayMoney(code, m)
    {   
        let that = this    
        if( that.curPayItem!= code) //当前选中code 和提交code 不一致
        {
            return false 
        }
       
        let item = Enumerable.From(that.payItem).Where(x=>x.code == code).FirstOrDefault();
        if(item==undefined)
        {
            return false
        }  
        else
        {
            that.curPayItem = code   //选中支付方式            
            //排除自己还能输入的金额    
                 
            item.amount= parseFloat(m)
            that.finish();
            return true
        }
    }

    selectPayInput(code)
    {
        let that =this 
        let item = Enumerable.From(that.payItem).Where(x=>x.code == code).FirstOrDefault();        
        if(item == undefined)
        {
            return false
        }
        else
        {            
            that.curPayItem = code
            if(code == '999'){ that.finish();return false;}

            //应收金额
            let amount = math.chain(that.result.amountMoney).subtract(that.result.amountActivityMoney).subtract(that.result.amountModifyMoney).subtract(that.result.zeroAmount).done().toFixed(2)
            let addPrice = 0.00
            $.each(that.payItem,function(index,ele){
                if(ele.code != code ){                   
                    let m =  math.chain(addPrice).add(ele.amount).done()
                    addPrice = m
                }
            })

            let diffPrice =  math.chain(amount).subtract(addPrice).done()
           
            if(diffPrice>0 ){
                item.amount =diffPrice                       
            }   
            else{
                item.amount = 0                    
            }
            that.finish()
            return true
            //return diffPrice>0 ? diffPrice:0;
        }       
    }

    //选择支付方式
    selectPay(code) {
        let that = this        
        let item = Enumerable.From(that.payItem).Where(x=>x.code == code).FirstOrDefault();

        if(item == undefined)
        {
            let payConfigItem = Enumerable.From(that.config.PaymentConfig).Where(x=>x.code == code).FirstOrDefault();
            if(payConfigItem==undefined)
            {
                return false
            }  

            console.log('payitem=>undefined',payConfigItem)
            ////////////// 微信支付宝 二选一////////////
            if(code=='010')  
            {
              let wxItem =  Enumerable.From(that.payItem).Where(x=>x.code =='020').FirstOrDefault();
              if(wxItem!=undefined) {
                    let wxItemIndex = that.payItem.indexOf(wxItem)
                    that.payItem.splice(wxItemIndex, 1) 
              }
            }
            else if(code=='020')
            {
                let aliItem =  Enumerable.From(that.payItem).Where(x=>x.code =='010').FirstOrDefault();
            
                if(aliItem!=undefined) {
                      let aliItemIndex = that.payItem.indexOf(aliItem)
                      that.payItem.splice(aliItemIndex, 1) 
                }
            }           
            ////////////// 微信支付宝 二选一////////////
            that.curPayItem = payConfigItem.code

            if(code=='999')
            {
                that.payItem.unshift({code: payConfigItem.code , name : payConfigItem.name, amount: 0.00})
            }
            else
            {
                that.payItem.push({code: payConfigItem.code , name : payConfigItem.name, amount: 0.00})     
            }
        }
        else
        {
            let index = that.payItem.indexOf(item)
            that.payItem.splice(index, 1) 
             //删除优惠券集合
            if(code=='999'){ that.conpon =[] }


            if(that.payItem.length>0){
                let lastItem = Enumerable.From(that.payItem).LastOrDefault();                
                that.curPayItem = lastItem.code
            }
            else{
                that.curPayItem = ''
            }
        }
        that.finish();

        return true
    }

    //同时选择的支付数量
    payMaxCount(code , num) {
        let that =this
        if(that.payItem.length >= num)
        {
            let item = Enumerable.From(that.payItem).Where(x=>x.code == code).FirstOrDefault();
            if(item==undefined)
            {                
                return true
            }
            return false           
        }       
    }

    //选择提成员工
    selectStaffs(goodsId,staffs)
    {
        if(staffs.lenght >0)
        {
            let item = Enumerable.From(this.shoppingCar).Where(x=>x.goodsId ==goodsId).FirstOrDefault();     
            if(item.goodsId != undefined)
            { 
                console.log('staffs', '添加')
                let n = Object.assign({},staffs)  
                item.staffs = n
                return true
            }  
            return false
        }
        else
        {
            console.log('staffs', '已清空')
            return false  
        }
    }

    //获取已设置的提成员工
    goodsStaffs(goodsId)
    {
        let item = Enumerable.From(this.shoppingCar).Where(x=>x.goodsId ==goodsId).FirstOrDefault();
        if(item.goodsId != undefined)
        {            
            if(item.staffs.lenght>0){               
                let result = Object.assign({},item.staffs)  
                return result
            }
            else{
                return []
            }
        }
        else{
            return []
        }
    }

    //添加优惠卷 只计算带{}
    postConponData(conpons)
    {
        return postData   
    }

    //设置result 
    setConponData(result)
    {   
        //写订单结构
    }
 
    //优惠券是否可以使用（店铺和会员接口已经过滤）->判断可用时间、生日优惠策略、全局配置
    //1-生日优先、2-系统活动优先、3-系统活动上叠加
    //opt选择取消 true,false
    selectActivity(activity)
    {
        let  that = this
        activity =JSON.parse(activity)
        if(activity.ValidType == 4 && that.chooseBirthdayActivity.Id ==activity.Id)
        {
            that.chooseBirthdayActivity={}
            that.process()
            return true
        }
        else if(that.chooseActivity.Id ==activity.Id)
        {
            that.chooseActivity={}
            that.process()
            return true
        }
              
        let birthdayActivityRule = this.config.BirthdayActivityRule     
        let currentPrice = that.result.amountDiscountMoney
 
        if( activity.LimitUsedAmount > currentPrice)
        {              
            console.log("未达到优惠额度") 
            return false
        }
       
        if(activity.ValidType == 4)
        {          
            if(member.IsBirthday == 0 )
            {
                return false
            }
            else
            {
                if(birthdayActivityRule!=3){ that.chooseActivity ={} }   //全局
                that.chooseBirthdayActivity = activity
                that.process()
                return true
            }           
        }
        else
        {             
            if(birthdayActivityRule!=3){ that.chooseBirthdayActivity ={} } //全局
            that.chooseActivity = activity      
            that.process()      
            return true
        }     
    }

    //所有优惠执行完成 ->result , 
    //完整流程 process() -> goPay() -> finish  ->  完成结算(调取支付) ，优惠券处理调用接口计算
    finish(){
        let that =this
        let res = new Promise(that.setpModify.bind(that))       
       .then(function(res){     
           return new Promise(that.setpPay.bind(that));
       }).then(function(res){
           that.finishCallback()
           console.log("finish")
       })

      
        //  let res = new Promise(that.setpModify.bind(that))
        //  .then(function(res){         
        //     return new Promise(that.setpConpon.bind(that))
        // })
        // .then(function(res){     
        //     return new Promise(that.setpPay.bind(that));
        // }).then(function(res){
        //     that.finishCallback()
        //     console.log("finish")
        // })
   
        return that.result
    }

    //计算购物车及会员折扣+活动优惠
    process() {  
        let that =this
        console.log("------------------process in----------------------")
        //01.result 重构
        this.result = {          
            modificationInfo :{}  ,          //手动改价详细记录 { 百分比 / 金额 /修改前金额 / 修改后金额 } 
            isZeroAmount: 0,
            zeroAmount :0.00,               //抹零金额

            amountDiscountMoney : 0.00, 	//会员折扣总金额 (会出现比原价高时的情况)
            goodsNum : 0, 		            //商品数量
            amountPoint	: 0.00, 			//获得积分
            amountMoney	: 0.00, 			//商品总价
            amountActivityMoney: 0.00 ,	    //活动减金额       
            amountActivityPoint: 0.00,	//活动获得积分
            amountCouponMoney:0.00	,		//优惠卷金额
            amountModifyMoney:0.00 ,		//手动修改金额	
            goods:[], 
        }
        
        //02.重计算
        let res = new Promise(that.setpMember.bind(that)).then(function(res){         
            return new Promise(that.setpActivity.bind(that))
        }).then(function(res){          
            //回调
            that.processCallback()   
            //重新渲染部份页面-> 后期优化实现隔离  
            console.log("process => ",that.result)      
            console.log("------------------process out----------------------")
        })
    }

    //添加购物车
    selectItem(goods){
        let item = Enumerable.From(this.shoppingCar).Where(x=>x.goodsId == goods.Id).FirstOrDefault();     
        if(item === undefined)
        { 
            let price = goods.Price //其他类型可能不是Price

            this.shoppingCar.push( { 
                price:goods.Price,
                goodsId :goods.Id,                
                goodsMode: goods.GoodsType,//mode,	        //类型 1.普通商品 2.服务商品 3.计时商品 4.计次商品 5.套餐
                num : 1,               
                goodsPoint : 0.000,         //商品优惠积分（总）
                amount :0.00 ,              //商品总价
                discount : 1 ,        		//会员折扣率
                discountMoney: 0.00 , 		//会员折扣 （总）
                discountSchemes : '散客',			
                activityMoney :0.00,        //活动优惠金额（总）
                activityPoint : 0.00,       //活动获取积分（总）
                conponMoney :0.00,          //优惠券优惠金额（总）
                conponDiscount :0.00,       //优惠券折扣
                modifyMoney :0.00,          //整单优惠修改分摊金额（总）
                staffs: [],
                source:goods,
            })
        }
        else{
            if(item.goodsMode==1)
            {
                if(  item.num == item.source.StockNum){                  
                    return false;
                }
            }
            item.num++
        }  
        this.process()  
        return true
        //console.log("chooseItem->",this.shoppingCar)
    }

    //修改数量
    changeItemNum( goodsId , num ) {
        num = parseInt(num)
        let that =this 
        let item = Enumerable.From(this.shoppingCar).Where(x=>x.goodsId == goodsId).FirstOrDefault();     
        if(item === undefined)
        {
            return false
        }
        else
        {
            if(num == 0){
                let index = that.shoppingCar.indexOf(item);               
                that.shoppingCar.splice(index, 1)                            
            }
            else{
                if(item.goodsMode==1){
                    if( (num-0) >item.source.StockNum){
                        item.num = item.source.StockNum
                        return false;
                    }                    
                }
                item.num = num
            }
            that.process()
            return true
        }
    }
  
    //重新选择会员 清空参数带 {}
    changeMember(member){      
        //重选会员后、折扣券清空、生日清空、手动改价清空
        this.reset()
        this.chooseMember = member 
        this.process()
    }

    //setp->01 会员价格计算
    setpMember(resolve,reject) {   
        let member = this.chooseMember
   
        let that =this 
   
        let amountDiscountMoney = 0.00	//会员折扣金额
        let	goodsNum = 0			    //商品数量
        let amountPoint = 0.00			//获得积分
        let amountMoney = 0.00
        
        let classRules = this.chooseMember.ClassDiscountRulesList!== undefined ? this.chooseMember.ClassDiscountRulesList :null;
  
        $.each (this.shoppingCar ,function (index,element){     
            //let memberDiscount = 1
            let discount = 1 //记录最低,默认为会员等级折扣
            // let memberDiscountMoney = 0.00
            let goodsPoint = 0.00
            let amount = 0.00
            let price = element.price
            let memberPrice = element.price

            if(member.Id == undefined)
            {
                that.result.goods.push({ 
                    goodsId :element.goodsId,
                    goodsMode:element.goodsMode,
                    num : element.num,               
                    goodsPoint : 0.000,         //商品获得积分（总）
                    amount :(memberPrice * element.num).toFixed(4) , //商品总价(会员折后)
                    memberDiscount : 1 ,        //会员折扣率
                    price : price,
                    memberPrice: element.price,
                    //memberDiscountMoney: 0.00 , //会员折扣 （总）
                    memberSchemes : '散客',
                    activityMoney : 0.00,        //活动优惠金额（总）
                    activityPoint : 0.00,       //活动获取积分（总）
                    conponMoney :0.00,          //优惠券优惠金额（总）
                    modifyMoney :0.00,          //整单优惠修改分摊金额（总）
                    staffs: element.staffs,
                    source: element.source,
                })
                goodsNum +=  element.num    
                amountDiscountMoney += element.num* memberPrice
                amountMoney  += element.num* memberPrice
            }
            else{                  
                //if(element.goodsMode == 5 || element.goodsMode == 1 ) //套餐 +商品
                if(true)
                {   
                    let memberSchemes =''
                   
                    if(element.source.Specials > 0){  
                       
                        memberPrice = element.source.Specials //商品特价
                        memberSchemes = "商品特价"
                    }
                    else
                    {                                      
                        memberSchemes = "商品折扣"                       
                        let classDiscount = 1   //商品分类折扣     
    
                        //商品分类折扣计算
                        if( element.source.GoodsClass !== undefined  && classRules!=null)
                        {
                            let classRulesItem = Enumerable.From(classRules).Where(x=>x.GoodsClassId == element.source.GoodsClass).FirstOrDefault();  
                            if(classRulesItem !== undefined)
                            {
                                classDiscount = classRulesItem.Discount
                            }                                                
                        }
                        
                        //商品折扣
                        if(element.source.IsDiscount == 0) //无产品最低折扣
                        {
                            if(classDiscount < 1 ){
                                discount = classDiscount;
                                memberSchemes = "会员商品分类折扣(未启用商品折扣)"
                            }
                            else{
                                console.log(member.DiscountPercent,member)
                                discount = member.DiscountPercent;   
                                memberSchemes = "会员默认折扣(未启用商品折扣)"  
                            }                                   
                        }
                        else{
                            if(classDiscount < 1 ){
                                // 商品最低折扣  会员商品分类 比较
                                if( element.source.MinDiscount > classDiscount){ 
                                    memberSchemes = "会员商品分类折扣(启用商品折扣)"
                                    discount = classDiscount
                                }
                                else{
                                    memberSchemes = "商品最低折扣(启用商品折扣)"
                                    discount = element.source.MinDiscount
                                }                          
                            }
                            else{
                                //商品最低折扣 会员默认折扣 比较
                                if(element.source.MinDiscount > member.DiscountPercent){                              
                                    memberSchemes = "会员默认折扣(启用商品折扣)"
                                    discount =  member.DiscountPercent
                                }
                                else{                             
                                    memberSchemes = "商品最低折扣(启用商品折扣)"
                                    discount =  element.source.MinDiscount
                                }
                             } 
                        }    
                        memberPrice =  (price * discount).toFixed(4)
                    }

                   
                    //获取积分计算
                    if(element.source.IsPoint == 1){                            
                        goodsPoint =  (element.source.PointType * element.num)
                        amountPoint = amountPoint + goodsPoint
                    }                    
                    else if(member.PointPercent > 0 ){
                
                        goodsPoint =  (memberPrice *  element.num * member.PointPercent ).toFixed(4)
                        //(((price - memberPrice) * element.num )* member.PointPercent ).toFixed(4)
                        amountPoint += goodsPoint ;// 按折后金额给积分
                    }  

                    that.result.goods.push({ 
                        goodsMode:element.goodsMode,
                        goodsId :element.goodsId,
                        num : element.num,               
                        goodsPoint : goodsPoint,         //商品获得积分（总）
                        amount : (memberPrice * element.num).toFixed(4) , //商品总价(会员折后)
                        memberDiscount : discount,       //会员折扣率
                        price : price,
                        memberPrice: memberPrice,
                       // memberDiscountMoney: 0.00 , //会员折扣 （总）
                        memberSchemes : memberSchemes,
                        activityMoney :0.00,        //活动优惠金额（总）
                        activityPoint : 0.00,       //活动获取积分（总）
                        conponMoney :0.00,          //优惠券优惠金额（总）
                        modifyMoney :0.00,          //整单优惠修改分摊金额（总）
                        staffs: element.staffs,
                        source: element.source,
                    })

                    amountDiscountMoney += (memberPrice * element.num)
                    goodsNum  += element.num                  
                    amountMoney +=  element.num * price    
                }
                else 
                {
                    //// 场馆 、...........................
                }
            }
        })

        that.result.amountDiscountMoney = that.moneyPrecision(amountDiscountMoney) //amountDiscountMoney.toFixed(4)
        that.result.goodsNum = goodsNum
        that.result.amountPoint = that.pointPrecision (amountPoint)   //amountPoint.toFixed(4)
        that.result.amountMoney = that.moneyPrecision(amountDiscountMoney)      // amountMoney.toFixed(4)

        console.log('会员计算结果 ==>', that.result)
        resolve("setpMember");
    }

    //setp->02 活动优惠计算 
    setpActivity(resolve,reject)
    {
        let that =this 

        let currentPrice= that.result.amountDiscountMoney //当前总价

        
        that.result.amountActivityMoney= 0.0000 //活动减金额
        that.result.amountActivityPoint= 0.0000 //活动获得积分

        if(that.chooseActivity.Id!=undefined)
        {
            if( that.chooseActivity.LimitUsedAmount <= currentPrice)
            {           
                console.log()
                if(that.chooseActivity.IsReduceAmount ==1 )   
                {                    
                    //that.w_calc(that.chooseActivity.ReduceAmount  , currentPrice )
                    that.result.amountActivityMoney += that.chooseActivity.ReduceAmount
                }
                if(that.chooseActivity.IsGivePoint ==1 )
                {
                    that.result.amountActivityPoint += that.chooseActivity.GivePoint
                }              
            }
            else
            {
                that.chooseActivity = {}
                console.log("活动不满足金额->清空")
            }
        }

        if(that.chooseBirthdayActivity.Id!=undefined)
        {
            if( that.chooseBirthdayActivity.LimitUsedAmount <= currentPrice)
            {           
                if(that.chooseBirthdayActivity.IsReduceAmount ==1 )   
                {
                    //that.w_calc(that.chooseBirthdayActivity.ReduceAmount  , currentPrice )
                    that.result.amountActivityMoney += that.chooseBirthdayActivity.ReduceAmount
                }

                if(that.chooseBirthdayActivity.IsGivePoint ==1 )
                {
                    that.result.amountActivityPoint += that.chooseBirthdayActivity.GivePoint
                }              
            }
            else
            {
                that.chooseBirthdayActivity = {}
                console.log("活动不满足金额(生日)");
            }
        }
        console.log('活动计算结果 ==>', that.result)
        resolve("setpActivity");
    }


    //优惠券计算（代金券）
    w_calc_conpon(conpon)
    {
        let currentAmountPrice = (that.amountDiscountMoney -that.amountActivityMoney - that.amountCouponMoney ) //剩余总价

        //01.查出所有可打商品总价 
        //剩余价格 / 商品总价 * (Quota)
        if(conpon.Quota>0)
        {
          
        }       
    }

    //优惠券计算函数(折扣),折扣券只能选一张并且不能用代金券 ，不会为负数不做过多处理
    w_calc_conpon_discount(conpon){
        let that = this
        switch(conpon.LimitGoodsWay)
        {
            case 1:
                {                   
                    //不限制
                    $.each(that.result.goods,function(index,item){
                        let x = ((item.amount - item.activityMoney) * Quota).toFixed(4)
                        item.conponMoney += x
                        that.amountCouponMoney += x
                    })
                }
                break;
            case 2:
                {
                    //包含商品
                    $.each(that.result.goods,function(index,item){
                        let arr = conpon.LimitGoods.split(',')
                        if(arr.indexOf(item.goodsId)>-1)
                        {
                            let x = ((item.amount - item.activityMoney) * Quota).toFixed(4)
                            item.conponMoney += x
                            that.amountCouponMoney += x
                        }
                    })   
                }
                break;
            case 3:
                {
                    //不包含商品
                    $.each(that.result.goods,function(index,item){
                        let arr = conpon.LimitGoods.split(',')
                        if(arr.indexOf(item.goodsId)==-1)
                        {
                            let x = ((item.amount - item.activityMoney) * Quota).toFixed(4)
                            item.conponMoney += x
                            that.amountCouponMoney += x
                        }
                    })
                }
                break;
        }
    }

    // 抹零开关
    settingZeroAmount()
    {
        let that =this        
        that.result.isZeroAmount = (that.result.isZeroAmount == 1)? 0 : 1
        
        //清除所有支付项的金额
        that.clearPayItemAmunt()
        that.finish()
        return true 
    }
       
    //setp->03 优惠卷计算
    setpConpon(resolve,reject){   
         //执行前设置所有 isLock  优惠券余额 和 使用情况
         let that = this 
         //请求接口计算



        console.log('优惠卷算结果 ==>', that.result)
        resolve("setpConpon");        
    }
    
    //setp->04 支付方式计算 (抹零处理)
    setpPay(resolve,reject)
    {     
        let that =this         
        //计算抹零 ->当前总结 不计算优惠券
        if(that.result.isZeroAmount == 1){
            let amountMoney = math.chain(that.result.amountMoney).subtract(that.result.amountActivityMoney).subtract(that.result.amountModifyMoney).done()
            // that.result.amountMoney - that.result.amountActivityMoney  - that.result.amountModifyMoney            
            let surAmountMoney = that.zeroPrecision(amountMoney)
            that.result.zeroAmount = surAmountMoney
        }
        else{
            that.result.zeroAmount = 0.00
        }

        let addPrice =0.00
        $.each(that.payItem,function(index,ele){   
            let m =  math.chain(addPrice).add(ele.amount).done()
            addPrice = m
        })
        that.result.allPayMoney = addPrice

        console.log('that.payItem=>',that.payItem)
        console.log('支付方式 ==>', that.result)
        resolve("setpPay");   
        //计算支付方式     
    }

    //setp->05  计算活动优惠和整单优惠分摊 （已合并其他方法内部的计算，方法名暂时不修改）
    setpModify(resolve,reject){ 
        let that = this
        if (that.result.amountModifyMoney > 0)
        {
            let maxPrice = 0.00
            // let goodsId =''
            let diffModifyMoney = 0.00 //折扣当前循环总价金额
            let maxMoney = math.chain(that.result.amountMoney).subtract(that.result.amountActivityMoney).subtract(that.result.amountModifyMoney).done()
            let disMoney = math.chain(that.result.amountActivityMoney).add(that.result.amountModifyMoney).done() // 活动+ 整单优惠金额

            if( maxMoney >0 ){
                $.each( that.result.goods ,function(index,item){                    
                    let rate =  item.amount / that.result.amountDiscountMoney 
                    let p = ( disMoney * rate ).toFixed(2) 

                    let m = disMoney - diffModifyMoney //当前可用的分摊金额
                    if( m >  p)
                    {
                        if( item.amount < p ){
                            item.modifyMoney = item.amount
                            diffModifyMoney += item.amount
                        }
                        else{
                            item.modifyMoney = p
                            diffModifyMoney += p
                        }
                    }
                    else
                    {
                        item.modifyMoney =  m
                        diffModifyMoney +=  m
                    }
                })      
            }
            else if(maxMoney==0){
                //免单
                $.each( that.result.goods ,function(index,item){
                    item.modifyMoney  = item.amount
                })
            }
            else{
                console.log('整单优惠输入价格无效')
            }
        } 
     
       console.log('整单优惠 ==>', that.result)
       resolve("setpConpon"); 
    }

    //设置整单优惠
    settingModify(amountModifyMoney , modificationInfo )
    {
        let that =this 
        let maxMoney =math.chain(that.result.amountMoney).subtract(that.result.amountActivityMoney).done()
        
        amountModifyMoney = that.floor(amountModifyMoney)

        if(amountModifyMoney<=0) { return false }
        if(amountModifyMoney > maxMoney) { return false }

        that.result.amountModifyMoney = amountModifyMoney 
        that.result.modificationInfo = modificationInfo

        //清除所有支付项的金额
        that.clearPayItemAmunt()
        that.finish()
        return true
    }

    //取消整单优惠
    cancelModify()
    {
        let that = this    
        that.result.modificationInfo = {} 
        that.result.amountModifyMoney =0.00
        //清除所有支付项的金额
        that.clearPayItemAmunt()
        that.finish()
        return true
    }
    //清除所有支付项的金额
    clearPayItemAmunt()
    {
        let that =this

        //删除支付方式的所有金额
        this.result.allPayMoney = 0.00        
        $.each(that.payItem,function(index,item){
            item.amount = 0.00
        })

        //删除优惠券
        that.conpon = []
    }

    //前往结算
    goPay(callback)
    {
        let that =this    
        //整单优惠
        this.result.modificationInfo = {}
        that.result.amountModifyMoney =0.00    
        //当前支付总金额  
        this.result.allPayMoney = 0.00
        //抹零金额   
        that.result.isZeroAmount = 0
        that.result.zeroAmount = 0.00    
        //支付方式
        this.payItem =[]
        this.curPayItem =''
        //优惠券
        this.conpon = []
            
        if(that.chooseMember.Id == undefined){
            that.selectPay(that.config.SankeDefaultPayment)	
            that.curPayItem = that.config.SankeDefaultPayment  
        }
        else{
            that.selectPay(that.config.MemberDefaultPayment)	
            that.curPayItem = that.config.MemberDefaultPayment  
        }
               
        if (typeof callback === "function") {
            callback()
        }
        return false
    }
    
    ////////////////////////////功能函数////////////////////////////
    //日期格式化
    dateFormat(fmt,date){ 
        var o = { 
            "M+" : date.getMonth()+1,     //月份 
            "d+" : date.getDate(),     //日 
            "h+" : date.getHours(),     //小时 
            "m+" : date.getMinutes(),     //分 
            "s+" : date.getSeconds(),     //秒 
            "q+" : Math.floor((date.getMonth()+3)/3), //季度 
            "S" : date.getMilliseconds()    //毫秒 
        }; 
        if(/(y+)/.test(fmt)) 
        fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length)); 
        for(var k in o) 
        if(new RegExp("("+ k +")").test(fmt)) 
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length))); 
        return fmt; 
    }

    //舍弃2位后的小数
    floor (num){                 
        return Math.floor(num * 100) / 100 
    }

    //全局积分保留处理方式
    pointPrecision (num)
    {        
        let that =this 
        switch(that.config.PointPrecision)       
        {
            case 0: //保留2位
                return  num.toFixed(2)         
            case 1://保留整数（四舍五入）
                return  Math.round(num)
            case 2://保留整数
                return  parseInt(num)   
            case 3://保留1位
                return  num.toFixed(1)     
            case 4://保留3位
                return  num.toFixed(3)
            default :   
                return  num.toFixed(3)      
        }
    }
    //全局金额
    moneyPrecision(num)
    {  
        let that =this  
        switch(that.config.MoneyPrecision)       
        {
            case 0:
                return  num.toFixed(2)         
            case 1:
                return parseInt( Math.floor(num * 10) / 10 )
            case 2:
                return parseInt(num)   
            case 3:
                return  num.toFixed(1)      
            default :   
                return num.toFixed(2)      
        }
    }

    //结算金额处理方式 (抹零计算规则) 
    zeroPrecision(num)
    {
        let that =this 
        //IsAllowModifyOrderTotal     
        if(that.config.IsAllowModifyOrderTotal == 1 && that.config.ZeroErasingUnit >0) 
        {
            switch(that.config.ZeroErasingUnit)
            {
                case 0: //不抹
                {
                    return 0
                }
                case 1: //分
                {
                   let a = parseInt(num*10)   
                   return (a/10).toFixed(2)        
                }              
                case 2: //角                                  
                {
                    let b = parseInt(num)   
                    return (num - b).toFixed(2)    
                }
                case 3://元
                {
                    let c =  parseInt(num/10)
                    return (c*10).toFixed(2) 
                }
                default:
                return 0
            }          
        }
        return 0
    }
}
