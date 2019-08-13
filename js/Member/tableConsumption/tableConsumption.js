layui.use(['layer', 'element', 'jquery', "form", 'table'], function () {
    var layer = layui.layer, element = layui.element, $ = layui.$, form = layui.form, table = layui.table;

    var user = {
        token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
        information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
        staffClass: $.session.get("staffClass") ? $.session.get("staffClass") : null,
        staffInf: $.session.get("staffInf") ? $.session.get("staffInf") : null,
        sysArgument: $.session.get("sysArgument") ? $.session.get("sysArgument") : null,
    }
    var oPayCompose = new payCompose(user.sysArgument);
    var proPageTotalNum = 1;
    var graph = true; //判断是否开启无图模式
    var member = null; //会员信息
    var proboxHeight = $(".lomo-mian-right").height();
    var proboxWidth = $(".lomo-mian-right").width();
    var X = '', Y = Math.floor(proboxHeight / 226);

    function initPage() {
        venue.init();
    }

    var venue = {
        pageIndex: 1,
        pageSize: 10,
        MainID: "",//主场馆详细ID
        timer: new Object(),
        countdown: 120,//倒计时时间/秒
        searchType:1,//1商品 2套餐
        key: '', //商品条码
        classId: '', //产品类目Id(一级，二级)
        regionId: '', //区域ID
        parent: [],//一级菜单
        children: [],//二级菜单
        StaffClassList: [],//员工分类
        StaffList: [],//提成员工
        venue: null,//选中的场馆信息
        changedVenueType: 1,//1场地更换 2合并账单
        venueRestingGoods: null,//挂单数据
        shoppingCar:null,//购物车数据
        chooseBirthdayActivity : {}, //生日优惠
        chooseActivity : {}, //活动方案
        orderVenueDetailList: [//场馆购物车列表
            {
                Id: "",//场馆消费订单详情ID
                MainID: "",//主开台ID
                VenueID: "",//场馆ID
                VenueName: "",//场馆名称
                Price: 0,//单价
                Specials: 0,//会员特价
                StartTime: 0,//计时产品开始时间
                EndTime: 0,//计时产品结束时间
                IsMainVenue: 1,//是否主场馆
                VenueGoodsList: [
                    //{
                    //    Id: "",// 产品ID  
                    //    GoodsType: 0,//商品类型
                    //    GoodsCode: "",//产品编号
                    //    GoodsName: "",//产品名称
                    //    Price: 0,//零售价格
                    //    Specials: 0,//产品特价
                    //    Images: "",//产品图片
                    //    IsPoint: 0,//是否积分
                    //    PointType: 0,//积分方式
                    //    MinDiscount: 0,//最低折扣
                    //    IsDiscount: 0,//是否打折
                    //    Number: 0,//购买数量
                    //    Point: 0,//积分数量
                    //    GoodsClass: "",//商品分类
                    //    TotalMoney: 0,//折后金额
                    //    StockNum:0,//库存
                    //    IsModify:0是否修改价格
                    //}
                ]
            }
        ],
        VenueMoney: [//场地金额
            //{
            //    VenueID:"",//场馆ID
            //    TotalMoney: 0,//总金额
            //    DiscountMoney: 0,//实付金额
            //    TotalPoint: 0,//获得积分
            //}
        ],
        payMoneyInfo:{//结算信息
            TotalMoney :0,//总金额
            DiscountMoney :0,//实付金额
            TotalPoint :0,//获得积分
            GoodsNum: 0,//商品数量
            amountActivityMoney: 0,//活动减金额
            amountActivityPoint: 0//活动获得积分
        },
        choosedStaffAry: [//商品提成员工信息
            //{
            //    StaffId: "",//提成员工id
            //    StaffName:"",//提成员工名称
            //    CommissionMoney: 0.0,//自定义提成金额
            //    Remark: null//备注
            //}
        ],
        init: function () {
            var _this = this;
            _this.addMem();//添加会员
            _this.initClick();//点击事件
            _this.countProductNum(1);//计算每屏显示产品个数 type==1 场馆 ==2商品
            _this.GetVenueRegionList();//获取场馆区域列表
            _this.VenueRegionSlide();//场馆区域滑动
            _this.searchMemCard();//查询会员
            _this.editShopcarProduct();//编辑购物车产品
            new Promise(_this.GetStaffClassList.bind(_this))//获取提成员工
               .then(function (res) {
                   return new Promise(_this.GetStaffList.bind(_this))
               })
               .then(function (res) {
                   _this.chooseMembergetCommission()
               });
            pay.init();//支付
        },
        //点击事件
        initClick:function(){
            _this=this;
            /*清除获取的会员*/
            $("body").on("click",'.vip-delete img',function (e) {
                member = null;
                _this.BindMemVenue();
                http.cashierEnd.delMembers('.lomo-mian-left .vipInfo', 'member');
                $(".lomo-order").css({"top":"0","margin-top":"0"});
            });
            //搜索产品
            $(".search-product").on("click", function (e) {
                e.preventDefault()
                var val = $("#searchVal").val();
                _this.key = val;
                _this.countProductNum(2);
            })
            //切换无图模式
            $('.graph').on("click", function () {
                if (graph) {
                    $(this).html('关闭无图模式');
                    graph = false;
                } else if (!graph) {
                    $(this).html('开启无图模式');
                    graph = true;
                }
                _this.countProductNum(2);
            });
            //产品翻页 上一页
            $(".page-prev").on("click",function(){
                if(_this.pageIndex==1){
                    layer.msg("已经是第一页");
                    return;
                }else{
                    _this.pageIndex = _this.pageIndex-1;
                    _this.countProductNum(1);
                }
            });
            //产品翻页 下一页
            $(".page-next").on("click",function(){
                if(_this.pageIndex==proPageTotalNum){
                    layer.msg("已经是最后一页");
                    return;
                }else{
                    _this.pageIndex = _this.pageIndex+1;
                    _this.countProductNum(1);
                }
            });
            //场馆点击
            $("body").on("click",".goods-list .goods-info3",function(){
                var id = $(this).attr("data-id");
                var name = $(this).attr("data-name");
                var status = $(this).attr("data-status");
                var price = $(this).attr("data-price");
                var specials = $(this).attr("data-specials");
                _this.venue = {
                    Id: id,//场馆Id
                    name: name,//场馆名称
                    status: status,//场馆状态
                    price: price,//单价
                    specials: specials//特价
                };
                $(this).addClass("active").siblings().removeClass("active");
                //$(".goods-page span").hide().eq(1).show();
                //$(".venue_btn [data-type='ChangeVenue']").hide();//场地更换
                //$(".venue_btn [data-type='ModifyVenueState']").show();//场地状态
                //$(".venue_btn [data-type='Printing']").hide();//打印清单
                //$(".venue_btn [data-type='VenueUnionBill']").hide();//合并账单
                //0-维修 1-正常 2使用中 3待清台
                if (status == 0 || status == 3) {
                    _this.clearData();
                } else if (status == 1) {
                    $(".lomo-mian-left .venue-product-area,.lomo-mian-left .vipInfo,.lomo-mian-left .venue-area").show();
                    _this.BindOpenVenueHtml();
                } else if (status == 2) {
                    $(".lomo-mian-left .venue-product-area,.lomo-mian-left .vipInfo,.lomo-mian-left .venue-area").show();
                    _this.GetVenueOrderInfo(2);
                }
            });
            //场地更换,场地状态,合并账单
            $(".venue_btn").on("click", function () {
                var type = $(this).attr("data-type");
                _this.pageIndex = 1;
                if(_this.venue==null){
                    $.luck.error("请先选择场地");
                    return false;
                }
                if (type == "ChangeVenue") {//场地更换
                    if(_this.venue.status!=2){
                        $.luck.error("该场地状态不可进行此操作");
                        return false;
                    }
                    $("#hidChangedVenueID").val("");
                    $("#txtCurrentVenue").val(_this.venue.name);
                    _this.changedVenueType=1;
                    _this.BindVenueRegion(1);
                    cashier.open('.table-replacement', 'fadeIn', 'fadeOut', '.lomo-mask-body');
                }else if (type == "ModifyVenueState") {//场地状态
                    if(_this.venue.status==2){
                        $.luck.error("该场地状态不可进行此操作");
                        return false;
                    }
                    _this.ModifyVenueState();
                }else if (type == "VenueUnionBill") {//合并账单
                    if(_this.venue.status!=2){
                        $.luck.error("该场地状态不可进行此操作");
                        return false;
                    }
                    $("#hidmergeChangedVenueID").val("");
                    $("#txtmergeCurrentVenue").val(_this.venue.name);
                    _this.changedVenueType=2;
                    _this.BindVenueRegion(2);
                    cashier.open('.table-merge', 'fadeIn', 'fadeOut', '.lomo-mask-body');
                } else if (type = "Printing") {//打印清单
                    if (_this.venue.status != 2) {
                        $.luck.error("该场地状态不可进行此操作");
                        return false;
                    }
                    _this.PrintingVenueInfo();
                }
            });
            //选择更换场地选中事件
            $("body").on("click", ".check-list li", function () {
                var id = $(this).attr("data-id");
                if (_this.changedVenueType == 1) {
                    $("#hidChangedVenueID").val(id);
                } else {
                    $("#hidmergeChangedVenueID").val(id);
                }
                $(this).addClass("active").siblings().removeClass("active");
            });
            //确认场地更换
            $("#subChangedVenue").on("click", function () {
                _this.ChangeVenue();
            });
            //账单合并
            $("#subVenueUnionBill").on("click", function () {
                _this.VenueUnionBill();
            });
            //场地开台
            $("#btnOpenVenue").on("click", function () {
                _this.OpenVenue();
            });
            //场地切换到产品
            $("body").on("click", "#addProductVenue", function () {
                $(".venue-product-area").show();
                $(".venue-area").hide();
                _this.closePopup();
                _this.countProductNum(2);
                _this.BindVenueRestingHtml();
                _this.GetGoodsClassList();//获取商品分类
                _this.ClassSlide();//一级商品分类滑动
                _this.ClassTwoSlide();//二级商品分类滑动
            });
            //挂单产品切换到场地
            $("body").on("click", "#backVenue", function () {
                _this.SaveVenueRestingGoods();
            }); 
            //商品点击加入购物车
            $("body").on("click", ".goods-info", function () {
                var goodsData = JSON.parse($(this).attr("data-obj"));
                console.log(goodsData);
                var VenueGoods = {
                    Id: goodsData.Id,// 产品ID  
                    GoodsType: goodsData.GoodsType,//商品类型
                    GoodsCode: goodsData.GoodsCode,//产品编号
                    GoodsName: goodsData.GoodsName,//产品名称
                    Price: goodsData.Price,//零售价格
                    Specials: goodsData.Specials,//产品特价
                    Images: "",//产品图片
                    IsPoint: goodsData.IsPoint,//是否积分
                    PointType: goodsData.PointType,//积分方式
                    MinDiscount: goodsData.MinDiscount,//最低折扣
                    IsDiscount: goodsData.IsDiscount,//是否打折
                    Number: 1,//购买数量
                    Point: 0,//积分数量
                    GoodsClass: goodsData.GoodsClass,//商品分类
                    TotalMoney: 0,//折后金额
                    StockNum: goodsData.StockNum,//库存
                    IsModify: 0//是否修改价格
                };
                var flag = 0;

                //获取购物车中该商品已有数量
                var goodsNumber = 0;
                $.each(_this.orderVenueDetailList, function (index, item) {
                    var number = Enumerable.From(item.VenueGoodsList).Where(function (x) {
                        if (x.Id == VenueGoods.Id) {
                            return true;
                        }
                        return false;
                    }).Sum(function (x) {
                        return x.Number;
                    });
                    goodsNumber += parseFloat(number);
                });

                //判断购物车中是否存在
                $.each(_this.orderVenueDetailList, function (index,item) {
                    if (item.IsMainVenue == 1) {
                        if (item.VenueGoodsList.length > 0) {
                            $.each(item.VenueGoodsList, function (inx, itm) {
                                //判断购物车中是否存在 且未被修改价格
                                if (itm.Id == VenueGoods.Id && itm.IsModify == 0) {
                                    flag = 1;
                                    var num = accAdd(goodsNumber, 1);
                                    if (num > itm.StockNum && itm.GoodsType == 1) {
                                        flag = 2;
                                        $.luck.error("产品库存不足");
                                        return false;
                                    }
                                    itm.Number = accAdd(itm.Number, 1);
                                    return false;
                                }
                            })
                        }
                        if (item.VenueGoodsList.length == 0 || flag == 0) {
                            item.VenueGoodsList.push(VenueGoods);
                        }
                        return false;
                    }
                })
                
                if (flag != 2) {
                    _this.BindVenueRestingHtml();
                }
            });
            //购物车增加数量
            $("body").on("click", ".order-add", function () {
                var dl = $(this).parent().parent();
                var goodId = $(dl).attr("data-id");
                var stocknum = $(dl).attr("data-stocknum");
                var gid = $(dl).attr("data-gid");
                var flag = 1;
                //获取购物车中该商品已有数量
                var goodsNumber = 0;
                $.each(_this.orderVenueDetailList, function (index, item) {
                    var number = Enumerable.From(item.VenueGoodsList).Where(function (x) {
                        if (x.Id == goodId) {
                            return true;
                        }
                        return false;
                    }).Sum(function (x) {
                        return x.Number;
                    });
                    goodsNumber += parseFloat(number);
                });

                $.each(_this.orderVenueDetailList, function (index,item) {
                    if (item.IsMainVenue == 1) {
                        $.each(item.VenueGoodsList, function (inx, itm) {
                            if (itm.Id == goodId && itm.GID == gid) {
                                var num = accAdd(goodsNumber, 1);
                                if (num > stocknum && itm.GoodsType == 1) {
                                    flag = 2;
                                    $.luck.error("产品库存不足");
                                    return false;
                                }
                                itm.Number = accAdd(itm.Number, 1);
                                return false;
                            }
                        })
                        return false;
                    }
                })
                if (flag != 2) {
                    _this.BindVenueRestingHtml();
                }
            });
            //购物车减少数量
            $("body").on("click", ".order-reduce", function () {
                var dl = $(this).parent().parent();
                var goodId = $(dl).attr("data-id");
                var gid = $(dl).attr("data-gid");
                $.each(_this.orderVenueDetailList, function (index, item) {
                    if (item.IsMainVenue == 1) {
                        $.each(item.VenueGoodsList, function (inx, itm) {
                            if (itm.Id == goodId && itm.GID == gid) {
                                var num = accSub(itm.Number, 1);
                                if (num == 0) {
                                    item.VenueGoodsList.splice(inx, 1);
                                    return false;
                                }
                                itm.Number = num;
                                return false;
                            }
                        })
                        return false;
                    }
                })
                _this.BindVenueRestingHtml();
            });
            //套餐商品 返回产品列表
            $(".change-product-nav").on("click", function () {
                var type = $(this).attr("data-type");
                _this.pageIndex = 1;
                if (type == "setmeal") {
                    _this.searchType = 2;
                    $(".venue-product-area .classify-nav-box").hide();
                    $(".back-product").show();
                } else if (type == "normal") {
                    _this.searchType = 1;
                    $(".venue-product-area .classify-nav-box").show();
                    $(".back-product").hide();
                }
                _this.countProductNum(2);
            })

            //刷新计价
            $("#btnRefreshMoney").on("click", function () {
                _this.GetVenueOrderInfo(2);
            });

            //立即结账
            //$("body").on("click", "#btnVenueConsume", function () {
            //    _this.Pay();
            //});

            //关闭弹出框
            $(".divTitle span").on("click", function () {
                var box = $(this).parent().parent();
                cashier.close(box, 'fadeIn', 'fadeOut', '.lomo-mask-body');
            });
            $("body").on("click",".submit-bt-clear", function () {
                var box = $(this).parents('.fadeIn');
                cashier.close(box, 'fadeIn', 'fadeOut', '.lomo-mask-body');
            });
        },
        //计算每屏显示产品个数 type==1场馆 ==2商品
        countProductNum: function (type) {
            if (type == 1) {
                Y = Math.floor(proboxHeight / 140)
            } else {
                if (!graph) {
                    Y = Math.floor(proboxHeight / 120)
                } else {
                    Y = Math.floor(proboxHeight / 226)
                }
            }
            if (proboxWidth >= 1352) {
                X = 6;
            } else if (proboxWidth < 1352 && proboxWidth >= 1230) {
                X = 5;
            } else if (proboxWidth < 1230 && proboxWidth >= 984) {
                X = 4;
            } else if (proboxWidth < 984 && proboxWidth >= 738) {
                X = 3;
            } else if (proboxWidth < 738 && proboxWidth >= 492) {
                X = 2;
            } else if (proboxWidth < 492 && proboxWidth >= 246) {
                X = 1;
            }
            this.pageSize = X * Y;
            if (type == 1) {
                this.GetVenueInfoPage();
            } else if (type == 2) {
                this.GetGoodsListPage();
            }
        },
        /*新增会员 */
        addMem:function(){
            $(".lomo-shopBar .add-bt").on("click", function () {
                $(this).blur();
                layer.open({
                    type: 2,
                    id: "addhMemCard",
                    title: '新增会员',
                    closeBtn: 1,
                    shadeClose: true,
                    shade: 0.3,
                    maxmin: false,//禁用最大化，最小化按钮
                    resize: false,//禁用调整大小
                    move: false,//禁止拖拽
                    area: ['940px', '740px'],
                    skin: "lomo-ordinary",
                    btnAlign: "r",
                    content: '../../../Areas/Model/Home/addMember.html',
                    success: function (layero, index) {
                        this.enterEsc = function (event) {
                            if (event.keyCode === 27) {
                                layer.close(index);
                                return false;
                            }
                        };
                        $('body').on('keydown', this.enterEsc);    //监听键盘事件，关闭层
                    }
                })
            })

            $("body").on("click",".submit-bt-clear", function () {
                var box = $(this).parents('.fadeIn');
                cashier.close(box, 'fadeIn', 'fadeOut', '.lomo-mask-left');
            });
        },
        //获取场馆区域列表
        GetVenueRegionList: function() {
            var _this = this;
            $.http.post(LuckVipsoft.api.GetVenueRegionList, {}, user.token, function(res) {
                var html = '';
                html += '<a class="active" data-regionId="" href="javascript:void(0);">全部</a>';
                if (res.data && res.data.length > 0) {
                    $.each(res.data, function(index, item) {
                        html += '<a data-regionId="' + item.Id + '" onclick="" href="javascript:void(0);" class="lomo-classList">' + item.RegionName + '</a>'
                    })
                }
                $(".venue-area .classify-nav").html(html);
                $(".venue-area .classify-nav a").on("click", function () {
                    var Id = $(this).attr("data-regionId");
                    var curCls = $(this).attr("class");
                    _this.regionId = Id;
                    _this.pageIndex = 1;
                    _this.GetVenueInfoPage();
                    $(this).addClass("active").siblings().removeClass("active");
                })
                $(".venue-area .classify-nav .lomo-classList").each(function () { //计算菜单长度
                    length += parseFloat($(this).css("width").split('px')[0]) + 30;
                });
                if (length > 450) {
                    $(".venue-area .classify-nav-box .scroll-view").addClass('lomo-scroll-view')
                } else {
                    $(".venue-area .classify-nav-box .scroll-view").css({ "width": length })
                };
                $(".venue-area .classify-nav").css({ "width": length + "px" });
            })
        },
        //场馆区域菜单滑动
        VenueRegionSlide: function () {
            var _x = 85;//每次滑动的距离
            var move = 0;
            $(".venue-area .classify-nav-box .triangle_border_right").on("click", cashier.throttle(function () {
                var x = parseFloat($(".venue-area .classify-nav").css("marginLeft").split('px')[0]);//当前位置
                var width = parseFloat($(".venue-area .classify-nav").css("width").split("px")[0]);//总长度
                var viewport = parseFloat($(".venue-area .classify-nav-box .scroll-view").css("width").split('px')[0]);//可视窗口宽度
                if (width < viewport) { //当菜单长度小于可视宽度时，禁止向右移动
                    return false;
                } else {
                    if (x - _x - viewport < -width) {
                        move = -(width - viewport - 40);
                    } else {
                        move = x - _x;
                    };
                    $(".venue-area .classify-nav").css({ "marginLeft": move });
                };
            }, 150, 200));
            $(".venue-area .classify-nav-box .triangle_border_left").on("click", function () {
                var x = parseFloat($(".venue-area .classify-nav").css("marginLeft").split('px')[0]);//当前位置
                if (x + _x > 0) {
                    move = 0;
                } else {
                    move = x + _x;
                }
                $(".venue-area .classify-nav").css({ "marginLeft": move })
            });
        },
        //获取场馆列表
        GetVenueInfoPage:function(){
            var _this=this;
            var param = {
                Page: _this.pageIndex,
                Rows: _this.pageSize,
                RegionID: _this.regionId
            }
            _this.venue = null;
            $.http.post(LuckVipsoft.api.GetVenueInfoPage, param, user.token,function(res){
                if(res.status==1&&res.data.list&&res.data.list.length>0){
                    proPageTotalNum = Math.ceil(accDiv(res.data.total,_this.pageSize));
                    var html = '';
                    $.each(res.data.list,function(index,item){
                        var css = "";
                        var state="";
                        var style="";
                        if (item.VenueStatus == 0) {
                            state = "维修";
                            css = "consum-orange";
                        } else if (item.VenueStatus == 1) {
                            state = "空闲";
                            css = "consum-white";
                            style = "color:#000";
                        } else if (item.VenueStatus == 2) {
                            state = "已开启";
                            css = "consum-green";
                        } else if (item.VenueStatus == 3) {
                            state = "待清台";
                            css = "consum-blue";
                        }
                        html+='<div class="goods-info3 venue-box '+css+'" data-id="'+item.Id+'" data-name="'+item.VenueName+'" data-status="'+item.VenueStatus+'" data-price="'+item.Price+'" data-specials="'+item.Specials+'" >';
                        html += '<div><span style="' + style + '">' + item.VenueName + '</span></div>';
                        html += '<div><span style="' + style + '">' + state + '</span></div>';
                        if(item.VenueStatus == 2){
                            html += '<div><span>' + item.CardName + ' ' + item.CardID + '</span>';
                            //html += '<span style="float: right">1小时30分</span>';
                            html += '</div>';
                        }
                        html+='</div>';
                    })
                    $(".goods-list").html(html);
                    $(".page-prev,.page-next").removeAttr("disabled");
                    $(".goods-info3").css({"width":proboxWidth/X-50+"px"});

                }else{
                    $(".goods-list").html('');
                    $(".page-prev,.page-next").attr({"disabled":"disabled"});
                }
                $(".goods-page .numb").html(_this.pageIndex+"/"+proPageTotalNum);
            })
        },
        //获取所有产品分类菜单
        GetGoodsClassList: function () {
            var _this = this;
            $.http.post(LuckVipsoft.api.GetGoodsClassList, {}, user.token, function (res) {
                var html = "";
                var length = 0;
                html += '<a class="active" data-classId="0" href="javascript:void(0);" class="lomo-classList">全部</a>';
                if (res.data && res.data.length > 0) {
                    $.each(res.data, function (index, item) {
                        if (item.ParentID == '0') {
                            _this.parent.push(item)
                            html += '<a data-classId="' + item.Id + '" onclick="" href="javascript:void(0);" class="lomo-classList">' + item.ClassName + '</a>'
                        } else {
                            _this.children.push(item)
                        }
                    });
                    $.each(_this.parent, function (index, item) {
                        _this.parent[index].children = []
                        $.each(_this.children, function (index2, item2) {
                            if (item2.ParentID == item.Id) {
                                _this.parent[index].children.push(item2)
                            };
                        });
                    });
                }
                $(".venue-product-area .classify-nav").html(html);
                $(".venue-product-area .classify-nav a").on("click", function () {
                    var Id = $(this).attr("data-classId");
                    var curCls = $(this).attr("class");
                    var top = $(this).position().top;
                    var left = $(this).position().left;
                    var i = $(this).index();
                    if (Id == 0) {
                        $(".venue-product-area .leaveltwo-nav-box").hide();
                        _this.classId = '';
                        _this.pageIndex = 1;
                        _this.GetGoodsListPage();
                    } else {
                        _this.GetGoodsClassTwo(Id, curCls, i, {
                            top: top,
                            left: left
                        });
                    }
                    $(this).addClass("active").siblings().removeClass("active");
                })
                $(".venue-product-area .classify-nav .lomo-classList").each(function () { //计算菜单长度
                    length += parseFloat($(this).css("width").split('px')[0]) + 30;
                });
                if (length > 450) {
                    $(".venue-product-area .classify-nav-box .scroll-view").addClass('lomo-scroll-view')
                } else {
                    $(".venue-product-area .classify-nav-box .scroll-view").css({ "width": length })
                };
                $(".venue-product-area .classify-nav").css({ "width": length + "px" });
            })
        },
        //获取二级菜单
        GetGoodsClassTwo: function (parentId, curCls, index, offset) {
            var _this = this;
            var html = '';
            var length = 0
            html += '<a class="active" data-classId="' + parentId + '" href="javascript:void(0);">全部</a>';
            if (_this.parent[index - 1].children.length > 0) {
                $(".venue-product-area .scroll-view-two").css({ "width": 9999 }); //初始化长度
                $.each(_this.parent[index - 1].children, function (index, item) {
                    html += '<a data-classId="' + item.Id + '" href="javascript:void(0);" class="lomo-classListTwo">' + item.ClassName + '</a>';
                });
                $(".venue-product-area .scroll-view-two").empty();
                html = '<div class="type classify-nav-two">' + html + '</div>'
                $(".venue-product-area .scroll-view-two").html(html);
                if (curCls.indexOf('active') != -1) {
                    $(".venue-product-area .leaveltwo-nav-box").toggle();
                } else {
                    $(".venue-product-area .leaveltwo-nav-box").show();
                }
                $(".venue-product-area .classify-nav-two a").each(function () { //计算菜单长度
                    length += parseFloat($(this).css("width").split('px')[0]) + 30;
                });
                if (length > 450) {
                    $(".venue-product-area .scroll-view-two").css({ "width": 450 });
                } else {
                    $(".venue-product-area .scroll-view-two").css({ "width": length }); //如果菜单长度小于450px，则让视口长度为菜单长度
                };
            } else {
                $(".venue-product-area .leaveltwo-nav-box").hide();
                _this.classId = parentId;
                _this.GetGoodsListPage();
            }
            $(".venue-product-area .classify-nav-two").css({ "width": length + "px" });
            var width = parseFloat($(".scroll-view-two").css("width").split("px")[0]);
            $(".venue-product-area .leaveltwo-nav-box").css({ 'top': offset.top + 30, 'left': offset.left - width / 2 });
            $(".venue-product-area .classify-nav-two a").on("click", function () {
                _this.classId = $(this).attr("data-classId");
                _this.pageIndex = 1;
                _this.GetGoodsListPage();
                $(".venue-product-area .leaveltwo-nav-box").hide();
            })
        },
        //一级菜单滑动
        ClassSlide: function () {
            var _x = 85;//每次滑动的距离
            var move = 0;
            $(".venue-product-area .classify-nav-box .triangle_border_right").on("click", cashier.throttle(function () {
                var x = parseFloat($(".venue-product-area .classify-nav").css("marginLeft").split('px')[0]);//当前位置
                var width = parseFloat($(".venue-product-area .classify-nav").css("width").split("px")[0]);//总长度
                var viewport = parseFloat($(".venue-product-area .classify-nav-box .scroll-view").css("width").split('px')[0]);//可视窗口宽度
                if (width < viewport) { //当菜单长度小于可视宽度时，禁止向右移动
                    return false;
                } else {
                    if (x - _x - viewport < -width) {
                        move = -(width - viewport - 40);
                    } else {
                        move = x - _x;
                    };
                    $(".venue-product-area .classify-nav").css({ "marginLeft": move });
                };
            }, 150, 200));
            $(".venue-product-area .classify-nav-box .triangle_border_left").on("click", function () {
                var x = parseFloat($(".venue-product-area .classify-nav").css("marginLeft").split('px')[0]);//当前位置
                if (x + _x > 0) {
                    move = 0;
                } else {
                    move = x + _x;
                }
                $(".venue-product-area .classify-nav").css({ "marginLeft": move })
            });
        },
        //二级菜单滑动
        ClassTwoSlide: function () {
            var _x = 85;//每次滑动的距离
            var move = 0;
            $(".venue-product-area .leaveltwo-nav-box .triangle_border_right").on("click", cashier.throttle(function () {
                var x = parseFloat($(".venue-product-area .classify-nav-two").css("marginLeft").split('px')[0]);//当前位置
                var width = parseFloat($(".venue-product-area .classify-nav-two").css("width").split("px")[0]);//总长度
                console.log($(".venue-product-area .scroll-view-two").css("width"))
                var viewport = parseFloat($(".scroll-view-two").css("width").split('px')[0]);//可视窗口宽度
                if (width < viewport) { //当菜单长度小于可视宽度时，禁止向右移动
                    return false;
                } else {
                    if (x - _x - viewport < -width) {
                        move = -(width - viewport);
                    } else {
                        move = x - _x;
                    };
                    $(".venue-product-area .classify-nav-two").css({ "marginLeft": move });
                };
            }, 150, 200));
            $(".venue-product-area .leaveltwo-nav-box .triangle_border_left").on("click", function () {
                var x = parseFloat($(".venue-product-area .classify-nav-two").css("marginLeft").split('px')[0]);//当前位置
                if (x + _x > 0) {
                    move = 0;
                } else {
                    move = x + _x;
                }
                $(".venue-product-area .classify-nav-two").css({ "marginLeft": move })
            });
        },
        //获取商品列表
        GetGoodsListPage:function(){
            var _this=this;
            var param = {
                Page: _this.pageIndex,
                Rows: _this.pageSize,
                MemID: "",
                Key: _this.key,//扫码时商品条码
                Type: _this.searchType,//1产品 2套餐 3计次 4扫码
                ClassID: _this.classId
            }
            $.http.post(LuckVipsoft.api.GetCashierGoodsListPage, param, user.token, function (res) {
                proPageTotalNum = Math.ceil(accDiv(res.data.total, _this.pageSize));
                var html = '';
                if (res.data.list && res.data.list.length > 0) {
                    $.each(res.data.list, function (index, item) {
                        var imagesUrl = '', data = JSON.stringify(item);
                        if (!item.Images) {//不存在产品图时，使用默认图
                            imagesUrl = '../../../Theme/images/goodsPic.png'
                        } else {
                            imagesUrl = user.information.ImageServerPath + item.Images;
                        }
                        html += '<div class="goods-info" data-obj=\'' + data + '\' data-stocknum="' + item.StockNum + '">';
                        html += '<div class="goods-info-img"><img src="' + imagesUrl + '" /></div>';
                        if (item.GoodsType == 1) {//普通产品
                            html += '<h1>' + item.GoodsName + '</h1>';
                            html += '<span><i class="colorIcon blue">库</i><b>' + item.StockNum + '</b><small>¥' + item.Price + '</small></span>';
                        } else if (item.GoodsType == 2) {//服务
                            html += '<h1>' + item.GoodsName + '</h1>';
                            html += '<span><i class="colorIcon green">服</i><small>¥' + item.Price + '</small></span>';
                        } else if (item.GoodsType == 5) {//套餐
                            html += '<h1 class="pointer">'+item.GoodsName+'</h1>';
                            html += '<span><i class="colorIcon red">套</i><small>¥' + item.Price + '</small></span>';
                            //html += '<div class="goods-info-box hide"><dl><dt></dt><dd>';
                            //html += '<table width="100%" class="dataTable">';
                            //html += '<tr><th>产品编码</th><th>产品内容</th><th>产品单价</th></tr>';
                            //html += '<tr><td>${item.GoodsCode}</td><td>${backProductName(item.ComboDetail)}</td><td>${item.Price}</td></tr>';
                            //html += '</table>';
                            //html += '<div class="info-box-bt"><button type="button" class="submit-bt-clear hide">取消</button>';
                            //html += '<button type="button" class="submit-bt close-goodsinfo">确认</button></div></dd></dl></div>';
                        }
                        html += '</div>';
                    })
                    $(".product-list").html(html);
                    $(".page-prev,.page-next").removeAttr("disabled");
                    if (graph) { $(".goods-info-img").show() } else { $(".goods-info-img").hide() }
                    $(".goods-info").css({ "width": proboxWidth / X - 46 + "px" });
                } else {
                    $(".product-list").html('');
                    $(".page-prev,.page-next").attr({ "disabled": "disabled" });
                }
                $(".goods-page .numb").html(_this.pageIndex + '/' + proPageTotalNum);
            })
        },
        //获取店铺优惠活动 (有会员时会返回会员可用)
        getShopActivity: function () {
            var _this = this;
            var param = {
                ActType: 1,//1-消费返利、2-充值有礼
                MemID: member == null ? "" : member.Id,
            }
            $.http.post(LuckVipsoft.api.getActivityList, param, user.token, function (res) {
                if (res.data.length > 0) {					
                    hasShopAcivity = true;				
                    $(".order-select").html("请选择优惠活动").next().removeClass("gray")
                    var html = template("activityTmp",res.data);   
                    $('.check-box-list').html(html)
                    $(".activity-list").hide();

                    //选择优惠活动
                    $(".order-select").unbind().bind('click',function(){
                        if (hasShopAcivity) {
                            $(".activity-list").toggle();
                        }
                    })

                    //选择项
                    $(".check-box-list li").unbind().bind('click',function(){					
                        var act=$(this).attr("data-obj");	
                        var result	= _this.selectActivity(act)  // .chooseActivity(act)						
                        if (result) {
                            _this.BindActivity();
                        }
                        else
                        {
                            $.luck.error("未达到活动规则")
                        }	
                    })
                } else {
                    hasShopAcivity = false;
                    $(".order-select").html("暂无优惠活动")
                    $(".activity-list").hide();
                }
            })
        },
        //优惠券是否可以使用（店铺和会员接口已经过滤）->判断可用时间、生日优惠策略、全局配置
        //1-生日优先、2-系统活动优先、3-系统活动上叠加
        //opt选择取消 true,false
        selectActivity: function (activity) {
            var _this = this
            activity =JSON.parse(activity)
            if(activity.ValidType == 4 && _this.chooseBirthdayActivity.Id ==activity.Id)
            {
                _this.chooseBirthdayActivity={}
                _this.setpActivity()
                return true
            }
            else if(_this.chooseActivity.Id ==activity.Id)
            {
                _this.chooseActivity={}
                _this.setpActivity()
                return true
            }
            // 生日活动使用规则：1-生日优先、2-系统活动优先、3-系统活动上叠加
            var birthdayActivityRule = user.sysArgument.BirthdayActivityRule;
            var currentPrice = _this.payMoneyInfo.DiscountMoney;
 
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
                    if (birthdayActivityRule != 3) { _this.chooseActivity = {} }   //全局
                    _this.chooseBirthdayActivity = activity
                    _this.setpActivity()
                    return true
                }           
            }
            else
            {             
                if (birthdayActivityRule != 3) { _this.chooseBirthdayActivity = {} } //全局
                _this.chooseActivity = activity
                _this.setpActivity()
                return true
            }     
        },

        //查询选择会员
        searchMemCard: function () {
            var _this = this;
            $("#search").on("click", function (e) {
                e.preventDefault()
                var value = $("#barCode").val();
                if (!value.match(/^\s*$/)) {
                    var param = {
                        SearchCriteria: value,
                        Type: 0
                    }
                    $.http.post(LuckVipsoft.api.SearchMemCardList, param, user.token, function (res) {
                        if (res.status == 1) {
                            if (res.data.length == 1) {
                                http.cashierEnd.seleMembers(res.data[0], user.information.ImageServerPath, '.lomo-mian-left .vipInfo')
                                member = res.data[0];
                                _this.GetVenueOrderInfo(1);
                                $(".timescount").show();
                                $(".lomo-order").css({"top":"84px","margin-top":"11px"});
                            } else {
                                layer.open({
                                    type: 1,
                                    id: "searchMemCard",
                                    title: '会员搜索',
                                    closeBtn: 1,
                                    shadeClose: false,
                                    shade: 0.3,
                                    maxmin: false,//禁用最大化，最小化按钮
                                    resize: false,//禁用调整大小
                                    area: ['90%', '80%'],
                                    btn: ['确认', '清除'],
                                    skin: "lomo-ordinary",
                                    btnAlign: "r",
                                    content: $("#lomo-members-search"),
                                    yes: function (index, layero) {
                                        var $searchMem = $('.lomo-members-search');
                                        var $tr = $searchMem.find('#memList').find('tr');
                                        if ($tr.length > 0) {
                                            $tr.each(function () {
                                                if ($(this).hasClass('lomo-mem-list')) {
                                                    var _index = $(this).index()
                                                    console.log(res.data[_index])
                                                    http.cashierEnd.seleMembers(res.data[_index], user.information.ImageServerPath, '.lomo-mian-left .vipInfo')
													
                                                    member = res.data[_index];
                                                    _this.GetVenueOrderInfo(1);
                                                    $(".lomo-order").css({"top":"84px","margin-top":"11px"});
                                                }
                                            });
                                            $(".timescount").show();
                                            layer.msg('操作成功')
                                            layer.close(index)
                                        } else {
                                            layer.msg(LuckVipsoft.lan.ER0022)
                                        }
                                    },
                                    btn2: function (index, layero) {
                                        var $searchMem = $('.lomo-members-search');
                                        $searchMem.find('#memList').html('');
                                        return false; 
                                    },
                                    success: function (layero, index) {
                                        var $searchMem = $('.lomo-members-search');
                                        var html = '';
                                        for (i = 0; i < res.data.length; i++) {
                                            if (i == 0) {
                                                html += '<tr class="lomo-mem-list">';
                                            } else {
                                                html += '<tr >';
                                            }
                                            html += '<td>' + res.data[i].CardID + '</td>';
                                            html += '<td>' + res.data[i].CardName + '</td>';
                                            html += '<td>' + res.data[i].Mobile + '</td>';
                                            html += '<td>' + res.data[i].LevelName + '</td>';
                                            html += '<td>' + res.data[i].Point + '</td>';
                                            html += '<td>¥' + res.data[i].RemainingCount + '</td>';
                                            html += '</tr>';
                                        };
                                        $searchMem.find('#memList').html(html);
                                        $searchMem.find('input').focus().val(value)
                                        /*搜索 */
                                        $('.lomo-members-search #memberSearch').on('click', function (e) {
                                            e.preventDefault();
                                            var _value = $(this).parent().prev().find('input').val()
                                            if (!value.match(verify.empty[0])) {
                                                var param = {
                                                    Type: 1,
                                                    SearchCriteria: _value
                                                }
                                                $.http.post(LuckVipsoft.api.SearchMemCardList, param, $.session.get('Cashier_Token'), function (res) {
                                                    if (res.status == 1) {
                                                        var html = '';
                                                        user.data = res.data
                                                        for (i = 0; i < res.data.length; i++) {
                                                            if (i == 0) {
                                                                html += '<tr class="lomo-mem-list">';
                                                            } else {
                                                                html += '<tr >';
                                                            }
                                                            html += '<td>' + res.data[i].CardID + '</td>';
                                                            html += '<td>' + res.data[i].CardName + '</td>';
                                                            html += '<td>' + res.data[i].Mobile + '</td>';
                                                            html += '<td>' + res.data[i].LevelName + '</td>';
                                                            html += '<td>' + res.data[i].Point + '</td>';
                                                            html += '<td>¥' + res.data[i].RemainingCount + '</td>';
                                                            html += '</tr>';
                                                        };
                                                        $searchMem.find('#memList').html(html);
                                                    }
                                                })
                                            } else {
                                                $.luck.error(LuckVipsoft.lan.ER0021)
                                            }
                                        });
			
                                        $('.lomo-members-search #memList').on('click', 'td', function () {
                                            $(this).parent().addClass('lomo-mem-list').siblings().removeClass('lomo-mem-list')
                                        });
                                    },
                                    end:function(){
                                        //销毁事件
                                        $('.lomo-members-search #memList').unbind();
                                        $('.lomo-members-search #search').unbind();
                                    }
                                })
                            }
                        }
                    })
                }
            });
        },
        //绑定区域下拉
        BindVenueRegion:function(type){
            var _this = this;
            $.http.post(LuckVipsoft.api.GetVenueRegionList, {}, user.token, function(res) {
                var html = '';
                html += '<option value="">全部</option>';
                if (res.data && res.data.length > 0) {
                    $.each(res.data, function(index, item) {
                        html += '<option value="'+item.Id+'">'+item.RegionName+'</option>';
                    })
                }
                $(".selChangedRegion").html(html);
                _this.GetVenueInfoSelList(type,"");
                form.render("select");

                //下拉选择
                form.on('select(filterChangedRegion)', function (data) {
                    var regionId = data.value;
                    if(_this.changedVenueType==1){
                        $("#hidChangedVenueID").val("");
                    }else{
                        $("#hidmergeChangedVenueID").val("");
                    }
                    _this.GetVenueInfoSelList(type,regionId);
                });
            })
        },
        //获取选择场馆列表 RegionID 区域ID  Type 查询标识 1空闲 2已开台
        GetVenueInfoSelList:function(type,regionId){
            var _this = this;
            var param = {
                Type: type,
                RegionID: regionId
            }
            $.http.post(LuckVipsoft.api.GetVenueInfoSelList, param, user.token, function(res) {
                var html="";
                if(res.status==1){
                    $.each(res.data,function(index,item){
                        html+='<li data-id="'+item.Id+'">'+item.VenueName+'</li>';
                    })
                }
                if(_this.changedVenueType==1){
                    $(".replacementCheck-list").html(html);
                }else{
                    $(".mergeCheck-list").html(html);
                }
            })
        },
        //场地更换
        ChangeVenue:function(){
            var _this=this;
            var venueId=$("#hidChangedVenueID").val();
            if(venueId==""){
                $.luck.error("请先选中更换后的场地");
                return;
            }
            if(venueId==_this.venue.Id){
                $.luck.error("当前场地不可与更换后的场地相同");
                return;
            }
            var param = {
                CurrentVenueID: _this.venue.Id,
                ChangedVenueID: venueId
            }
            $.http.post(LuckVipsoft.api.ChangeVenue, param, user.token, function(res) {
                if(res.status==1){
                    _this.countProductNum(1);
                    _this.clearData();
                    $.luck.success();
                }else{
                    $.luck.error(res.msg);
                }
            })
        },
        //场地状态变更
        ModifyVenueState:function(){
            var _this=this;
            var str="";
            var type=1;
            //0-维修 1-正常 2使用中 3待清台
            if(_this.venue.status==0){
                type=1;
                str="是否确定由维修状态变更为空闲？";
            }else if(_this.venue.status==1){
                type=2;
                str="是否确定由空闲状态变更为维修？";
            }else if(_this.venue.status==2){
                $.luck.error("已开台的场地不可更改状态");
                return false;
            }else if(_this.venue.status==3){
                type=3;
                str="是否确定由待清台状态变更为空闲？";
            }
            var param = {
                Type: type,
                VenueID: _this.venue.Id
            }
            $.luck.confirm(str,function(index){
                $.http.post(LuckVipsoft.api.ModifyVenueState, param, user.token, function(res) {
                    if(res.status==1){
                        _this.countProductNum(1);
                        _this.clearData();
                        $.luck.success(function(){
                            layer.close(index);
                        });
                    }else{
                        $.luck.error(res.msg);
                    }
                })
            })
        },
        //账单合并
        VenueUnionBill:function(){
            var _this=this;
            var venueId=$("#hidmergeChangedVenueID").val();
            if(venueId==""){
                $.luck.error("请先选中合并后的主场地");
                return;
            }
            if(venueId==_this.venue.Id){
                $.luck.error("当前场地不可与合并后的场地相同");
                return;
            }
            var param = {
                MainVenueID: _this.venue.Id,
                UnionVenueID: venueId
            }
            $.http.post(LuckVipsoft.api.VenueUnionBill, param, user.token, function(res) {
                if(res.status==1){
                    _this.countProductNum(1);
                    _this.clearData();
                    $.luck.success();
                }else{
                    $.luck.error(res.msg);
                }
            })
        },
        //场地开台
        OpenVenue: function () {
            var _this = this;
            if (_this.venue == null) {
                $.luck.error("请先选择场地");
                return false;
            }
            var str = "";
            var memberId = "";
            if (member == null) {
                str = "是否确认使用散客开台【"+_this.venue.name+"】？";
            } else {
                str = "是否确认会员【" + member.CardName + "】开台【" + _this.venue.name + "】？";
                memberId = member.Id;
            }
            var param = {
                VenueID: _this.venue.Id,
                MemID: memberId
            };
            $.luck.confirm(str, function (index) {
                $.http.post(LuckVipsoft.api.OpenVenue, param, user.token, function (res) {
                    if (res.status == 1) {
                        _this.countProductNum(1);

                        var detail = res.data.detail;

                        var orderVenueDetail = {
                            Id: detail.Id,//场馆消费订单详情ID
                            MainID: detail.MainID,//主开台ID
                            VenueID: detail.VenueID,//场馆ID
                            VenueName: detail.VenueName,//场馆名称
                            Price: detail.Price,//单价
                            Specials: detail.Specials,//会员特价
                            VenueStatus: 2,//1-正常 0-维修 2-使用 3待清台
                            StartTime: detail.StartTime,//计时产品开始时间
                            EndTime: detail.EndTime,//计时产品结束时间
                            IsMainVenue: 1,//是否主场馆
                            VenueGoodsList:[]
                        }
                        _this.orderVenueDetailList = [];
                        _this.orderVenueDetailList.push(orderVenueDetail);
                        //场地金额
                        _this.VenueMoney = [];
                        _this.VenueMoney.push({
                            VenueID: detail.VenueID,//场馆ID
                            TotalMoney: 0.00,//总金额
                            DiscountMoney: 0.00,//实付金额
                            TotalPoint: 0.00,//获得积分
                        });
                        _this.countdown = 120;
                        _this.BindConsumeVenueHtml();

                        $.luck.success(function () {
                            layer.close(index);
                        });
                    } else {
                        $.luck.error(res.msg);
                    }
                })
            })
        },
        //打印清单
        PrintingVenueInfo: function () {
            var _this = this;
            if (_this.venue == null) {
                $.luck.error("请先选择场地");
                return false;
            }
            $.http.post(LuckVipsoft.api.GetVenueCreateTicketMsg, { VenueID: _this.venue.Id }, user.token, function (res) {
                if (res.status == 1) {
                    console.log(res.data);
                    //打印小票
                    TicketPrint(JSON.stringify(res.data), 5);
                } else {
                    $.luck.error(res.msg);
                }
            })
        },
        //取单 type==1 会员取单 type==2场地取单
        GetVenueOrderInfo: function (type) {
            var _this = this;
            _this.closePopup();
            var url = "";
            var param = {};
            if (type == 1) {
                if (member == null) {
                    $.luck.error("请先选择会员");
                    return false;
                }
                url = LuckVipsoft.api.GetVenueMemberAndGoodsInfoByMemID;
                param = {
                    MemID: member.Id
                }
            } else {
                if (_this.venue == null) {
                    $.luck.error("请先选择场地");
                    return false;
                }
                url = LuckVipsoft.api.GetVenueMemberAndGoodsInfoByVenueID;
                param = {
                    VenueID: _this.venue.Id
                }
            }

            $.http.post(url, param, user.token, function (res) {
                if (type == 1) {
                    if (res.status == 2) {
                        _this.BindMemVenue();
                        return false;
                    }
                }
                if (res.status == 1) {
                    member = res.data.memInfo;
                    _this.orderVenueDetailList = [];
                    _this.orderVenueDetailList = res.data.venueList;
                    _this.VenueMoney = res.data.venuePayMoneyList;

                    _this.BindConsumeVenueHtml();
                    //$.luck.success();
                } else {
                    $.luck.error(res.msg);
                }
            })
        },
        //挂单保存
        SaveVenueRestingGoods: function () {
            var _this = this;
            var venueRG = _this.venueRestingGoods;
            //场馆信息
            var Venue = {
                Id: venueRG.Id,
                VenueID: venueRG.VenueID,
                VenueName: venueRG.VenueName,
                Price: member == null ? venueRG.Price : venueRG.Specials,
                StartTime: venueRG.StartTime,
                EndTime: cashier.revDateFormat(cashier.curentTime(new Date())),
                TotalMoney: 0,
                DiscountAmount: 0,
                CouponAmount: 0,
                MemID: member == null ? "" : member.Id
            };
            var Details = [];
            //场馆商品信息
            if (venueRG.VenueGoodsList != null && venueRG.VenueGoodsList.length > 0) {
                $.each(venueRG.VenueGoodsList, function (index, item) {
                    var details = {
                        DiscountAmount: 0,
                        CouponAmount: 0,
                        Staffs: "",
                        BatchCode: "",
                        GoodsID: item.Id,
                        GoodsType: item.GoodsType,
                        GoodsCode: item.GoodsCode,
                        GoodsName: item.GoodsName,
                        DiscountPrice: item.Specials,
                        Number: item.Number,
                        TotalMoney: item.TotalMoney,
                        IsModify: item.IsModify
                    }
                    Details.push(details);
                })
            }
            
            var param = {
                Venue: Venue,
                Details: Details
            }
            $.http.post(LuckVipsoft.api.SaveVenueRestingGoods, param, user.token, function (res) {
                if (res.status == 1) {
                    _this.countProductNum(1);
                    //_this.GetVenueOrderInfo();
                    //_this.countdown = 120;
                    //_this.BindConsumeVenueHtml();
                    _this.clearData();
                    $.luck.success();
                } else {
                    $.luck.error(res.msg);
                }
            })

        },

        //左侧购物车产品相关弹层
        editShopcarProduct: function () {
            //左侧菜单详细列表
            $("body").on("click", ".venue-area .lomo-order .venue-pro-list>dl", function () {
                var _left = $(this).offset().left;
                var _top = $(this).offset().top;
                var winHeight = $(window).height();
                var showHeight = $(".lomo-tcyg").height();

                $(".left-arrow-white").css({ "left": '410px', "top": '' + (_top - 50) + 'px' });
				if (winHeight - _top <= showHeight) {
				    $(".lomo-tcyg").css({ "left": '' + (_left + 400) + 'px', "bottom": "0", "top": "auto" })
                } else {
				    $(".lomo-tcyg").css({ "left": '' + (_left + 400) + 'px', "top": '' + (_top - 50) + 'px', "bottom": "auto" })
                }
				$(".left-arrow-white").show();


				var data = JSON.parse($(this).attr("data-obj"));
				var venueId = $(this).attr("data-venueid");
				var imagesUrl = '../../../Theme/images/goodsPic.png';
				if (data.Images) {//不存在产品图时，使用默认图
				    imagesUrl = user.information.ImageServerPath + data.Images;
				}
				var isMem = 0;
				if (member != null && member.Id != undefined) {
				    isMem = 1;
				}
				var goodsStaffsData = {
				    GID:data.GID,//唯一标识
				    venueId: venueId,//场馆ID
				    Id: data.Id,// 产品ID  
				    GoodsName: data.GoodsName,//产品名称
				    Price: parseFloat(data.Price).toFixed(2),//零售价格
				    Specials: parseFloat(data.Specials).toFixed(2),//产品特价
				    Images: imagesUrl,//产品图片
				    Number: data.Number,//购买数量
				    TotalMoney: parseFloat(data.TotalMoney).toFixed(2),//折后金额
				    isMem: isMem,//是否会员
				    IsModify :data.IsModify ,// 是否修改价格
				    Staffs: data.Staffs==null?[]: data.Staffs
                };       
				_this.choosedStaffAry = data.Staffs;
				if(_this.choosedStaffAry==null){
				    _this.choosedStaffAry=[];
				}
				var html = template('goodsStaffsTmp', goodsStaffsData);
				$('#goodsStaffs').html(html)

                cashier.open(".lomo-tcyg", 'fadeIn', 'fadeOut', ".lomo-mask-left")
            })
            //确认提成员工选择
            $("body").on("click", ".staffSubmit", function () {
                var goodId = $(this).parent().attr("data-goodid");
                var venueId = $(this).parent().attr("data-venueid");
                var gId = $(this).parent().attr("data-gid");
                var bprice = $(this).parent().parent().find(".change-price").html();

                var venueitem = Enumerable.From(_this.orderVenueDetailList).Where(function (x) {
                    return x.VenueID == venueId;
                }).FirstOrDefault();
                var venuegoods = Enumerable.From(venueitem.VenueGoodsList).Where(function (x) {
                    if (x.Id == goodId && x.GID == gId) {
                        return true;
                    }
                    return false;
                }).FirstOrDefault();
                if (member == null) {
                    if (venuegoods.IsModify == 0 && parseFloat(venuegoods.Price) != parseFloat(bprice)) {
                        venuegoods.Specials = parseFloat(bprice);
                    } else if (venuegoods.IsModify == 1 && parseFloat(venuegoods.Specials) != parseFloat(bprice)) {
                        venuegoods.Specials = parseFloat(bprice);
                    }
                } else {
                    if (parseFloat(venuegoods.Specials) != parseFloat(bprice)) {
                        venuegoods.Specials = parseFloat(bprice);
                    }
                }
                venuegoods.Staffs=_this.choosedStaffAry;
                _this.BindConsumeVenueHtml();
                var box = $(this).parents('.fadeIn');
                cashier.close(box, 'fadeIn', 'fadeOut', '.lomo-mask-body');
            })
            //赠送商品
            $("body").on("click", ".giveGoods", function () {
                var that = $(this);
                var goodId = $(this).parent().attr("data-goodid");
                var venueId = $(this).parent().attr("data-venueid");
                var gId = $(this).parent().attr("data-gid");
                $.luck.confirm("是否确认赠送该商品？", function () {
                    var venueitem = Enumerable.From(_this.orderVenueDetailList).Where(function (x) {
                        return x.VenueID == venueId;
                    }).FirstOrDefault();
                    var venuegoods = Enumerable.From(venueitem.VenueGoodsList).Where(function (x) {
                        if (x.Id == goodId && x.GID == gId) {
                            return true;
                        }
                        return false;
                    }).FirstOrDefault();
                    venuegoods.Specials = 0;
                    venuegoods.TotalMoney = 0;
                    venuegoods.IsModify = 1;
                    _this.BindConsumeVenueHtml();
                    var box = that.parents('.fadeIn');
                    cashier.close(box, 'fadeIn', 'fadeOut', '.lomo-mask-body');
                });
            });
            //删除商品
            $("body").on("click", ".deleteGoods", function () {
                var that = $(this);
                var goodId = $(this).parent().attr("data-goodid");
                var venueId = $(this).parent().attr("data-venueid");
                var gId = $(this).parent().attr("data-gid");
                $.luck.confirm("是否确认删除该商品？", function () {
                    var venueitem = Enumerable.From(_this.orderVenueDetailList).Where(function (x) {
                        return x.VenueID == venueId;
                    }).FirstOrDefault();
                    var venuegoods = Enumerable.From(venueitem.VenueGoodsList).Where(function (x) {
                        if (x.Id == goodId && x.GID == gId) {
                            return true;
                        }
                        return false;
                    }).FirstOrDefault();
                    var index = venueitem.VenueGoodsList.indexOf(venuegoods);
                    venueitem.VenueGoodsList.splice(index, 1)
                    _this.BindConsumeVenueHtml();
                    var box = that.parents('.fadeIn');
                    cashier.close(box, 'fadeIn', 'fadeOut', '.lomo-mask-body');
                });
            })
            //修改购物车商品价格
            $("body").on("click", ".change-price", function () {
                var dome = $(this);
                luckKeyboard.showSmallkeyboard(dome, function (res) {
                    //res=res.substr(0, 16);
                    //res=res.replace(/[^\d.]/g, ""); //清除“数字”和“.”以外的字符  
                    //res=res.replace(/^\./g, ""); //验证第一个字符是数字而不是.
                    //res=res.replace(/\.{2,}/g, ".");//只保留第一个. 清除多余的   
                    //res=res.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".");
                    //res=res.replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3');//只能输入两个小数   
                    //if (res.indexOf(".") < 0 && res != "") { //以上已经过滤，此处控制的是如果没有小数点，首位不能为类似于 01、02的金额  
                    //    res = parseFloat(res);
                    //}
                    if (!/(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/.test(res)) {
                        $.luck.error('金额只能是2位小数')
                        return false
                    }
                    dome.html(res)
                })
            })
        },
        //获取员工分类
        GetStaffClassList: function (resolve, reject) {
            //员工分类
            $.http.post(LuckVipsoft.api.getStaffClassList, {}, user.token, function (res) {
                if (res.status == 1) {
                    _this.StaffClassList = res.data;
                    resolve();
                }
            });
        },
        //获取提成员工
        GetStaffList: function (resolve, reject) {
            //提成员工 StaffType必填0-售卡提成1-快速消费提成2-商品消费提成3-充值充次提成
            $.http.post(LuckVipsoft.api.getStaffList, { StaffType: 2, StaffName: "" }, user.token, function (res) {
                if (res.status == 1) {
                    _this.StaffList = res.data;
                    resolve();
                }
            });
        },
        //提成员工
        chooseMembergetCommission: function () {
            var _this = this;
            //var choosedStaffAry=[];
            var chooseStaff = []
            var html = '';
            //员工树形列表
            if (_this.StaffClassList.length > 0) {
                $.each(_this.StaffClassList, function (index, item) {
                    html += '<div class="layui-collapse">'
                    html += '<div class="layui-colla-item">'
                    html += '<h2 class="layui-colla-title">' + item.ClassName + '</h2>'
                    html += '<div class="layui-colla-content layui-show"><ul class="staff-list">'
                    if (_this.StaffList.length > 0) {
                        $.each(_this.StaffList, function (n, items) {
                            if (items.StaffClassId == item.Id) {
                                html += '<li data-id="' + items.Id + '" data-name="' + items.StaffName + '">' + items.StaffName + '</li>'
                            }
                        })
                    }
                    html += '</div>'
                    html += '</div>'
                    html += '</div>'
                })
            }
            $('.lomo-xztcyg .lomo-xztcyg-left').html(html);
            //已选择员工列表
            tab_staff = table.render({
                elem: '#StaffList',
               // data: _this.choosedStaffAry,
                cellMinWidth: 95,
                cols: [
                    [
                        { field: 'StaffName', title: '姓名', align: 'center' },
                        { field: 'CommissionMoney', title: '自定义提成金额', edit: 'text', align: 'center',event: "money"  },
                        { field: 'Remark', title: '备注', edit: 'text', align: 'center' },
                        {
                            title: '操作', align: 'center', templet: function (d) {
                                var html = '';
                                html += '<a class="layui-btn layui-btn-xs tb-btn-deleat" lay-event="delete">删除</a> ';
                                return html;
                            }
                        },
                    ]
                ]
            });
            table.on('tool(StaffList)', function (obj) {
                var layEvent = obj.event;
                switch (layEvent) {
                    case "delete":
                        //layer.confirm('真的删除行么', function(index){
                        $.each(chooseStaff, function (index, item) {
                            if (item.StaffId == obj.data.StaffId) {
                                chooseStaff.splice(index, 1)
                                return
                            }
                        })
                        $("body").find('.staff-list li[data-id="' + obj.data.StaffId + '"]').removeAttr("class");
                        obj.del();                      
                        break;
                    case "money":
                        $(obj.tr).find(".layui-table-edit").keyup(function () {
                            var val = $(this).val();
                            cashier.clearNoNum(this);
                            //if (val == "") $(this).val("不填默认使用提成方案")
                        });
                        break;
                }
            })
            table.on('edit(StaffList)', function (obj) {
                $.each(chooseStaff, function (index, item) {
                    if (item.StaffId == obj.data.StaffId) {
                        chooseStaff.splice(index, 1, obj.data)
                        return
                    }
                })
            });
            $("body").on("click", ".choose-order-member", function () {				
                layer.open({
                    type: 1,
                    id: "searchMemCard",
                    title: '选择提成员工',
                    closeBtn: 1,
                    shadeClose: false,
                    shade: 0.3,
                    maxmin: false,//禁用最大化，最小化按钮
                    resize: false,//禁用调整大小
                    area: ['90%', '80%'],
                    btn: ['确认', '清除'],
                    skin: "lomo-ordinary",
                    content: $(".lomo-xztcyg"),
                    success: function () {
                        chooseStaff= Object.assign([], _this.choosedStaffAry) ;
                        
                        $("body").find('.staff-list li').removeAttr("class");
                        $.each( chooseStaff, function (index, item) {
                            $("body").find('.staff-list li[data-id="' + item.StaffId + '"]').toggleClass("active");
                        })
                        tab_staff.reload({
                            data: chooseStaff
                        });
                        element.render();
                    },
                    yes: function (index) {	
                        layer.close(index)
						var html = '';				
						$(".staffname").remove(); 	
						_this.choosedStaffAry = Object.assign([],chooseStaff)					  
                        $.each(chooseStaff, function (index, item) {
                            html += '<span class="name staffname" data-id="' + item.StaffId + '">' + item.StaffName + '<i class="deletStaff">x</i></span>'
                        })
                        $(".lomo-tcyg-add .nameTitle").after(html);
					},
					btn2:function (index) {		
						layer.close(index)
						chooseStaff =[]
						_this.choosedStaffAry=[]
						$(".staffname").remove();   
					}
                })
			});

            $("body").on("click", ".choose-member", function () {
                layer.open({
                    type: 1,
                    id: "searchMemCard",
                    title: '选择提成员工',
                    closeBtn: 1,
                    shadeClose: false,
                    shade: 0.3,
                    maxmin: false,//禁用最大化，最小化按钮
                    resize: false,//禁用调整大小
                    area: ['90%', '80%'],
                    btn: ['确认', '清除'],
                    skin: "lomo-ordinary",
                    content: $(".lomo-xztcyg"),
                    success: function () {
                        chooseStaff= Object.assign([], _this.choosedStaffAry) ;
                       
                        $("body").find('.staff-list li').removeAttr("class");
                        $.each(chooseStaff, function (index, item) {
                            $("body").find('.staff-list li[data-id="' + item.StaffId + '"]').toggleClass("active");
                        })
                        tab_staff.reload({
                            data: chooseStaff
                        });
                        element.render();
                    },
                    yes: function (index) {
                        layer.close(index)
                        var html = '';
                        $(".staffname").remove();
                        _this.choosedStaffAry=Object.assign([],chooseStaff)  
                        $.each(chooseStaff, function (index, item) {
                            if (item.CommissionMoney == "不填默认使用提成方案" || item.CommissionMoney == "") {
                                item.CommissionMoney = 0;
                            }
                            html += '<span class="name staffname" data-id="' + item.StaffId + '">' + item.StaffName + '<i class="deletStaff">x</i></span>'
                        })
                        $(".lomo-tcyg .nameTitle").after(html);
                    },
                    btn2:function (index) {		
						layer.close(index)
						chooseStaff =[]
						_this.choosedStaffAry=[]
						$(".staffname").remove();   
					}
                })
            });
            //商品页面删除提成员工
            $("body").on("click", ".deletStaff", function () {
                var id = $(this).parent(".name").attr("data-id");
                
                $.each(_this.choosedStaffAry, function (index, item) {
                    if (item.StaffId == id) {
                        $("body").find('.staff-list li[data-id="' + item.StaffId + '"]').removeAttr("class");
                        _this.choosedStaffAry.splice(index, 1)
                        return false;
                    }
                })
                $(this).parent(".name").remove();
            })
            //点击员工分类
            $("body").on("click", ".staff-list li", function () {
                var id = $(this).attr("data-id"), name = $(this).attr("data-name");
                var newData = {
                    "StaffId": id,
                    "StaffName": name,
                    "CommissionMoney": '不填默认使用提成方案',
                    "Remark": '',
                }
                $(this).toggleClass("active");
                if ($(this).attr("class").indexOf("active") >= 0) {
                    chooseStaff.push(newData);
                } else {
                    $.each(chooseStaff, function (index, item) {
                        if (item.StaffId == id) {
                            chooseStaff.splice(index, 1)
                            return
                        }
                    })
                }
                tab_staff.reload({
                    data: chooseStaff
                });
            })
        },
      
        //结算购物车界面
        BindConsumeVenueHtml: function () {
            var _this = this;
            _this.MemberSpecials();//计算价格
            _this.getShopActivity();//获取店铺优惠活动
            var html = "";
            if (_this.shoppingCar.length > 0 && _this.shoppingCar.Id != "") {
                $.each(_this.shoppingCar, function (index, item) {
                    html += '<div class="order-list">';
                    //场地信息
                    html += '<dl>';
                    if (item.IsMainVenue == 1) {
                        _this.venue = {
                            Id: item.VenueID,//场馆Id
                            name: item.VenueName,//场馆名称
                            status: item.VenueStatus,//场馆状态
                            price: item.Price,//单价
                            specials: item.Specials //特价
                        };
                        html += '<dt class="addnew"><button id="addProductVenue" class="add-bt" style="width: 100%;">添加商品</button></dt>';
                    }
                    html += '<dd>';
                    html += '<img src="../../../../Theme/images/changguan.png" alt="" style="float: left;"/>';
                    html += '<div class="order-name">';
                    html += '<h1>' + item.VenueName + '</h1>';
                    var starttime = cashier.dateFormat(item.StartTime).replace(/-/g, "/");
                    var t1 = new Date(starttime);
                    var t2 = new Date();
                    if (item.IsMainVenue != 1) {
                        var endtime = cashier.dateFormat(item.EndTime).replace(/-/g, "/");
                        t2 = new Date(endtime);
                    }
                    var time = t2.getTime() - t1.getTime();
                    var daytime = cashier.millisecondToTime(time);
                    html += ' <span class="size-gray">累计时长: <i class="size-green">' + daytime + '</i></span>';
                    html += ' <span class="size-gray">开始时间: <i style="color:#000">' + cashier.dateFormat(item.StartTime) + '</i></span>';
                    if (item.IsMainVenue != 1) {
                        html += ' <span class="size-gray">结束时间: <i style="color:#000">' + cashier.dateFormat(item.EndTime) + '</i></span>';
                    }
                    if (member == null) {
                        html += '<span class="size-gray">单价: <i>¥' + parseFloat(item.Price).toFixed(2) + '</i></span>';
                    } else {
                        html += '<span class="size-gray">单价: <i>¥' + parseFloat(item.Specials).toFixed(2) + '</i> <b>¥' + parseFloat(item.Price).toFixed(2) + '</b></span>';
                    }
                    html += '</div>';
                    html += '</dd>';
                    html += '</dl>';
                    //商品信息
                    html += '<div class="order-list venue-pro-list">';
                    if (item.VenueGoodsList != null && item.VenueGoodsList.length > 0) {
                        $.each(item.VenueGoodsList, function (inx,itm) {
                            var data = JSON.stringify(itm);
                            html += '<dl data-obj=\'' + data + '\' data-venueid="' + item.VenueID + '">';
                            html += '<dt><span class="order-nub fr">' + itm.Number + '</span></dt>';
                            html += '<dd>';
                            if(itm.GoodsType==1){//普通产品
                                html += '<i class="colorIcon blue">库</i>';
                            } else if (itm.GoodsType == 2) {//服务
                                html += '<i class="colorIcon green">服</i>';
                            } else if (itm.GoodsType == 5) {//套餐
                                html += '<i class="colorIcon red">套</i>';
                            }
                            html += '<div class="order-name">';
                            html += '<h1>' + itm.GoodsName + '</h1>';
                            if (member == null) {
                                if (item.IsModify == 1) {
                                    html += '<span>单价: <i>¥' + parseFloat(itm.Specials).toFixed(2) + '</i></span>';
                                } else {
                                    html += '<span>单价: <i>¥' + parseFloat(itm.Price).toFixed(2) + '</i></span>';
                                }
                            } else {
                                html += '<span>单价: <i>¥' + parseFloat(itm.Specials).toFixed(2) + '</i> <b>¥' + parseFloat(itm.Price).toFixed(2) + '</b></span>';
                            }
                            html += '</div>';
                            html += '</dd>';
                            html += '</dl>';
                        })
                    }
                    html += '</div>';

                    html += '</div>';
                })

                //结算信息
                $("#spanGoodsNum").html(_this.payMoneyInfo.GoodsNum);
                $("#spanTotalPoint").html(parseFloat(_this.payMoneyInfo.TotalPoint).toFixed(2));
                if (member == null) {
                    $("#spanDiscountMoney").html(parseFloat(_this.payMoneyInfo.TotalMoney).toFixed(2));
                    $("#smallTotalMoney").hide();
                } else {
                    $("#spanDiscountMoney").html(parseFloat(_this.payMoneyInfo.DiscountMoney).toFixed(2));
                    $("#spanTotalMoney").html(parseFloat(_this.payMoneyInfo.TotalMoney).toFixed(2));
                    $("#smallTotalMoney").show();
                }
                $("#spanPreferentialAmount").html(parseFloat(_this.payMoneyInfo.amountActivityMoney).toFixed(2));
                if (member != null) {
                    http.cashierEnd.seleMembers(member, user.information.ImageServerPath, '.lomo-mian-left .vipInfo')
                    $(".timescount").show();
                    $(".lomo-order").css({ "top": "84px", "margin-top": "11px" });
                } else {
                    member = null;
                    http.cashierEnd.delMembers('.lomo-mian-left .vipInfo', 'member');
                    $(".lomo-order").css({ "top": "0", "margin-top": "0" });
                }
            }
            $(".venue-area .lomo-order").html(html);
            _this.IsShowBtn(2);
            _this.countdown = 120;
            _this.BtnCountDown($("#btnVenueConsume"));
        },
        //挂单购物车界面
        BindVenueRestingHtml: function () {
            var _this = this;
            _this.MemberSpecials();//计算价格
            var html = "";
            if (_this.shoppingCar.length > 0 && _this.shoppingCar.Id != "") {
                $.each(_this.shoppingCar, function (index, item) {
                    if (item.IsMainVenue == 1) {
                        _this.venueRestingGoods = item;
                        html += '<div class="order-list">';
                        //场地信息
                        html += '<dl>';
                        html += '<dd>';
                        html += '<img src="../../../../Theme/images/changguan.png" alt="" style="float: left;"/>';
                        html += '<div class="order-name">';
                        html += '<h1>' + item.VenueName + '</h1>';
                        var starttime = cashier.dateFormat(item.StartTime).replace(/-/g, "/");
                        var t1 = new Date(starttime);
                        var t2 = new Date();//luck.dateFormat(item.EndTime).replace(/-/g, "/")
                        var time = t2.getTime() - t1.getTime();
                        var daytime = cashier.millisecondToTime(time);
                        html += ' <span class="size-gray">累计时长: <i class="size-green">' + daytime + '</i></span>';
                        html += ' <span class="size-gray">开始时间: <i style="color:#000">' + cashier.dateFormat(item.StartTime) + '</i></span>';
                        if (member == null) {
                            html += '<span class="size-gray">单价: <i>¥' + parseFloat(item.Price).toFixed(2) + '</i></span>';
                        } else {
                            html += '<span class="size-gray">单价: <i>¥' + parseFloat(item.Specials).toFixed(2) + '</i> <b>¥' + parseFloat(item.Price).toFixed(2) + '</b></span>';
                        }
                        html += '</div>';
                        html += '</dd>';
                        html += '</dl>';
                        //商品信息
                        html += '<div class="order-list venue-pro-list">';
                        if (item.VenueGoodsList != null && item.VenueGoodsList.length > 0) {
                            $.each(item.VenueGoodsList, function (inx, itm) {
                                html += '<dl data-id="' + itm.Id + '" data-stocknum="' + itm.StockNum + '" data-gid="' + itm.GID + '">';
                                html += '<dt>';
                                html += '<span class="order-reduce">-</span>';
                                html += '<span class="order-nub">' + itm.Number + '</span>';
                                html += '<span class="order-add">+</span>';
                                html += '</dt>';
                                html += '<dd>';
                                if (itm.GoodsType == 1) {//普通产品
                                    html += '<i class="colorIcon blue">库</i>';
                                } else if (itm.GoodsType == 2) {//服务
                                    html += '<i class="colorIcon green">服</i>';
                                } else if (itm.GoodsType == 5) {//套餐
                                    html += '<i class="colorIcon red">套</i>';
                                }
                                html += '<div class="order-name">';
                                html += '<h1>' + itm.GoodsName + '</h1>';
                                if (member == null) {
                                    if (item.IsModify == 1) {
                                        html += '<span class="size-gray">单价: <i>¥' + parseFloat(itm.Specials).toFixed(2) + '</i></span>';
                                    } else {
                                        html += '<span class="size-gray">单价: <i>¥' + parseFloat(itm.Price).toFixed(2) + '</i></span>';
                                    }
                                } else {
                                    html += '<span>单价: <i>¥' + parseFloat(itm.Specials).toFixed(2) + '</i> <b>¥' + parseFloat(itm.Price).toFixed(2) + '</b></span>';
                                }
                                html += '</div>';
                                html += '</dd>';
                                html += '</dl>';
                            })
                        }
                        html += '</div>';

                        html += '</div>';
                    }
                })
            }
            $(".venue-product-area .lomo-order").html(html);
        },
        //绑定空闲场地开台页面信息
        BindOpenVenueHtml: function () {
            var _this = this;
            if (_this.venue == null) {
                $.luck.error("请先选择场地");
                return false;
            }
            var html = "";
            html += '<div class="order-list">';
            html += '<dl>';
            html += '<dd>';
            html += '<img src="../../../../Theme/images/changguan.png" alt="" style="float: left;"/>';
            html += '<div class="order-name">';
            html += '<h1>' + _this.venue.name + '</h1>';
            if (member == null) {
                html += '<span class="size-gray">单价: <i>¥' + parseFloat(_this.venue.price).toFixed(2) + '</i></span>';
            } else {
                html += '<span class="size-gray">单价: <i>¥' + parseFloat(_this.venue.specials).toFixed(2) + '</i> <b>¥' + parseFloat(_this.venue.price).toFixed(2) + '</b></span>';
            }
            html += '</div>';
            html += '</dd>';
            html += '</dl>';
            html += '</div>';

            $(".lomo-order").html(html);
            _this.IsShowBtn(1);
        },
        //显示隐藏内容
        IsShowBtn: function (type) {
            if (type == 1) {//开台
                $("#divOrderPayItem").hide();
                $("#btnOpenVenue").show();
                $("#btnVenueRestingGoods").hide();
                $("#btnVenueConsume").hide();
                $("#btnRefreshMoney").hide();
            } else if (type == 2) {//结账
                $("#divOrderPayItem").show();
                $("#btnOpenVenue").hide();
                $("#btnVenueRestingGoods").hide();
                $("#btnVenueConsume").show();
                $("#btnRefreshMoney").hide();
            } else if (type == 3) {//刷新计价
                $("#divOrderPayItem").show();
                $("#btnOpenVenue").hide();
                $("#btnVenueRestingGoods").hide();
                $("#btnVenueConsume").hide();
                $("#btnRefreshMoney").show();
            }
        },
        //会员刷卡场馆购物车信息变更
        BindMemVenue: function () {
            var _this = this;
            if (_this.shoppingCar == null) {
                _this.IsShowBtn(1);
            } else {
                _this.BindConsumeVenueHtml();
            }
        },
        //会员价格计算
        MemberSpecials: function () {
            var _this = this;

            _this.shoppingCar = [];
            var TotalMoney = 0.00;//总金额
            var DiscountMoney= 0.00;//实付金额
            var TotalPoint = 0.00;//获得积分
            var GoodsNum = 0.00;//商品数量
            //特殊折扣规则集合
            var classRules = null;
            if (member != null) {
                classRules = member.ClassDiscountRulesList != undefined ? member.ClassDiscountRulesList : null;
            }
            $.each(_this.orderVenueDetailList, function (index, item) {
                var shoppingCar = {
                    Id: item.Id,//场馆消费订单详情ID
                    MainID: item.MainID,//主开台ID
                    VenueID: item.VenueID,//场馆ID
                    VenueName: item.VenueName,//场馆名称
                    Price: item.Price,//单价
                    Specials: item.Specials,//会员特价
                    VenueStatus: item.VenueStatus,//1-正常 0-维修 2-使用 3待清台
                    StartTime: item.StartTime,//计时产品开始时间
                    EndTime: item.EndTime,//计时产品结束时间
                    IsMainVenue: item.IsMainVenue,//是否主场馆
                    VenueGoodsList: []
                }
                //场馆场地信息
                var VenueGoodsList = item.VenueGoodsList;
                if (VenueGoodsList != null && VenueGoodsList.length > 0) {
                    $.each(VenueGoodsList, function (inx, itm) {
                        itm.GID=uuid();
                        var discount = 1; //记录最低,默认为会员等级折扣
                        var goodsPoint = 0.00;//单品获得积分
                        var Specials = 0.00;//商品特价
                        if (member == null) {
                            Specials = itm.Price;
                            if (itm.IsModify == 1) {
                                Specials = itm.Specials;
                            }
                            shoppingCar.VenueGoodsList.push({
                                GID:itm.GID,//唯一标识
                                Id: itm.Id,// 产品ID  
                                GoodsType: itm.GoodsType,//商品类型
                                GoodsCode: itm.GoodsCode,//产品编号
                                GoodsName: itm.GoodsName,//产品名称
                                Price: itm.Price,//零售价格
                                Specials: Specials,//产品特价
                                Images: itm.Images,//产品图片
                                IsPoint: itm.IsPoint,//是否积分
                                PointType: itm.PointType,//积分方式
                                MinDiscount: itm.MinDiscount,//最低折扣
                                IsDiscount: itm.IsDiscount,//是否打折
                                Number: itm.Number,//购买数量
                                Point: 0.00,//积分数量
                                GoodsClass: itm.GoodsClass,//商品分类
                                TotalMoney: (Specials * itm.Number).toFixed(4),//折后金额
                                StockNum: itm.StockNum,//库存  
                                IsModify:itm.IsModify,//是否修改价格
                                memberSchemes: '散客',
                                Staffs: itm.Staffs==undefined?null:itm.Staffs//提成员工
                            })
                            DiscountMoney += (Specials * itm.Number);
                            GoodsNum += itm.Number;
                            TotalMoney += (Specials * itm.Number);
                        } else {
                            var memberSchemes = '';
                            if (itm.Specials > 0) {
                                Specials = itm.Specials;//商品特价
                                memberSchemes = "商品特价";
                            } else {
                                memberSchemes = "商品折扣";
                                var classDiscount = 1;   //商品分类折扣
                                //商品分类折扣计算
                                if (itm.GoodsClass !== undefined && classRules != null) {
                                    $.each(classRules, function (i, it) {
                                        if (it.GoodsClassId == itm.GoodsClass) {
                                            classDiscount = itm.Discount;
                                            return false;
                                        }
                                    })
                                }
                                //商品折扣
                                if (itm.IsDiscount == 0) //是否折扣
                                {
                                    if (classDiscount < 1) {
                                        discount = classDiscount;
                                        memberSchemes = "会员商品分类折扣(未启用商品折扣)"
                                    }
                                    else {
                                        discount = member.DiscountPercent;
                                        memberSchemes = "会员默认折扣(未启用商品折扣)"
                                    }
                                } else {
                                    if (classDiscount < 1) {
                                        // 商品最低折扣  会员商品分类 比较
                                        if (itm.MinDiscount > classDiscount) {
                                            memberSchemes = "会员商品分类折扣(启用商品折扣)"
                                            discount = classDiscount
                                        }
                                        else {
                                            memberSchemes = "商品最低折扣(启用商品折扣)"
                                            discount = itm.MinDiscount
                                        }
                                    } else {
                                        //商品最低折扣 会员默认折扣 比较
                                        if (itm.MinDiscount > member.DiscountPercent) {
                                            memberSchemes = "会员默认折扣(启用商品折扣)"
                                            discount = member.DiscountPercent
                                        }
                                        else {
                                            memberSchemes = "商品最低折扣(启用商品折扣)"
                                            discount = itm.MinDiscount
                                        }
                                    }
                                }
                                Specials = (itm.Price * discount).toFixed(4)
                            }
                            //获取积分计算
                            if (itm.IsPoint == 1) {
                                goodsPoint = (itm.PointType * itm.Number)
                                TotalPoint = TotalPoint + goodsPoint
                            }
                            else if (member.PointPercent > 0) {
                                goodsPoint = (memberPrice * itm.Number * member.PointPercent).toFixed(4)
                                TotalPoint = TotalPoint + goodsPoint;// 按折后金额给积分
                            }
                            if (itm.IsModify == 1) {
                                Specials = itm.Specials;
                            }
                            shoppingCar.VenueGoodsList.push({
                                GID:itm.GID,//唯一标识
                                Id: itm.Id,// 产品ID  
                                GoodsType: itm.GoodsType,//商品类型
                                GoodsCode: itm.GoodsCode,//产品编号
                                GoodsName: itm.GoodsName,//产品名称
                                Price: itm.Price,//零售价格
                                Specials: Specials,//产品特价
                                Images: itm.Images,//产品图片
                                IsPoint: itm.IsPoint,//是否积分
                                PointType: itm.PointType,//积分方式
                                MinDiscount: itm.MinDiscount,//最低折扣
                                IsDiscount: itm.IsDiscount,//是否打折
                                Number: itm.Number,//购买数量
                                Point: goodsPoint,//积分数量
                                GoodsClass: itm.GoodsClass,//商品分类
                                TotalMoney: (Specials * itm.Number).toFixed(4),//折后金额
                                StockNum: itm.StockNum,//库存  
                                IsModify:itm.IsModify,//是否修改价格
                                memberSchemes: memberSchemes,
                                Staffs:  itm.Staffs==undefined?null:itm.Staffs//提成员工
                            })
                            DiscountMoney += (Specials * itm.Number);
                            GoodsNum += itm.Number;
                            TotalMoney += (itm.Price * itm.Number);
                        }

                    })
                }
                _this.shoppingCar.push(shoppingCar);
            })

            //合计场馆金额
            $.each(_this.VenueMoney, function (i, it) {
                var tm = parseFloat(it.TotalMoney).toFixed(2);
                var dm = parseFloat(it.DiscountMoney).toFixed(2);
                TotalMoney = accAdd(TotalMoney, tm);
                if (member != null) {
                    DiscountMoney = accAdd(DiscountMoney, dm);
                } else {
                    DiscountMoney = accAdd(DiscountMoney, tm);
                }
                TotalPoint = accAdd(TotalPoint, it.TotalPoint);
            })

            _this.payMoneyInfo = {
                TotalMoney: TotalMoney.toFixed(4),//总金额
                DiscountMoney: DiscountMoney.toFixed(4),//实付金额
                TotalPoint: TotalPoint.toFixed(4),//获得积分
                GoodsNum: GoodsNum,//商品数量
                amountActivityMoney: 0.00,//活动减金额
                amountActivityPoint: 0.00//活动获得积分
            };
        },
        //活动优惠价格计算
        setpActivity: function () {
            var _this =this 
            var currentPrice = _this.payMoneyInfo.DiscountMoney //当前总价
        
            _this.payMoneyInfo.amountActivityMoney = 0.0000 //活动减金额
            _this.payMoneyInfo.amountActivityPoint = 0.0000 //活动获得积分

            if (_this.chooseActivity.Id != undefined){
                if (_this.chooseActivity.LimitUsedAmount <= currentPrice){           
                    if (_this.chooseActivity.IsReduceAmount == 1) {
                        _this.payMoneyInfo.amountActivityMoney += _this.chooseActivity.ReduceAmount
                    }
                    if (_this.chooseActivity.IsGivePoint == 1) {
                        _this.payMoneyInfo.amountActivityPoint += that.chooseActivity.GivePoint
                    }              
                }else{
                    _this.chooseActivity = {}
                    console.log("活动不满足金额->清空")
                }
            }

            if (_this.chooseBirthdayActivity.Id != undefined){
                if (_this.chooseBirthdayActivity.LimitUsedAmount <= currentPrice) {
                    if (_this.chooseBirthdayActivity.IsReduceAmount == 1) {
                        _this.payMoneyInfo.amountActivityMoney += _this.chooseBirthdayActivity.ReduceAmount
                    }

                    if (_this.chooseBirthdayActivity.IsGivePoint == 1) {
                        _this.payMoneyInfo.amountActivityPoint += _this.chooseBirthdayActivity.GivePoint
                    }              
                }else{
                    _this.chooseBirthdayActivity = {}
                    console.log("活动不满足金额(生日)");
                }
            }
            console.log('活动计算结果 ==>', _this.payMoneyInfo)
        },
        //结算按钮倒计时
        BtnCountDown: function (dom) {
            var _this = this;
            if (_this.countdown == 0) {
                _this.IsShowBtn(3);
                _this.countdown = 120;
                return;
            } else {
                dom.text("立即结账(" + _this.countdown + ")");
                _this.countdown--;
            }
            _this.timer = setTimeout(function () {
                _this.BtnCountDown(dom)
            }, 1000)
        },
        //优惠活动页面渲染
        BindActivity: function () {
            var _this = this;
            //活动勾选状态 
            $('.act_item').removeClass('checked')
            var actHtml = ''
            if (_this.chooseBirthdayActivity.Id != undefined) {
                actHtml += '<i class="shopAct">' + _this.chooseBirthdayActivity.ActName + '</i>'
                $('#act_' + _this.chooseBirthdayActivity.Id).addClass('checked')
            }

            if (_this.chooseActivity.Id != undefined) {
                actHtml += '<i class="shopAct">' + _this.chooseActivity.ActName + '</i>'
                $('#act_' + _this.chooseActivity.Id).addClass('checked')
            }

            if (actHtml == '') {
                if (hasShopAcivity) {
                    $(".order-select").html('请选择优惠活动')
                }
                else {
                    $(".order-select").html('暂无优惠活动')
                }
            }
            else {
                $(".order-select").html(actHtml)
            }
            console.log(_this.chooseBirthdayActivity);
            console.log(_this.chooseActivity);
            //结算信息
            TotalPoint = _this.payMoneyInfo.TotalPoint + _this.payMoneyInfo.amountActivityPoint;
            var PreferentialAmount = _this.payMoneyInfo.amountActivityMoney;
            $("#spanTotalPoint").html(parseFloat(TotalPoint).toFixed(2));
            $("#spanPreferentialAmount").html(parseFloat(PreferentialAmount).toFixed(2));
        },
        //关闭弹窗
        closePopup: function () {
            var box = $(".submit-bt-clear").parents('.fadeIn');
            cashier.close(box, 'fadeIn', 'fadeOut', '.lomo-mask-body');
        },
        //清除数据
        clearData: function () {
            var _this = this;
            //清除会员
            member = null;
            http.cashierEnd.delMembers('.lomo-mian-left .vipInfo', 'member');
            $(".lomo-order").css({ "top": "0", "margin-top": "0" });
            //清除数据
            _this.shoppingCar = null;//购物车数据
            _this.chooseBirthdayActivity = {}; //生日优惠
            _this.chooseActivity  = {};  //活动方案
            _this.orderVenueDetailList = []; //场馆购物车列表
            _this.venueRestingGoods = null;//挂单数据
            _this.VenueMoney = [];//场地金额
            _this.payMoneyInfo = {};//结算信息
            _this.choosedStaffAry = [];//商品提成员工信息
            if (_this.venue != null && _this.venue.status != 0 && _this.venue.status != 3) {
                _this.venue = null;//选中的场馆信息
            }
            //隐藏购物车
            $(".venue-area").show();
            $(".venue-product-area,.lomo-mian-left .venue-area,.vipInfo").hide();
            //关闭弹窗
            _this.closePopup();
            layer.closeAll()
        },
        //结算数据
        VenueConsumeData: function () {
            var _this = this;

            var amountDiscountMoney = parseFloat(_this.payMoneyInfo.TotalMoney).toFixed(2);//总金额
            if (member != null) {
                amountDiscountMoney = parseFloat(_this.payMoneyInfo.DiscountMoney).toFixed(2);//折扣金额
            }
            var order = {
                modificationInfo: {},//手动改价详细记录 { 百分比 / 金额 /修改前金额 / 修改后金额 } 
                isZeroAmount: 0,
                zeroAmount: 0.00,//抹零金额
                amountDiscountMoney: amountDiscountMoney,//会员折扣总金额 (会出现比原价高时的情况)
                goodsNum: _this.payMoneyInfo.GoodsNum,//商品数量
                amountPoint: _this.payMoneyInfo.TotalPoint,//获得积分
                amountMoney: parseFloat(_this.payMoneyInfo.TotalMoney).toFixed(2),//商品总价
                amountActivityMoney: parseFloat(_this.payMoneyInfo.amountActivityMoney).toFixed(2),//活动减金额       
                amountActivityPoint: parseFloat(_this.payMoneyInfo.amountActivityPoint).toFixed(2),//活动获得积分
                amountCouponMoney: 0.00,//优惠卷金额
                amountModifyMoney: 0.00,//手动修改金额	
                goods: [],
            }
            var Details = [];
            $.each(_this.shoppingCar, function (index, item) {
                var VenueMoney = Enumerable.From(_this.VenueMoney).Where(function (e) {
                    return e.VenueID == item.VenueID;
                }).FirstOrDefault();
                var EndTime = item.EndTime;
                if (item.IsMainVenue == 1) {
                    _this.MainID = item.Id;
                    var time = new Date();
                    EndTime = cashier.revDateFormat(cashier.curentTime(time));
                }
                var money = parseFloat(VenueMoney.TotalMoney).toFixed(2);
                if (member != null) {
                    money = parseFloat(VenueMoney.DiscountMoney).toFixed(2);
                }
                Details.push({
                    isCustomPrice: 0,  //是否手动修改价格
                    goodsId: item.VenueID,//场馆消费订单详情ID
                    goodsCode: item.VenueID,// 商品编号,
                    goodsName: item.VenueName,// 商品名称,
                    goodsMode: 3,//类型 1.普通商品 2.服务商品 3.计时商品 4.计次商品 5.套餐
                    num: 1,//数量
                    goodsPoint: VenueMoney.TotalPoint,//商品获得积分（总）
                    amount: money,//商品总价(会员折后)
                    memberDiscount: 1,//会员折扣率
                    price: parseFloat(VenueMoney.TotalMoney).toFixed(2),
                    memberPrice: parseFloat(VenueMoney.DiscountMoney).toFixed(2),
                    memberSchemes: '',
                    activityPoint: 0.00, //活动获取积分（总）
                    conponMoney: 0.00, //优惠券优惠金额（总）
                    modifyMoney: 0.00, //整单优惠修改分摊金额（总） 活动优惠金额+整单优惠+抹零
                    staffs: [],
                    industryObjectID: item.Id,//场馆开台ID,
                    startTime: item.StartTime,//开始时间,
                    endTime: EndTime,// 结束时间
                })
                $.each(item.VenueGoodsList, function (idx, itm) {
                    var Specials = parseFloat(itm.Price).toFixed(2);
                    if (member != null) {
                        Specials = parseFloat(itm.Specials).toFixed(2);
                    }
                    Details.push({
                        isCustomPrice: itm.IsModify,  //是否手动修改价格
                        goodsId: itm.Id,//场馆消费订单详情ID
                        goodsCode: itm.GoodsCode,//商品编号
                        goodsName: itm.goodsName,//商品名称
                        goodsMode: itm.GoodsType,//类型 1.普通商品 2.服务商品 3.计时商品 4.计次商品 5.套餐
                        num: itm.Number,//数量
                        goodsPoint: item.Point,//商品获得积分（总）
                        amount: parseFloat(Specials * itm.Number).toFixed(2),//商品总价(会员折后)
                        memberDiscount: 1,//会员折扣率
                        price: parseFloat(itm.Price).toFixed(2),
                        memberPrice: parseFloat(itm.Specials).toFixed(2),
                        memberSchemes: itm.memberSchemes,
                        activityPoint: 0.00, //活动获取积分（总）
                        conponMoney: 0.00, //优惠券优惠金额（总）
                        modifyMoney: 0.00, //整单优惠修改分摊金额（总） 活动优惠金额+整单优惠+抹零
                        staffs: item.Staffs == null ? [] : item.Staffs,
                        industryObjectID: item.Id,//场馆开台ID,
                        startTime: 0,//开始时间,
                        endTime: 0,// 结束时间
                    })
                })

            })

            order.goods = Details;
            return order;
        },

        //测试提交订单
        Pay: function () {
            var _this = this;
            var memId = "";
            if (member != null) {
                memId = member.Id;
            }
            var Order = {
                ActivityAmount: parseFloat(_this.payMoneyInfo.amountActivityMoney).toFixed(2),//优惠活动优惠金额,
                CouponAmount: 0.00,//优惠券优惠金额,
                ZeroAmount: 0.00,//抹零金额,
                SingleAmount: 0.00,//整单优惠金额,
                Source: 1,//消费来源：0-PC、1-前台收银、2-收银机、3-APP4公众号5小程序,
                BillCode: "",//"订单号",
                OrderType: 9,//订单类型9、桌台消费
                MemID: memId,//"会员ID",
                TotalMoney: parseFloat(_this.payMoneyInfo.TotalMoney).toFixed(2),//订单总金额,
                DiscountMoney: parseFloat(_this.payMoneyInfo.DiscountMoney).toFixed(2),//折后总金额,
                TotalPoint: parseFloat(_this.payMoneyInfo.TotalPoint).toFixed(2),//获得积分,
                Remark: ""//"消费备注"
            }
            var Payments = [
              {
                  PaymentCode: "001",// "支付方式编码",
                  PayAmount: parseFloat(_this.payMoneyInfo.DiscountMoney).toFixed(2),//支付金额,
                  PayContent: "",//"积分支付扣除数量或者在线支付流水号"
              }
            ];
            var Staffs = [
              //{
              //    "StaffId": "员工ID",
              //    "CommissionMoney": 自定义提成金额,
              //    "Remark": "提成备注"
              //}
            ];
            var Activities = [
              //{
              //    ActId: _this.chooseActivity.Id,//"优惠活动ID",
              //    ActName: _this.chooseActivity.ActName,// "活动名称",
              //    ActivityAmount: _this.chooseActivity.ReduceAmount,// 优惠金额
              //}
            ];
            var Conpons = [
              //{
              //    ConponSendId: "优惠券发送记录ID",
              //    ConponCode: "优惠券券号",
              //    CouponAmount: 优惠金额
              //}
            ];

            var Details = [];
            var MainID = "";//"主场馆开台ID：开台场馆或合单后的主场馆",
            var MemberPwd = "";
            $.each(_this.shoppingCar, function (index, item) {
                var VenueMoney = Enumerable.From(_this.VenueMoney).Where(function (e) {
                    return e.VenueID == item.VenueID;
                }).FirstOrDefault();
                var EndTime = item.EndTime;
                if (item.IsMainVenue == 1) {
                    MainID = item.Id;
                    var time = new Date();
                    EndTime = cashier.revDateFormat(cashier.curentTime(time));
                }
                var money = parseFloat(VenueMoney.TotalMoney).toFixed(2);
                if (member != null) {
                    money = parseFloat(VenueMoney.DiscountMoney).toFixed(2);
                }
                Details.push({
                    DiscountAmount: 0.00,// 优惠活动、整单优惠、抹零优惠之和,
                    CouponAmount: 0.00,//优惠券优惠,
                    Staffs: [],// 提成员工,
                    BatchCode: "",// 计次批次好,
                    GoodsID: item.VenueID,//商品ID,
                    GoodsType: 3,//商品类型,
                    GoodsCode: item.VenueID,// 商品编号,
                    GoodsName: item.VenueName,// 商品名称,
                    DiscountPrice: money,//折扣价,
                    Number: 1,// 数量,
                    TotalMoney: money,// 总金额,
                    IndustryObjectID: item.Id,//场馆开台ID,
                    StartTime: item.StartTime,//开始时间,
                    EndTime: EndTime,// 结束时间
                    IsModify: 0//是否手动修改价格
                });

                $.each(item.VenueGoodsList, function (idx, itm) {
                    var Specials = parseFloat(itm.Price).toFixed(2);
                    if (member != null) {
                        Specials = parseFloat(itm.Specials).toFixed(2);
                    }
                    Details.push({
                        DiscountAmount: 0.00,// 优惠活动、整单优惠、抹零优惠之和,
                        CouponAmount: 0.00,//优惠券优惠,
                        Staffs: itm.Staffs == null ? [] : itm.Staffs,// 提成员工,
                        BatchCode: "",// 计次批次好,
                        GoodsID: itm.Id,//商品ID,
                        GoodsType: itm.GoodsType,//商品类型,
                        GoodsCode: itm.GoodsCode,// 商品编号,
                        GoodsName: itm.GoodsName,// 商品名称,
                        DiscountPrice: Specials,//折扣价,
                        Number: itm.Number,// 数量,
                        TotalMoney: parseFloat(itm.TotalMoney).toFixed(2),// 总金额,
                        IndustryObjectID: item.Id,//场馆开台ID,
                        StartTime: 0,//开始时间,
                        EndTime: 0,// 结束时间
                        IsModify: itm.IsModify//是否手动修改价格
                    })
                })

            })
            var param = {
                Order: Order,
                Payments: Payments,
                Activities: Activities,
                Conpons: Conpons,
                Details: Details,
                MainID: MainID,
                MemberPwd: MemberPwd
            }
            console.log(param)
            debugger
            $.http.post(LuckVipsoft.api.VenueConsume, param, user.token, function (res) {
                debugger
                if (res.status == 1) {

                }
            })

        },


    }

    //支付
    var pay = {
        init:function(){
            var _this=this;
            _this.payPopArea();
            _this.initPayItem();
            //立即结账
            $("body").on("click", "#btnVenueConsume", function () {
                venue.choosedStaffAry =[]
                venue.closePopup();
                _this.openPayPopup();
            });
        },
        //打开收银弹窗
        openPayPopup: function () {
            var result = venue.VenueConsumeData();
            var data = {
                member: member == null ? {} : member,//会员
                chooseBirthdayActivity: venue.chooseBirthdayActivity == null ? {} : venue.chooseBirthdayActivity,//生日优惠
                chooseActivity: venue.chooseActivity == null ? {} : venue.chooseActivity//活动方案
            }
            oPayCompose.goPayVenue(result,data, function () {
                var mdata = {}
                $('.pay_item').removeClass('border-red')

                //会员信息
                if (oPayCompose.chooseMember.Id == undefined) {
                    mdata.mid = 0
                }
                else {
                    //会员信息
                    mdata.mid = oPayCompose.chooseMember.Id
                    mdata.cardname = oPayCompose.chooseMember.CardName
                    mdata.mobile = oPayCompose.chooseMember.Mobile
                    mdata.levelname = oPayCompose.chooseMember.LevelName
                    mdata.point = oPayCompose.chooseMember.Point
                    mdata.money = oPayCompose.chooseMember.Money
                    if (oPayCompose.chooseMember.Avatar == '' || oPayCompose.chooseMember.Avatar == undefined) {
                        mdata.avatar = '../../../Theme/images/morentouxiang.svg'
                    }
                    else {
                        mdata.avatar = user.information.ImageServerPath + oPayCompose.chooseMember.Avatar
                    }
                }

                var html = template('memberTmp', mdata);
                $('#pb_vipInfo').html(html)

                layer.open({
                    type: 1,
                    id: "orderPay",
                    title: '收银结账',
                    closeBtn: 1,
                    shadeClose: false,
                    shade: 0.3,
                    maxmin: false,//禁用最大化，最小化按钮
                    resize: false,//禁用调整大小
                    area: ['90%', '80%'],
                    skin: "lomo-ordinary",
                    content: $(".lomo-cashier"),
                })
                $("body").find(".cashier-num-b[class='active'] input").focus();
            })
        },
        //初始化支付项
        initPayItem: function () {
            var html = ''
            $.each(user.sysArgument.PaymentConfig, function (index, item) {
                html += '<li data-code="' + item.code + '" id="pay_item_' + item.code + '" class="pay_item"><a style="background: url(../../../Theme/images/pay/' + item.icon + ') no-repeat center 10px;" href="#">' + item.name + '</a></li>'
            });
            $("#pay").html(html)
            $(".pay_item").bind("click", function () {
                var code = $(this).attr('data-code')
                if (oPayCompose.chooseMember.Id == undefined && (code == '002' || code == '003' || code == '999')) {
                    $.luck.error('会员才可用 积分、余额、优惠券 支付')
                    return false
                }

                if (oPayCompose.payMaxCount(code, 3)) {
                    $.luck.error('最多只能选择3中支付方式')
                    return false
                }

                var result = oPayCompose.selectPay(code)
                //重新渲染 -> cashier-num

                if (!result) {
                    $.luck.error(code)
                }
            });
        },
        //收银结账相关弹层
        payPopArea: function () {
            var _this = this;
            var curEditMoneyDom = null;
            //整单优惠
            $(".cashier-way .way7").on("click", function () {
                //应收 ，最大金额			
                var maxMoney = (oPayCompose.result.amountDiscountMoney - oPayCompose.result.amountActivityMoney).toFixed(2)
                $('#single_amount').html(maxMoney)
                if (oPayCompose.result.amountModifyMoney > 0) {
                    console.log('oPayCompose.modificationInfo', oPayCompose.result.modificationInfo)
                    $('#single_discount_val').val(oPayCompose.result.modificationInfo.val)
                    $('#single_discount_mode').val(oPayCompose.result.modificationInfo.mode)
                    $('#single_discount_money').val(oPayCompose.result.modificationInfo.money)
                }
                else {
                    $('#single_discount_val').val('0.00')
                    $('#single_discount_mode').val(2)
                    $('#single_discount_money').val('0.00')
                }
                form.render()

                layer.open({
                    type: 1,
                    id: "singleDiscount",
                    title: '整单优惠',
                    closeBtn: 1,
                    shadeClose: false,
                    shade: 0.3,
                    maxmin: false,//禁用最大化，最小化按钮
                    resize: false,//禁用调整大小
                    area: ['500px', 'auto'],
                    btn: ['确认', '取消'],
                    skin: "lomo-ordinary",
                    content: $(".single-discount"),
                    yes: function (index) {
                        var diffVal = $('#single_discount_money').val()
                        var val = $('#single_discount_val').val()
                        var mode = $('#single_discount_mode').val()
                        var dis = math.chain(oPayCompose.result.amountDiscountMoney).subtract(oPayCompose.result.amountActivityMoney).subtract(parseFloat(diffVal)).done().toFixed(2)

                        var info = { val: val, mode: mode, money: diffVal }
                        oPayCompose.settingModify(dis, info)
                        layer.close(index)
                    },
                    btn2: function () {
                    }
                })
            });

            //整单金额输入框
            $("#single_discount_val").on('change', function () {
                var val = $(this).val()
                if (!/(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/.test(val)) {
                    $.luck.error('只能输入数字，小数点后只能保留两位');
                    $(this).val('');
                    return false
                }
                var maxMoney = (oPayCompose.result.amountDiscountMoney - oPayCompose.result.amountActivityMoney).toFixed(2)
                val = parseFloat(val)

                var mode = $('#single_discount_mode').val()
                console.log('mode', mode)

                if (mode == 2) {
                    if (val > maxMoney) {
                        $('#single_discount_val').val(maxMoney)
                        $('#single_discount_money').val('0.00')
                        return false
                    }
                    else {
                        var newVal = (maxMoney - val).toFixed(2)
                        $('#single_discount_money').val(newVal)
                    }
                }
                else {
                    console.log('val', val)
                    if (val < 0 || val > 10) {
                        $.luck.error('比例只能时0-10内的数字');
                        $(this).val('');
                        $('#single_discount_money').val('0.00')
                        return false
                    }
                    val = val.toFixed(1)
                    console.log(val)
                    $(this).val(val);
                    var newVal = (maxMoney * (val / 10)).toFixed(2)
                    $('#single_discount_money').val(newVal)
                }
            });

            //取消整单优惠
            $("#single_cancel").on('click', function () {
                $('#single_discount_val').val('0.00')
                $('#single_discount_money').val('0.00')
                oPayCompose.cancelModify()
            });

            //整单提成单位选中
            form.on('select(single_discount_money)', function (data) {
                $('#single_discount_val').val('0.00')
                $('#single_discount_money').val('0.00')
                //重置
                oPayCompose.cancelModify()
            });

            //整单提成
            $(".cashier-way .way8").on("click", function () {
                layer.open({
                    type: 1,
                    id: "billLading",
                    title: '整单提成',
                    closeBtn: 1,
                    shadeClose: false,
                    shade: 0.3,
                    maxmin: false,//禁用最大化，最小化按钮
                    resize: false,//禁用调整大小
                    area: ['80%', 'auto'],
                    btn: ['确认', '取消'],
                    skin: "lomo-ordinary",
                    content: $(".bill-lading"),
                    success: function () {	
                        chooseStaff  = Object.assign([],oPayCompose.result.staffs)
                        $("body").find('.staff-list li').removeAttr("class");
                        $.each( chooseStaff, function (index, item) {
                            $("body").find('.staff-list li[data-id="' + item.StaffId + '"]').toggleClass("active");
                        })
                        tab_staff.reload({
                            data: chooseStaff
                        });
						
                        //初始
                        var html = '';				
                        $(".staffname").remove(); 	
                        _this.choosedStaffAry = Object.assign([],chooseStaff)					  
                        $.each(chooseStaff, function (index, item) {
                            html += '<span class="name staffname" data-id="' + item.StaffId + '">' + item.StaffName + '<i class="deletStaff">x</i></span>'
                        })
                        $(".lomo-tcyg-add .nameTitle").after(html);
						
                        element.render();
                    },
                    yes: function (index) {							
                        oPayCompose.settingOrderStaffs(_this.choosedStaffAry)
                        console.log('_this.choosedStaffAry',_this.choosedStaffAry)						
                        layer.close(index)						
                    },
                    btn2: function () {

                    }
                })
            });

            //备注
            $(".cashier-way .way9").on("click", function () {
                layer.open({
                    type: 1,
                    id: "billLading",
                    title: '备注',
                    closeBtn: 1,
                    shadeClose: false,
                    shade: 0.3,
                    maxmin: false,//禁用最大化，最小化按钮
                    resize: false,//禁用调整大小
                    area: ['500px', 'auto'],
                    btn: ['确认', '取消'],
                    skin: "lomo-ordinary",
                    content: '<div class="pd20"><textarea placeholder="收银备注" id ="pay_remark" class="layui-textarea" name="" cols="" rows="3">' + oPayCompose.remark + '</textarea></div>',
                    yes: function (index) {
                        var remark = $("#pay_remark").val()
                        oPayCompose.remark = remark
                        layer.close(index)
                    },
                    btn2: function () {
                    }
                })
            });

            //重新选择优惠券
            $("body").on("click", ".paySelectCoupon", function () {
                layer.open({
                    type: 1,
                    id: "chooseCounpon",
                    title: '重选优惠券',
                    closeBtn: 1,
                    shadeClose: false,
                    shade: 0.3,
                    maxmin: false,//禁用最大化，最小化按钮
                    resize: false,//禁用调整大小
                    area: ['80%', '80%'],
                    btn: ['确认', '取消'],
                    skin: "lomo-ordinary",
                    content: $(".lomo-yhq"),
                    success: function () {
                        var couponTable = table.render({
                            elem: '#coupoonList',
                            page: true,
                            data: coupoonListAry,
                            cellMinWidth: 95,
                            cols: [
								[
									{type:'checkbox'},
									{ field: 'Title', title: '名称', align: 'center' },
									{ field: 'ConponCode', title: '券号',  align: 'center' },
									{ field: 'ValidType', title: '券类型',  align: 'center' },
									{ field: 'Quota', title: '优惠金额',  align: 'center' },
									{ field: 'WithUseAmount', title: '最低消费',  align: 'center' },
								]
                            ]
                        }); 
                    },
                    yes: function (index, layero) {
                        console.log('chooseAry',oPayCompose.pageChooseConpon)
                        if(oPayCompose.pageChooseConpon.length>0){
                            var postData = oPayCompose.postCouponData() //获取优惠券提交数据
                            console.log('postData',JSON.stringify(postData))
                            $.http.post(LuckVipsoft.api.CalculateConponAmount, postData, user.token, function (res) {
                                if(res.status ==1){
                                    if(oPayCompose.settingCoupon(res.data)){
                                        layer.close(index)
                                    }
                                    else{
                                        $.luck.error('优惠卷计算错误')
                                    }
                                }
                                else{
                                    $.luck.error(res.msg)
                                }
                            })
                        }
                        return false
                    }
                })
                //var chooseAry = [];
                table.on('checkbox(coupoonList)', function (obj) {	
                    var paidMoney = parseFloat(oPayCompose.paidMoney())		
					
                    var checkStatus = table.checkStatus('coupoonList');
                    if (obj.type=="one") {
                        if (obj.checked == true) {
                            if(obj.data.WithUseAmount >	paidMoney){
                                $.luck.error('当前优惠券不满足使用条件');
                                $(this).prop("checked",false);
                                form.render('checkbox')
                                return false
                            }else{						
                                oPayCompose.pageChooseConpon.push(obj.data);
                            }
                        }else {
                            $.each(oPayCompose.pageChooseConpon, function (index, item) {
                                if (item.Id == obj.data.Id) {
                                    oPayCompose.pageChooseConpon.splice(index, 1)
                                    return
                                }
                            })
                        }
                        console.log(oPayCompose.pageChooseConpon)
                    }else { // 表示全选
                        if (obj.checked == true) {
                            var data = checkStatus.data;
                            layer.alert(JSON.stringify(data));
                        }else {
							
                        }
                    }
					
                })
            });

            //点击结算：微信或支付宝付款时用
            $("body").on("click", "#finishPayBtn", function () {
                if (oPayCompose.validPayMoney() < 0) {
                    console.log('oPayCompose.validPayMoney()', oPayCompose.validPayMoney())
                    $.luck.error('付款金额不足,无法完成支付')
                    return false
                }
                var pwd = $("#pay_pwd").val()	

                var item = Enumerable.From(oPayCompose.payItem).Where(function (x) {
                    if (x.code == '020' || x.code == '010') {
                        return true;
                    }
                    return false;
                }).FirstOrDefault();
                if (item != undefined) {
                    $('#paymentCode').val('')
                    $('#onlinePayMoney').html(item.amount)
                    //item.amount
                    layer.open({
                        type: 1,
                        id: "payBox",
                        title: '支付',
                        closeBtn: 1,
                        shadeClose: false,
                        shade: 0.3,
                        maxmin: false,//禁用最大化，最小化按钮
                        resize: false,//禁用调整大小
                        area: ['500px', '300px'],
                        btn: ['确认', '取消'],
                        skin: "lomo-ordinary inherit",
                        content: $(".paybox"),
                        yes: function (index, layero) {
                            if ($('#paymentCode').val() == '') {
                                $.luck.error('请输入付款码')
                                return false
                            }
                            else {
                                var payCode = $('#paymentCode').val()
                                var result = onlinePay(item.amount, item.code, payCode, user.token).then(
									function (res) {
									    console.log('res->then', res)
									    if (res.status == 1) {
									        var postData = oPayCompose.postPayData(pwd, '')
									        $.http.post2(LuckVipsoft.api.VenueConsume, postData, user.token, function (res2) {
									            if (res2.status == 1) {
									                //打印小票
									                TicketPrint(JSON.stringify(res.data), 5);
									                layer.alert('支付完成', { icon: 1, closeBtn: 0 }, function (index) {
									                    venue.countProductNum(1);
									                    venue.clearData();
									                });
									            }
									            else {
									                layer.alert(res2.msg, { icon: 2, closeBtn: 0 }, function (index) {
									                    layer.close(index)
									                });
									            }
									        })
									    }
									    else if (res.status == 3) {
									        //let queryResult = setTimeout(queryPay(outTradeNo,payType,token), 2000); 																		 
									    }
									    else {
									        layer.alert(res.return_msg, { icon: 2, closeBtn: 0 }, function (index) {
									            layer.close(index)
									        });
									    }
									}
								)
                            }
                        },
                        btn2: function (index, layero) {
                            layer.close(index);
                            return false;
                        }
                    })
                }
                else {
                    //格式化代码
                    var postData = oPayCompose.postVenueData(pwd, venue.MainID)
                    debugger
                    $.http.post(LuckVipsoft.api.VenueConsume, postData, user.token, function (res) {
                        if (res.status == 1) {
                            //打印小票
                            TicketPrint(JSON.stringify(res.data), 5);
                            layer.alert('支付完成', { icon: 1, closeBtn: 0 }, function (index) {
                                venue.countProductNum(1);
                                venue.clearData();
                            });
                        }
                        else {
                            layer.alert(res.msg, { icon: 2, closeBtn: 0 }, function (index) {
                                layer.close(index)
                            });
                        }
                    })
                }
            });

            //输入框选中
            $("body").on("click", ".cashier-num-b li", function () {
                curEditMoneyDom = $(this);
                curPayCode = $(this).attr('data-code') //选中的支付输入框
                var result = oPayCompose.selectPayInput(curPayCode)
            });

            //金额输入框
            $("body").on("input", ".moneyInput", function (event) {
                console.log(event)
                var val = $(this).val()
                var oldVal = $(this).attr('data-old')

                if (val == '') {
                    val = 0
                    $(this).val(0)
                }

                if (isNaN(val)) {
                    val = 0
                    $(this).val(0)
                }
                console.log('val', val)
                if (val.length!= undefined) {				
                    if (val.charAt(val.length - 1) == '.') { return false }
                }
			
                // if(patch('.',val) >2){
                // 	//截断后面的小数点
                // 	//$(this).val(new)	
                // 	return false
                // }
				
                val = parseFloat(val)
                oldVal = parseFloat(oldVal)
                if (!/(^[1-9]([0-9]+)?(\.[0-9]{0,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/.test(val)) {
                    $(this).val(oldVal)
                    $.luck.error('金额只能时2位小数')
                    return false
                }

                if (val != oldVal) {
                    var result = oPayCompose.changePayMoney(oPayCompose.curPayItem, val)
                }
            });

            //抹零设置
            $("body").on("click", ".settingZero", function () {
                oPayCompose.settingZeroAmount();
            });

            //小键盘及金额计算
            $(".cashier-keyboard li").on("click", function () {
                var val = $(this).text();
                if (oPayCompose.curPayItem == '') {
                    $.luck.error('请选中支付输入框')
                    return false;
                }

                if (oPayCompose.curPayItem == '999') {
                    $.luck.error('请选择优惠券')
                    return false;
                }

                var oldVal = $("#pay_input_" + oPayCompose.curPayItem).val()
                if (val == '.') {
                    oldVal += val
                    $("#pay_input_" + oPayCompose.curPayItem).val(oldVal)
                    return false;
                }

                if (val == '←') {
                    if (oldVal.length <= 1) {
                        oldVal = 0
                    }
                    else {
                        oldVal = oldVal.substr(0, oldVal.length - 1);
                    }
                }
                else if (val == '100.00' || val == '200.00' || val == '500.00') {
                    oldVal = val
                }
                else {
                    oldVal += val
                }

                oldVal = parseFloat(oldVal)
                if (!/(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/.test(oldVal)) {
                    $.luck.error('金额只能是2位小数')
                    return false
                }

                if (oldVal == '') { oldVal = 0 }
                var result = oPayCompose.changePayMoney(oPayCompose.curPayItem, oldVal)
            });

        },

    }

    //支付相关参数计算完成函数回调
    oPayCompose.finishCallback = function () {
        console.log("支付相关参数计算完成函数回调")
        console.log('oPayCompose.result', oPayCompose.result)

        var amountDiscountMoney = parseFloat(oPayCompose.result.amountDiscountMoney)
        var amountActivityMoney = parseFloat(oPayCompose.result.amountActivityMoney)
        var amountModifyMoney = parseFloat(oPayCompose.result.amountModifyMoney)
        var allPayMoney = parseFloat(oPayCompose.result.allPayMoney)
        var zeroAmount = parseFloat(oPayCompose.result.zeroAmount)

        var paid = math.chain(amountDiscountMoney).subtract(amountActivityMoney).subtract(amountModifyMoney).subtract(zeroAmount).subtract(allPayMoney).done().toFixed(2)
        //01.payInfoTmp 渲染
        dataResult = {
            isZero: oPayCompose.result.isZeroAmount,
            isOpenZero: oPayCompose.config.IsAllowModifyOrderTotal,
            amount: amountDiscountMoney.toFixed(2),	//应收
            paid: paid >= 0 ? paid : 0.00, //待收
            discount: math.chain(amountActivityMoney).add(amountModifyMoney).add(zeroAmount).done().toFixed(2), //优惠
            payItem: oPayCompose.payItem, //支付列表 
            curPayItem: oPayCompose.curPayItem //当前选中支付方式
        }
        var html = template('payInfoTmp', dataResult);
        $('#cashier-num').html(html)

        $('.pay_item').removeClass('border-red')

        $.each(oPayCompose.payItem, function (index, item) {
            $('#pay_item_' + item.code).addClass('border-red')
        })

        if (oPayCompose.curPayItem != 999) {
            var oInput = $("#pay_input_" + oPayCompose.curPayItem)
            var value = oInput.val()
            oInput.val('').focus().val(value)
        }
    }



    initPage();
})



