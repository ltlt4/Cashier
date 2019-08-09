var LuckVipsoft = {}
//LuckVipsoft.http = "http://192.168.0.13:8088"
LuckVipsoft.http = "http://192.168.0.111"
LuckVipsoft.api = {
    /* 登录、注册*/
    retrievePasswordSendCode: '/api/GeneralInterface/RetrievePasswordSendCode', //发送验证码
    retrievePassword: '/api/GeneralInterface/RetrievePassword',  //修改密码
    login: '/api/GeneralInterface/Login',//登录
    CheckValidationCode: "/api/GeneralInterface/CheckValidationCode",//验证短信码
    GetAuthorizeByCompCode: '/api/GeneralInterface/GetAuthorizeByCompCode',//根据企业号获取授权

    /*初始化*/
    getShopList: '/api/GeneralInterface/GetShopList',//获取店铺信息(用于绑定)
    getStaffClassList: '/api/GeneralInterface/GetStaffClassList',//获取员工分类数据(用于绑定)
    getStaffList: '/api/GeneralInterface/GetStaffList', //获取提成员工数据(用于绑定)
    BindMemLevelList: '/api/GeneralInterface/BindMemLevelList',//获取等级信息
    GetSysArgument: '/api/GeneralInterface/GetSysArgument',//获取系统参数
    GetCustomFieldList: '/api/GeneralInterface/GetCustomFieldList',//自定义字段获取
    GetMasterInfo: '/api/GeneralInterface/GetMasterInfo',//获取操作员信息
    CancelOrder: '/api/GeneralInterface/CancelOrder',//取消订单


    /*主页*/
    SaveShiftTurnOverData: '/api/GeneralInterface/SaveShiftTurnOverData',//保存交班数据
    SaveUserFeedBackData: '/api/GeneralInterface/SaveUserFeedBackData',//提交意见反馈
    GetShiftTurnOverData: '/api/GeneralInterface/GetShiftTurnOverData',//获取交班数

    /*优惠 */
	GetMemConponList:'/api/GeneralInterface/GetMemConponList',//获取用户所有优惠券
    GetConponListPage: '/api/GeneralInterface/GetConponListPage',//获取优惠券列表分页数据
    SaveConponData: '/api/GeneralInterface/SaveConponData',//保存优惠券数据
    getActivityList: '/api/GeneralInterface/BindActivityListSelect', //获取优惠活动数据
    DeleteConpon: '/api/GeneralInterface/DeleteConpon',//删除优惠活动
    SaveClassDiscountRulesList: '/api/GeneralInterface/SaveClassDiscountRulesList',//保存特殊折扣
    CalculateConponAmount: '/api/GeneralInterface/CalculateConponAmount',//计算订单优惠券优惠金额


    /*快速扣次*/
    SaveDeductFixedCountOrder: '/api/GeneralInterface/SaveDeductFixedCountOrder',//快速扣次

    /*单据管理 */
    TopUp: '/api/GeneralInterface/TopUp',// 会员充值
    GetTopUpOrderByPaged: '/api/GeneralInterface/GetTopUpOrderByPaged',//单据管理-会员充值
    GetTopUpOrderByDetail: '/api/GeneralInterface/GetTopUpOrderByDetail',//单据管理-充值订单详情
    RevokeTopUpOrder: '/api/GeneralInterface/RevokeTopUpOrder',//充值撤单
    GetRechargeCountOrderByPaged: '/api/GeneralInterface/GetRechargeCountOrderByPaged',  //单据管理-充次订单
    GetRechargeCountOrderByDetail: '/api/GeneralInterface/GetRechargeCountOrderByDetail',// 单据管理-充次订单详情
    RechargeCountOrderRePrint: '/api/GeneralInterface/RechargeCountOrderRePrint',//充次重打印
    RevokeRechargeCountOrder: '/api/GeneralInterface/RevokeRechargeCountOrder',//充次撤单
    GetRedeemOrderByPaged: '/api/GeneralInterface/GetRedeemOrderByPaged',//礼品兑换列表
    GetRedeemOrderByDetail: '/api/GeneralInterface/GetRedeemOrderByDetail', //单据管理-礼品兑换订单详情
    RevokeRedeemOrder: '/api/GeneralInterface/RevokeRedeemOrder',//礼品兑换撤单
    RedeemOrderRePrint: '/api/GeneralInterface/RedeemOrderRePrint',//礼品兑换订单 重打印
    GetConsumeOrderList: '/api/GeneralInterface/GetConsumeOrderList',//单据管理-消费订单
    GetConsumeOrderData: '/api/GeneralInterface/GetConsumeOrderData',//单据管理-订单详情
    RevokeConsumeOrder: '/api/GeneralInterface/RevokeConsumeOrder',//消费撤单：快速消费、商品消费、固定消费、快速扣次、桌台消费、油品消费
    MemberReturnGoods: '/api/GeneralInterface/MemberReturnGoods',//会员消费退货
    RefundVenueConsume: '/api/GeneralInterface/RefundVenueConsume',// 场馆消费退款
    GetMallOrderListPage: '/api/GeneralInterface/GetMallOrderListPage',//获取线上订单列表
    GetMallOrderDetail: '/api/GeneralInterface/GetMallOrderDetail',//获取线上订单详情
    WriteOffMallOrder: '/api/GeneralInterface/WriteOffMallOrder',//商品核销
    GetExpressList: '/api/GeneralInterface/GetExpressList',//快递公司列表（分页）    
    GetPreWriteOffOrder: '/api/GeneralInterface/GetPreWriteOffOrder',//查询待核销商品订单返回订单详情
    GetExpressInfo:'/api/GeneralInterface/GetExpressInfo',//快递物流节点跟踪
    DeliverMallOrder:'/api/GeneralInterface/DeliverMallOrder',//

    /*卡券核销 */
    GetConponLogListPage: '/api/GeneralInterface/GetConponLogListPage',//根据优惠券ID或者卡号查询优惠券
    WriteOffCoupon: '/api/GeneralInterface/WriteOffCoupon',//优惠券核销

    /*预约订单*/
    GetResOrderPageList: '/api/GeneralInterface/GetResOrderPageList',//预约订单分页
    GetItemSelData: '/api/GeneralInterface/GetItemSelData/',//预约服务项目
    GetTecSelData: '/api/GeneralInterface/GetTecSelData/',//技师下拉
    GetTimesoftSelData: '/api/GeneralInterface/GetTimesoftSelData/',//获取时间段
    CreatResOrder: '/api/GeneralInterface/CreatResOrder/',//新增预约
    GetOrderInfo: '/api/GeneralInterface/GetOrderInfo/',//订单详情
    ReservationOpenOrder: '/api/GeneralInterface/ReservationOpenOrder/',//预约订单开单


    GetMemLevelByID: '/api/GeneralInterface/GetMemLevelByID',//根据ID获取等级信息
    SaveMemLevel: '/api/GeneralInterface/SaveMemLevel',//保存会员等级信息
    DeleteMemLevel: '/api/GeneralInterface/DeleteMemLevel',//删除会员等级
    GetRecommendedSet: '/api/GeneralInterface/GetRecommendedSet',//获取推荐设置
    SaveRecommendedSet: '/api/GeneralInterface/SaveRecommendedSet',//保存推荐设置
    SearchMemCardList: '/api/GeneralInterface/SearchMemCardList',// 会员信息查询(收银、列表)
    SaveMemberData: '/api/GeneralInterface/SaveMemberData',//保存会员信息
    DeleteMemberData: '/api/GeneralInterface/DeleteMemberData',//删除会员
    MemChangeCardID: '/api/GeneralInterface/MemChangeCardID',//会员换卡
    MemUpdatePassword: '/api/GeneralInterface/MemUpdatePassword',//会员修改密码
    MemPointAdjust: '/api/GeneralInterface/MemPointAdjust',//会员积分调整
    MemLockSet: '/api/GeneralInterface/MemLockSet',//会员绑定/解锁
    GetMemDataByID: '/api/GeneralInterface/GetMemDataByID',// 获取会员详情
    RechargeCount: '/api/GeneralInterface/RechargeCount',//  会员充次
    GetGoodsClassList: '/api/GeneralInterface/GetGoodsClassList', //获取产品分类信息
    SaveMasterData: '/api/GeneralInterface/SaveMasterData',//保存操作员信息
    GetServiceGoodsPage: '/api/GeneralInterface/GetServiceGoodsPage', //获取服务产品分页数据
    GetGoodsByID: '/api/GeneralInterface/GetGoodsByID', //根据产品ID获取产品数据
    GetCashierGoodsListPage: '/api/GeneralInterface/GetCashierGoodsListPage',//获取产品列表分页数据
    GetServiceGoods: '/api/GeneralInterface/GetServiceGoods',//获取所有计次项目不分页（用于快速扣次下拉框绑定）
    SearchMemCardList: '/api/GeneralInterface/SearchMemCardList',//会员信息查询
    GetGoodsListPage: '/api/GeneralInterface/GetGoodsListPage',//获取商品列表分页数据
    SaveGoodsData: '/api/GeneralInterface/SaveGoodsData', //保存商品
    DeleteGoods: '/api/GeneralInterface/DeleteGoods',//删除商品
    GetRechargeCountGoodsListPage: '/api/GeneralInterface/GetRechargeCountGoodsListPage',//获取充次商品分页数据
    GetComboListPage: '/api/GeneralInterface/GetComboListPage',//获取套餐列表
    GetComboData: '/api/GeneralInterface/GetComboData',//获取套餐详情
    SaveComboData: '/api/GeneralInterface/SaveComboData',//保存套餐
    GetGiftInfoPage: '/api/GeneralInterface/GetGiftInfoPage',//获取积分兑换礼品列表
    RedeemGift: '/api/GeneralInterface/RedeemGift',//会员礼品兑换订单提交
    /*操作*/
    UploadImg: '/api/GeneralInterface/UploadImg', //上传图片
    SaveMemberData: '/api/GeneralInterface/SaveMemberData',//保存会员信息

    /*短信 */
    GetSMSMsgTemplateList: '/api/GeneralInterface/GetSMSMsgTemplateList',//模板列表
    SaveSMSMsgTemplate: '/api/GeneralInterface/SaveSMSMsgTemplate',//短信自定义模板（增、改）
    SmsSend: '/api/GeneralInterface/SmsSend',//发送短信

    /*场地消费 */
    GetVenueRegionList: '/api/GeneralInterface/GetVenueRegionList',//获取场馆区域列表
    GetVenueInfoPage: '/api/GeneralInterface/GetVenueInfoPage',//获取场馆列表
    ModifyVenueState: '/api/GeneralInterface/ModifyVenueState',//修改场馆状态
    GetVenueInfoSelList: '/api/GeneralInterface/GetVenueInfoSelList',//获取绑定下拉场馆列表
    GetVenueMemberAndGoodsInfoByVenueID: '/api/GeneralInterface/GetVenueMemberAndGoodsInfoByVenueID',//获取已开台场地会员信息及场馆信息(根据场馆取单)
    GetVenueMemberAndGoodsInfoByMemID: '/api/GeneralInterface/GetVenueMemberAndGoodsInfoByMemID',//获取已开台场地会员信息及场馆信息(根据会员取单)
    ChangeVenue: '/api/GeneralInterface/ChangeVenue',//更换场地
    VenueUnionBill: '/api/GeneralInterface/VenueUnionBill',//场馆合并账单
    SaveVenueRestingGoods: '/api/GeneralInterface/SaveVenueRestingGoods',//场馆挂单
    OpenVenue: '/api/GeneralInterface/OpenVenue',//场馆开台

    /*支付 */
    ComboBarcodePay: '/api/GeneralInterface/ComboBarcodePay',//聚合条码支付
    QueryPay: '/api/GeneralInterface/QueryPay',//支付查询
    RefundPay: '/api/GeneralInterface/Refund',//退款

    //商品消费、计次消费、套餐消费
    GoodsConsume: '/api/GeneralInterface/GoodsConsume',//退款
    
    
}
LuckVipsoft.lan = {
    ER0000: '系统登录失败',
    ER0001: '登陆失败',
    ER0002: '登录账户不能为空',
    ER0003: '密码不能为空',
    ER0004: '验证码不能为空',
    ER0005: '验证码必须为4位数字',
    ER0006: '企业代码不存在',
    ER0007: '验证码过期',
    ER0008: '登录账户不存在',
    ER0009: '密码不正确',
    ER0010: '验证码不正确',
    ER0011: '系统数据不完整，企业代码对应的总店信息不存在',
    ER0012: '企业信息未初始化,找不到此企业',
    ER0013: '系统数据不完整，操作员所在分店信息不存在',
    ER0014: '手机号码不能为空',
    ER0015: '请输入正确格式的手机号码',
    ER0016: "企业号不能为空",
    ER0017: "密码两次输入不一致",
    ER0018: "上传图片不能为空",
    ER0019: "上传类型错误",
    ER0020: "锁屏密码不能为空",
    ER0021: "搜索内容不能为空",
    ER0022: "请选择会员",
    ER0023: "未找到符号条件的订单",
    ER0024: "请输入正确的快递公司",
    ER0025: "请打开摄像头",
}
LuckVipsoft.network = new Array()
