layui.use(['layer', 'jquery', "form", 'table'], function () {
    var layer = layui.layer, $ = layui.$, form = layui.form, table = layui.table;

    var user = {
        token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
        information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
        staffClass: $.session.get("staffClass") ? $.session.get("staffClass") : null,
        staffInf: $.session.get("staffInf") ? $.session.get("staffInf") : null,
        sysArgument: $.session.get("sysArgument") ? $.session.get("sysArgument") : null,
    }
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
        searchType:1,//1商品 2套餐
        key: '', //商品条码
        classId: '', //产品类目Id(一级，二级)
        regionId: '', //区域ID
        parent: [],//一级菜单
        children: [],//二级菜单
        venue: null,//选中的场馆信息
        changedVenueType: 1,//1场地更换 2合并账单
        venueRestingGoods: null,//挂单数据

        orderVenueDetailList: [//场馆购物车列表
            {
                Id: "",//场馆消费订单详情ID
                MainID: "",//主开台ID
                VenueID: "",//场馆ID
                VenueName: "",//场馆名称
                Price: 0,//单价
                Specials: 0,//会员特价
                StartTime: 0,//计时产品开始时间
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
                    //    StockNum:0//库存
                    //}
                ]
            }
        ],
        payMoneyInfo:{//结算信息
            TotalMoney :0,//总金额
            DiscountMoney :0,//实付金额
            TotalPoint :0,//获得积分
            PreferentialAmount :0,//优惠金额
            GoodsNum: 0//商品数量
        },
        //"Venue":"{\"Id\":开台ID,\"VenueID\":场馆ID,\"VenueName\":场馆名称,\"Price\":单价,\"StartTime\":开始时间,\"EndTime\":结束时间,\"TotalMoney\":总金额,\"DiscountAmount\":优惠金额,\"CouponAmount\":优惠券优惠金额,\"MemID\":会员ID}","Details":"[{\"DiscountAmount\":优惠金额,\"CouponAmount\":优惠券优惠金额,\"Staffs\":提成员工,\"BatchCode\":批次号,\"GoodsID\":商品ID,\"GoodsType\":商品类型,\"GoodsCode\":商品编号,\"GoodsName\":商品名称,\"DiscountPrice\":折扣价,\"Number\":数量,\"TotalMoney\":总价}]"
        init: function () {
            var _this = this;
            _this.initClick();//点击事件
            _this.countProductNum(1);//计算每屏显示产品个数 type==1 场馆 ==2商品
            _this.GetVenueRegionList();//获取场馆区域列表
            _this.VenueRegionSlide();//场馆区域滑动
            _this.searchMemCard();//查询会员
        },
        //点击事件
        initClick:function(){
            _this=this;
            /*清除获取的会员*/
            $("body").on("click",'.vip-delete img',function (e) {
                member=null;
                http.cashierEnd.delMembers('.lomo-mian-left .vipInfo', 'member');
                $(".check-box-list .birthday").remove();
                $(".lomo-order").css({"top":"0","margin-top":"0"});
            });
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
                if (status == 0) {

                } else if (status == 1) {
                    _this.BindOpenVenueHtml();
                } else if (status == 2) {
                    _this.GetVenueOrderInfo();
                } else if (status == 3) {

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
            $("#subChangedVenue").on("clcik", function () {
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
                _this.countProductNum(2);
                _this.BindVenueRestingHtml();
                _this.GetGoodsClassList();//获取商品分类
                _this.ClassSlide();//一级商品分类滑动
                _this.ClassTwoSlide();//二级商品分类滑动
            });
            //挂单产品切换到场地
            $("body").on("click", "#backVenue", function () {
                $(".venue-product-area").hide();
                $(".venue-area").show();
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
                    StockNum: goodsData.StockNum//库存
                };
                var flag = 0;
                //判断购物车中是否存在
                if (_this.venueRestingGoods.VenueGoodsList.length > 0) {
                    $.each(_this.venueRestingGoods.VenueGoodsList, function (index, item) {
                        if (item.Id == VenueGoods.Id) {
                            flag=1;
                            var num=accAdd(item.Number,1);
                            if (num > item.StockNum && item.GoodsType == 1) {
                                $.luck.error("产品库存不足");
                                return false;
                            }
                            item.Number = num;
                            //item.TotalMoney = accMul(item.DiscountPrice, num);
                            $(".venue-product-area .venue-pro-list [data-id='" + item.Id + "']").find(".order-nub").text(num);
                            return false;
                        }
                    })
                }
                if (_this.venueRestingGoods.VenueGoodsList.length == 0 || flag == 0) {
                    _this.venueRestingGoods.VenueGoodsList.push(VenueGoods);
                    var html = '';

                    html += '<dl data-id="' + VenueGoods.Id + '" data-stocknum="' + VenueGoods.StockNum + '">';
                    html += '<dt> <span class="order-reduce">-</span> <span class="order-nub">1</span> <span class="order-add">+</span> </dt>';
                    html += '<dd>';
                    if (VenueGoods.GoodsType == 1) {
                        html += '<i class="colorIcon blue">库</i>';
                    }
                    if (VenueGoods.GoodsType == 2) {
                        html += '<i class="colorIcon green">服</i>';
                    }
                    html += '<div class="order-name">';
                    html += '<h1>' + VenueGoods.GoodsName + '</h1>';
                    if (member == null) {
                        html += '<span>单价: <i>¥' + VenueGoods.Price + '</i></span>';
                    } else {
                        html += '<span>单价: <i>¥' + VenueGoods.Specials + '</i> <b>¥' + VenueGoods.Price + '</b></span>';
                    }
                    html += '</div>';
                    html += '</dd>';
                    html += '</dl>';
                    $(".venue-product-area .venue-pro-list").append(html);
                }
            });
            //购物车增加数量
            $("body").on("click", ".order-add", function () {
                var dl = $(this).parent().parent();
                var goodId = $(dl).attr("data-id");
                var stocknum = $(dl).attr("data-stocknum");
                $.each(_this.venueRestingGoods.VenueGoodsList, function (index, item) {
                    if (item.Id == goodId) {
                        var num = accAdd(item.Number, 1);
                        if (num > stocknum && item.GoodsType == 1) {
                            $.luck.error("产品库存不足");
                            return;
                        }
                        item.Number = num;
                        //item.TotalMoney = accMul(item.DiscountPrice, num);

                        $(".venue-product-area .venue-pro-list [data-id='" + item.Id + "']").find(".order-nub").text(num);
                        return;
                    }
                })
            });
            //购物车减少数量
            $("body").on("click", ".order-reduce", function () {
                var dl = $(this).parent().parent();
                var goodId = $(dl).attr("data-id");
                $.each(_this.venueRestingGoods.VenueGoodsList, function (index, item) {
                    if (item.Id == goodId) {
                        var num = accSub(item.Number, 1);
                        if (num == 0) {
                            _this.venueRestingGoods.VenueGoodsList.splice(index, 1);
                            $(".venue-product-area .venue-pro-list dl[data-id=" + item.Id + "]").remove();
                            return false;
                        }
                        item.Number = num;
                       // item.TotalMoney = accMul(item.DiscountPrice, num);
                        $(".venue-product-area .venue-pro-list [data-id='" + item.Id + "']").find(".order-nub").text(num);
                        return false;
                    }
                })
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

            //关闭弹出框
            $(".divTitle span").on("click", function () {
                var box = $(this).parent().parent();
                cashier.close(box, 'fadeIn', 'fadeOut', '.lomo-mask-body');
            });
            $(".submit-bt-clear").on("click", function () {
                var box = $(this).parent().parent().parent().parent()
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
                            html += '<div><span>' + item.CardName + ' ' + item.LevelName + '</span>';
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
                                _this.BindMemVenueHtml();
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
                                                    _this.BindMemVenueHtml();
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
                                        $('.lomo-members-search #search').on('click', function (e) {
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
                    $.luck.success(function(){
                        layer.closeAll();
                    });
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
            $.luck.confirm(str,function(){
                $.http.post(LuckVipsoft.api.ModifyVenueState, param, user.token, function(res) {
                    if(res.status==1){
                        _this.countProductNum(1);
                        $.luck.success(function(){
                            layer.closeAll();
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
                UnionVenueIds: venueId
            }
            $.http.post(LuckVipsoft.api.VenueUnionBill, param, user.token, function(res) {
                if(res.status==1){
                    _this.countProductNum(1);
                    $.luck.success(function(){
                        layer.closeAll();
                    });
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
            $.luck.confirm(str, function () {
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
                            StartTime: detail.StartTime,//计时产品开始时间
                            IsMainVenue: 1,//是否主场馆
                            VenueGoodsList:[]
                        }
                        _this.orderVenueDetailList = [];
                        _this.orderVenueDetailList.push(orderVenueDetail);
                        _this.BindConsumeVenueHtml();

                        $.luck.success(function () {
                            layer.closeAll();
                        });
                    } else {
                        $.luck.error(res.msg);
                    }
                })
            })
        },
        //点击场地取单
        GetVenueOrderInfo: function () {
            var _this = this;
            if (_this.venue == null) {
                $.luck.error("请先选择场地");
                return false;
            }
            $.http.post(LuckVipsoft.api.GetVenueMemberAndGoodsInfo, { VenueID: _this.venue.Id }, user.token, function (res) {
                if (res.status == 1) {
                    member = res.data.memInfo;
                    _this.orderVenueDetailList = [];
                    _this.orderVenueDetailList = res.data.venueList;
                    _this.payMoneyInfo = res.data.payMoneyInfo;
                    _this.BindConsumeVenueHtml();

                    $.luck.success(function () {
                        layer.closeAll();
                    });
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
            if (venueRG.VenueGoodsList == null && venueRG.VenueGoodsList.length == 0) {
                return;
            }
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
                    TotalMoney: item.TotalMoney
                }
                Details.push(details);
            })
            
            var param = {
                Venue: Venue,
                Details: Details
            }
            $.http.post(LuckVipsoft.api.SaveVenueRestingGoods, param, user.token, function (res) {
                if (res.status == 1) {
                    _this.countProductNum(1);
                    _this.GetVenueOrderInfo();
                    $.luck.success();
                } else {
                    $.luck.error(res.msg);
                }
            })

        },


        //结算购物车界面
        BindConsumeVenueHtml: function () {
            var html = "";
            if (_this.orderVenueDetailList.length > 0 && _this.orderVenueDetailList.Id != "") {
                $.each(_this.orderVenueDetailList, function (index, item) {
                    html += '<div class="order-list">';
                    //场地信息
                    html += '<dl>';
                    if (item.IsMainVenue == 1) {
                        html += '<dt class="addnew"><button id="addProductVenue" class="add-bt" style="width: 100%;">添加商品</button></dt>';
                    }
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
                        html += '<span class="size-gray">单价: <i>¥' + item.Price + '</i></span>';
                    } else {
                        html += '<span class="size-gray">单价: <i>¥' + item.Specials + '</i> <b>¥' + item.Price + '</b></span>';
                    }
                    html += '</div>';
                    html += '</dd>';
                    html += '</dl>';
                    //商品信息
                    html += '<div class="order-list venue-pro-list">';
                    if (item.VenueGoodsList != null && item.VenueGoodsList.length > 0) {
                        $.each(item.VenueGoodsList, function (inx,itm) {
                            html += '<dl>';
                            html += '<dt><span class="order-nub fr">' + itm.Number + '</span></dt>';
                            html += '<dd>';
                            if(itm.GoodsType==1){//普通产品
                                html += '<i class="colorIcon blue">库</i>';
                            } else if (item.GoodsType == 2) {//服务
                                html += '<i class="colorIcon green">服</i>';
                            }
                            html += '<div class="order-name">';
                            html += '<h1>' + itm.GoodsName + '</h1>';
                            if (member == null) {
                                html += '<span>单价: <i>¥' + itm.Price + '</i></span>';
                            } else {
                                html += '<span>单价: <i>¥' + itm.Specials + '</i> <b>¥' + itm.Price + '</b></span>';
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
                $("#spanTotalPoint").html(cashier.MoneyPrecision(_this.payMoneyInfo.TotalPoint));
                if (member == null) {
                    $("#spanDiscountMoney").html(cashier.MoneyPrecision(_this.payMoneyInfo.TotalMoney));
                    $("#smallTotalMoney").hide();
                } else {
                    $("#spanDiscountMoney").html(cashier.MoneyPrecision(_this.payMoneyInfo.DiscountMoney));
                    $("#spanTotalMoney").html(cashier.MoneyPrecision(_this.payMoneyInfo.TotalMoney));
                    $("#smallTotalMoney").show();
                }
                $("#spanPreferentialAmount").html(cashier.MoneyPrecision(_this.payMoneyInfo.PreferentialAmount));
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
        },
        //挂单购物车界面
        BindVenueRestingHtml: function () {
            var _this = this;
            var html = "";
            if (_this.orderVenueDetailList.length > 0 && _this.orderVenueDetailList.Id != "") {
                $.each(_this.orderVenueDetailList, function (index, item) {
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
                            html += '<span class="size-gray">单价: <i>¥' + item.Price + '</i></span>';
                        } else {
                            html += '<span class="size-gray">单价: <i>¥' + item.Specials + '</i> <b>¥' + item.Price + '</b></span>';
                        }
                        html += '</div>';
                        html += '</dd>';
                        html += '</dl>';
                        //商品信息
                        html += '<div class="order-list venue-pro-list">';
                        if (item.VenueGoodsList != null && item.VenueGoodsList.length > 0) {
                            $.each(item.VenueGoodsList, function (inx, itm) {
                                html += '<dl data-id="' + itm.GoodsID + '" data-stocknum="' + itm.StockNum + '">';
                                html += '<dt>';
                                html += '<span class="order-reduce">-</span>';
                                html += '<span class="order-nub">' + itm.Number + '</span>';
                                html += '<span class="order-add">+</span>';
                                html += '</dt>';
                                html += '<dd>';
                                if (itm.GoodsType == 1) {//普通产品
                                    html += '<i class="colorIcon blue">库</i>';
                                } else if (item.GoodsType == 2) {//服务
                                    html += '<i class="colorIcon green">服</i>';
                                }
                                html += '<div class="order-name">';
                                html += '<h1>' + itm.GoodsName + '</h1>';
                                if (member == null) {
                                    html += '<span>单价: <i>¥' + itm.Price + '</i></span>';
                                } else {
                                    html += '<span>单价: <i>¥' + itm.Specials + '</i> <b>¥' + itm.Price + '</b></span>';
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
                html += '<span class="size-gray">单价: <i>¥' + _this.venue.price + '</i></span>';
            } else {
                html += '<span class="size-gray">单价: <i>¥' + _this.venue.specials + '</i> <b>¥' + _this.venue.price + '</b></span>';
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
            } else if (type == 2) {//结账
                $("#divOrderPayItem").show();
                $("#btnOpenVenue").hide();
                $("#btnVenueRestingGoods").hide();
                $("#btnVenueConsume").show();
            }
        },
        //会员刷卡场馆信息变更
        BindMemVenueHtml: function () {
            var _this = this;
            if (member == null) {
                $.luck.error("请先刷会员卡");
                return false;
            }
            _this.BindOpenVenueHtml();

        },
        //会员价格计算
        MemberSpecials: function () {

        },
    }

    initPage();
})



