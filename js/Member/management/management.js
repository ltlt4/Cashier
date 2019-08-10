layui.use(['layer', 'jquery', "form", 'laypage', 'laydate'], function () {
    var layer = layui.layer;
    var $ = layui.$;
    var form = layui.form;
    var laypage = layui.laypage;
    var laydate = layui.laydate;
    var user = {
        token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
        information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
        PaymentConfig: $.session.get("Cashier_User").SysArguments.PaymentConfig,
    }
    //选项卡切换
    $(".lomoTab span").on("click", function () {
        $(this).addClass("hover").siblings().removeClass("hover");
        var index = $(this).index();
        $(".lomoTab-warp").eq(index).show().siblings(".lomoTab-warp").hide()
    })

    class Bill {
        constructor() {
            this.list = [];
            this.minTime = '';
            this.minTime = '';
        }
        start(data) {
            this.type = data.type;
            this.name = data.name;
            this.url = data.url;
            this.form(this.name);
            this.search(this.name, this.url, this.type);
            this.election(this.name, this.minTime, this.maxTime);
            this.details(this.name, this.url, this.type);
            this.getList(this.name, this.url, this.type, {
                field: {}
            });
        }
        //计算选择日期
        _time() {
            var g = 0
            $(".lomoTab span").each(function () {
                if ($(this).hasClass("hover")) {
                    g = $(this).index()
                }
            });
            var time1 = cashier.revDateFormat($(".lomoTab-warp").eq(g).find('.time-start').val());
            var time2 = cashier.revDateFormat($(".lomoTab-warp").eq(g).find('.time-end').val());
            return [time1, time2];

        };
        //选择日期最大
        getMaxTime(dtTime, numDay) {
            var date = new Date(dtTime);
            var lIntval = parseInt(numDay);
            if (!isNaN(lIntval) && lIntval !== 0) {
                date.setDate(date.getDate() + lIntval);
            }

            var year = date.getYear();
            var month = date.getMonth() + 1;
            if (month < 10) {
                month = "0" + month;
            }
            var day = date.getDate();
            if (day < 10) {
                day = "0" + day;
            }
            var dates = (year < 1900 ? (1900 + year) : year) + '-' + month + '-' + day + ' 23:59:59';//日期最大限制
            return dates;
        };
        //选择日期最小
        getMinTime(dtTime, numDay) {
            var date = new Date(dtTime);
            var lIntval = parseInt(numDay);
            if (!isNaN(lIntval) && lIntval !== 0) {
                date.setDate(date.getDate() + lIntval);
            }

            var year = date.getYear();
            var month = date.getMonth() + 1;
            if (month < 10) {
                month = "0" + month;
            }
            var day = date.getDate();
            if (day < 10) {
                day = "0" + day;
            }
            var dates = (year < 1900 ? (1900 + year) : year) + '-' + month + '-' + day + ' 00:00:00';
            return dates;
        };
        //layui初始化
        form(name) {
            var that = this
            form.render();
            var nowtime = new Date();
            var startTime = that.getMinTime(nowtime, 0);
            var endTime = that.getMaxTime(nowtime);
            that.minTime = laydate.render({
                type: "datetime",
                elem: '#' + name + 'TimeStart',
                theme: '#41c060',
                max: endTime,
                value: startTime,
                btns: ['confirm'],
                done: function (value, date, endDate) {
                    that.maxTime.config.min = date;
                    that.maxTime.config.min.month = date.month - 1;
                }
            });
            that.maxTime = laydate.render({
                type: "datetime",
                min: startTime,
                max: endTime,
                value: endTime,
                elem: '#' + name + 'TimeEnd',
                theme: '#41c060',
                btns: ['now', 'confirm'],
                done: function (value, date, endDate) {
                    that.minTime.config.max = date;
                    that.minTime.config.max.month = date.month - 1;
                }
            });
            form.verify({
                onlynum: function (value, item) {
                    if (value != "") {
                        if (!verify.money[0].test(value))
                            return '输入错误';
                    }
                },
                size: function (value2, item) {
                    var value1 = $(item).prev().val();
                    if (value2 != "" && value1 != "") {
                        if (parseFloat(value2) < parseFloat(value1)) {
                            return "最大金额输入错误"
                        }
                    };
                },
                returnGoods: function (value, item) {
                    if (value != "") {
                        var reg = /^[1-9]\d*$/;
                        if (!reg.test(value)) {
                            return '只能输入大于0的整数'
                        }
                    }
                },
                returnNumber: function (value, item) {
                    if (value != "") {
                        var productNumber = parseInt($("#productNumber").text());
                        if (value > productNumber) {
                            return "退货数量不能大于最大退货数"
                        }

                    }
                }
            });
        };
        //获取单据列表
        search(name, url, type, ) {
            var that = this
            form.on('submit(' + name + 'Req)', function (data) {
                that.getList(name, url, type, data);
                return false;
            });
        };
        getList(name, url, type, data) {
            var that = this
            var time = that._time()
            if (time[0] > time[1]) {
                layer.msg('日期选择错误');
                return false;
            }
            if (type == 0) {
                var param = {
                    OptMinTime: time[0] != '' ? time[0] : cashier.revDateFormat(cashier.curentTime(new Date(new Date(new Date().toLocaleDateString()).getTime()))),
                    OptMaxTime: time[1] != '' ? time[1] : cashier.revDateFormat(cashier.curentTime(new Date())),
                    BillCode: data.field.cardId ? data.field.cardId : "",
                    CardCode: data.field.id ? data.field.id : "",
                    PayMinQuota: data.field.minimum ? data.field.minimum : "",
                    PayMaxQuota: data.field.highest ? data.field.highest : "",
                    Remark: data.field.remarks ? data.field.remarks : "",
                    RevokeState: data.field.type ? data.field.type : 0,
                    OrderType: data.field.documentType ? data.field.documentType : 0,
                    Page: 1,
                    Rows: 7,
                }
                for (var key in param) {
                    if (param[key] == "") {
                        delete param[key];
                    };
                };
            } else {
                var param = {
                    Page: 1,
                    Rows: 7,
                    BTime: time[0] != '' ? time[0] : cashier.revDateFormat(cashier.curentTime(new Date(new Date(new Date().toLocaleDateString()).getTime()))),
                    ETime: time[1] != '' ? time[1] : cashier.revDateFormat(cashier.curentTime(new Date())),
                    BillCode: data.field.cardId ? data.field.cardId : "",
                    CardID: data.field.id ? data.field.id : "",
                    Remark: data.field.remarks ? data.field.remarks : "",
                    RevokeState: data.field.type ? data.field.type : 0
                }
                if (data.field.minimum != "") {
                    param.TotalMoney_Start = data.field.minimum;
                }
                if (data.field.highest != "") {
                    param.TotalMoney_End = data.field.highest;
                }
            }
            if (type == 0) {
                var queryList = function (data) {
                    var html = "";
                    for (var i = 0; i < data.list.length; i++) {
                        html += `<tr>
                       <td>${data.list[i].BillCode}</td>
                       <td>${cashier.dateFormat(data.list[i].CreateTime)}</td>
                       <td>${data.list[i].TypeName}</td>
                       <td>${data.list[i].CardID}</td>
                       <td>${data.list[i].CardName}</td>
                       <td>￥${data.list[i].TotalMoney}</td>
                       <td>${data.list[i].UserName}</td>
                       <td>${data.list[i].ShopName}</td>
                       <td>${data.list[i].Remark ? data.list[i].Remark : ""}</td>
                       <td><button type="button" class="add-bt online-order-bt bt-xq">详情</button><button type="button"
                           class="add-bt online-order-bt bt-cdy">重打印</button>
                       </td>
                     </tr>`
                    };
                    return html;
                };
            } else if (type == 1) {
                var queryList = function (data) {
                    var html = "";
                    for (var i = 0; i < data.list.length; i++) {
                        html += `<tr>
                   <td>${data.list[i].BillCode}</td>
                   <td>${cashier.dateFormat(data.list[i].CreateTime)}</td>
                   <td>${data.list[i].CardID}</td>
                   <td>${data.list[i].CardName}</td>
                   <td>${data.list[i].RealMoney}</td>
                   <td>${data.list[i].UserName}</td>
                   <td>${data.list[i].ShopName}</td>
                   <td>${data.list[i].Remark ? data.list[i].Remark : ""}</td>
                   <td><button type="button" class="add-bt online-order-bt bt-xq">详情</button><button type="button"
                       class="add-bt online-order-bt bt-cdy">重打印</button>
                   </td>
                 </tr>`
                    };
                    return html
                }
            } else if (type == 2) {
                var queryList = function (data) {
                    var html = "";
                    for (var i = 0; i < data.list.length; i++) {
                        html += `<tr>
                       <td>${data.list[i].BillCode}</td>
                       <td>${cashier.dateFormat(data.list[i].CreateTime)}</td>
                       <td>${data.list[i].CardID ? data.list[i].CardID : ""}</td>
                       <td>${data.list[i].CardName ? data.list[i].CardID : ""}</td>
                       <td>${data.list[i].DiscountMoney}</td>
                       <td>${data.list[i].TotalCount}</td>
                       <td>${data.list[i].UserName}</td>
                       <td>${data.list[i].ShopName}</td>
                       <td>${data.list[i].Remark ? data.list[i].Remark : ""}</td>
                       <td><button type="button" class="add-bt online-order-bt bt-xq">详情</button><button type="button"
                           class="add-bt online-order-bt bt-cdy">重打印</button>
                       </td>
                     </tr>`
                    };
                    return html
                }
            } else if (type == 3) {
                var queryList = function (data) {
                    var html = "";
                    for (var i = 0; i < data.list.length; i++) {
                        html += `<tr>
                       <td>${data.list[i].BillCode}</td>
                       <td>${cashier.dateFormat(data.list[i].CreateTime)}</td>
                       <td>${data.list[i].CardID ? data.list[i].CardID : ""}</td>
                       <td>${data.list[i].CardName ? data.list[i].CardID : ""}</td>
                       <td>${data.list[i].TotalMoney}积分</td>
                       <td>${data.list[i].TotalNum}</td>
                       <td>${data.list[i].UserName}</td>
                       <td>${data.list[i].ShopName}</td>
                       <td>${data.list[i].Remark ? data.list[i].Remark : ""}</td>
                       <td><button type="button" class="add-bt online-order-bt bt-xq">详情</button><button type="button"
                           class="add-bt online-order-bt bt-cdy">重打印</button>
                       </td>
                     </tr>`
                    };
                    return html;
                };
            };
            $.http.post(url.query, param, user.token, function (res) {
                if (res.status == 1) {
                    if (res.data.list.length > 0) {
                        that.list = res.data.list;
                        $("#" + name + " tbody").html(queryList(res.data));
                        $("#" + name + " .layui-none").hide();
                        $("#" + name + "Page").show();
                        laypage.render({
                            elem: name + 'Page', //容器名称
                            limit: 7,  //每页条数
                            count: res.data.total, //总页数
                            theme: "#41c060",//颜色
                            jump: function (obj, first) {
                                if (!first) {
                                    param.Page = obj.curr;
                                    $.http.post(url.query, param, user.token, function (resquest) {
                                        that.list = resquest.data.list;
                                        $("#" + name + " tbody").html(queryList(resquest.data));
                                        $("#" + name + " .layui-none").hide();
                                    });
                                }
                            },
                        });
                    } else {
                        $("#" + name + " tbody").html('');
                        $("#" + name + " .layui-none").show();
                        $("#" + name + "Page").hide();
                    }
                }
            });
        };
        //单据列表详细
        details(name, url, type) {
            var that = this
            $("#" + name).on("click", ".bt-xq", function () {
                $(this).blur()
                var orderId = $(this).index("#" + name + " .bt-xq")
                var param = {
                    OrderID: that.list[orderId].Id
                }
                $.http.post(url.details, param, user.token, function (res) {
                    if (res.status == 1) {

                        if (type == 0) {
                            if (res.data.Order.RevokeState == 0) {
                                var btn = ['取消', '整单撤单']
                            } else {
                                var btn = ['确认']
                            }
                            var html = that.consumptionDetails(res.data);
                        } else if (type == 1) {
                            if (res.data.RevokeState == 0) {
                                var btn = ['取消', '整单撤单']
                            } else {
                                var btn = ['确认']
                            }
                            var html = that.rechargeDetails(res.data);
                        } else if (type == 2) {
                            if (res.data.Order.RevokeState == 0) {
                                var btn = ['取消', '整单撤单']
                            } else {
                                var btn = ['确认']
                            }
                            var html = that.sufficientDetails(res.data);
                        } else if (type == 3) {
                            if (res.data.Order.RevokeState == 0) {
                                var btn = ['取消', '整单撤单']
                            } else {
                                var btn = ['确认']
                            }
                            var html = that.exchangeDetails(res.data)
                        }
                        layer.open({
                            type: 1,
                            title: '单据详情',
                            closeBtn: 1,
                            shadeClose: false,
                            shade: 0.3,
                            btn: btn,
                            btnAlign: "r",
                            area: ['880px', '660px'],
                            maxmin: false,//禁用最大化，最小化按钮
                            resize: false,//禁用调整大小
                            move: false,//禁止拖拽
                            skin: "lomo-details",
                            content: html,
                            yes: function (index, layero) {
                                layer.close(index);
                            },
                            btn2: function (index, layero) {
                                if (type == 0 || type == 2) {
                                    var total = res.data.Order.DiscountMoney;
                                } else if (type == 1) {
                                    var total = res.data.TotalMoney
                                } else if (type == 3) {
                                    var total = res.data.Order.TotalMoney
                                } else {
                                    var total = 0
                                }
                                var record = {
                                    OrderID: that.list[orderId].Id,
                                    total: total,
                                    Payments: res.data.Payments ? res.data.Payments : res.data.Order.TotalMoney ? res.data.Order.TotalMoney : []
                                };
                                that.cancelOrder(
                                    {
                                        index: index,
                                        record: record,
                                        url: that.url,
                                        type: that.type,
                                        actInfo: res.data.ActInfo ? res.data.ActInfo : [],
                                        realMoney: res.data.RealMoney ? res.data.RealMoney : 0
                                    });
                                return false
                            },
                            end: function () {
                                $("#consumptionList").html();
                                $("body").off("click", '.returnEd');//移除消费单据退货事件
                                $("body").off("click", '.venueChartEd');//移除消费单据退款事件
                            }
                        });
                    }
                });

            })
        };
        //消费单据详情
        consumptionDetails(data) {
            var that = this;
            var type = data.Order.OrderType;
            var payments = data.Payments;
            var details = data.Details;
            var venueDetails = data.VenueDetails;
            var detailsChart = function (data2) {
                for (var i = 0; i < data2.length; i++) {
                    if (data2[i].GoodsType == 1) {
                        html += `<tr><td>普通产品</td>`
                    } else if (data2[i].GoodsType == 2) {
                        html += `<tr><td>服务产品</td>`
                    } else if (data2[i].GoodsType == 3) {
                        html += `<tr><td>计时产品</td>`
                    } else if (data2[i].GoodsType == 4) {
                        html += `<tr><td>计次产品</td>`
                    } else if (data2[i].GoodsType == 5) {
                        html += '<tr><td>套餐</td>'
                    }
                    html += `<td>${data2[i].GoodsCode}</td>
                        <td>${data2[i].GoodsName}</td>
                        <td>${data2[i].DiscountPrice}</td>
                        <td >${data2[i].Number}</td>
                        <td name="consumpNumber">${data2[i].RefundableQty}</td>
                        <td>￥${data2[i].TotalMoney}</td>
                        <td class="size-red returnEd">退货</td></tr>`
                }
                return html;
            }
            var venueChart = function (data2) {
                var html = ''
                for (var i = 0; i < data2.length; i++) {
                    html += `<tr><td>${data2[i].RegionName}</td>
                    <td>${data2[i].VenueName}</td>
                    <td>${cashier.dateFormat(data2[i].StartTime)}</td>
                    <td>${cashier.dateFormat(data2[i].EndTime)}</td>
                    <td>${data2[i].TimeLength}</td>
                    <td>${data2[i].TotalMoney}</td>
                    <td class="size-red venueChartEd">退款</td></tr>`
                }
                return html;
            }
            $("#consumptionList").hide();
            $("#consumptionFieldList").hide();
            $("#CreateTime").html(cashier.dateFormat(data.Order.CreateTime));
            $("#integral").html(data.Order.TotalPoint);
            $("#BillCode").html(data.Order.BillCode);
            $("#CardID").html(data.Order.CardID);
            $("#CardName").html(data.Order.CardName);
            $("#LevelName").html(data.Order.LevelName);
            $("#ShopName").html(data.Order.ShopName);
            $("#Remark").html(data.Order.Remark);
            $("#withdrawalPerson").html(data.Order.RevokeUid ? data.Order.RevokeUid : "");
            $("#WithdrawalTime").html(data.Order.RevokeTime ? cashier.dateFormat(data.Order.RevokeTime) : "");
            $("#withdrawalRemarks").html(data.Order.RevokeRemark ? data.Order.RevokeRemark : "");
            $("#DiscountMoney").html(data.Order.DiscountMoney);
            $("#PaymentType").html(that._Payment(payments ? payments : []));
            if (type == 1) {

            } else if (type == 2) {
                var html = ''
                $("#consumptionList").show();
                $("#consumptionList tbody").html(detailsChart(details));
                $("body").on("click", ".returnEd", function () {
                    var i = $(this).index("#consumptionList .venueChartEd");
                    var record = {
                        GoodsID: details[i].GoodsID,
                        GoodsType: details[i].GoodsType,
                        OrderID: data.Order.Id,
                        unumber: details[i].RefundableQty,
                        GoodsName: details[i].GoodsName,
                        DiscountPrice: details[i].DiscountPrice,
                        index: i
                    }
                    that.returnGoods(record);
                });
            } else if (type == 9) {
                if (details != undefined && details.length>0) {
                    $("#consumptionList").show();
                    $("#consumptionList tbody").html(detailsChart(details));
                }
                if ( venueDetails.length>0) {
                    $("#consumptionFieldList").show();
                    $("#consumptionFieldList tbody").html(venueChart(venueDetails));
                    $("body").on("click", ".venueChartEd", function () {
                        var i = $(this).index("#consumptionList .returnEd");
                        var record = {
                            VenueID: venueDetails[i].VenueID,
                            TotalMoney: venueDetails[i].TotalMoney,
                            OrderID: data.Order.Id,
                            index: i
                        }
                        that.siteRefund(record);
                    });
                }

            }
            return $("#detailsBill");
        }
        //充值单据详情
        rechargeDetails(data) {
            var details = data;
            var html = '';
            var that = this;
            var preferential = function (data) {
                for (var i = 0; i < data.length; i++) {
                    html += `<span class="bold">${data[i].ActTypeName}：${data[i].ActMsg}</span>`
                }
                return html;
            };
            $("#recDeCreateTime").text(cashier.dateFormat(details.CreateTime));
            $("#recDeBillCode").text(details.BillCode);
            $("#recDeCardID").text(details.CardID);
            $("#recDeCardName").text(details.CardID);
            $("#recDeLevelName").text(details.LevelName);
            $("#recDeShopName").text(details.ShopName);
            $("#recDeRemark").text(details.Remark ? details.Remark : "");
            $("#recDeRevokeUid").text(details.RevokeUid ? details.RevokeUid : "");
            $("#recDeRevokeTime").text(details.RevokeTime ? cashier.dateFormat(details.RevokeTime) : "");
            $("#recDeRevokeRemark").text(details.RevokeRemark ? details.RevokeRemark : "");
            $("#recDeTotalMoney").text('￥' + details.TotalMoney);
            $("#recDeActInfo").html('<span>优惠活动：</span>' + preferential(details.ActInfo ? details.ActInfo : []));
            $("#recDeRealMoney").text('￥' + details.RealMoney);
            $("#recDePayments").html(that._Payment(data.Payments ? data.Payments : []));
            return $("#rechargeDetailsBill");
        }
        //充次单据详情
        sufficientDetails(data) {
            var that = this;
            var details = data.Details;
            var order = data.Order;
            var _detailed = function (data) {
                var _html = ''
                for (var i = 0; i < data.length; i++) {
                    if (data[i].IsCombo == 0) {
                        _html += `<tr><td>普通产品</td>`
                    } else {
                        _html += `<tr><td>套餐</td>`
                    }
                    _html += `<td>${data[i].GoodsCode}</td>
                      <td>${data[i].GoodsName}</td>
                      <td>￥${data[i].DiscountPrice}</td>
                      <td>${data[i].Number}</td>
                      <td class="size-red">￥${data[i].TotalMoney}</td>
                    </tr>`
                }
                return _html
            }
            $("#suDeCreateTime").text(cashier.dateFormat(order.CreateTime));
            $("#suDeTotalPoint").text(order.TotalPoint);
            $("#suDeBillCode").text(order.BillCode);
            $("#suDeCardID").text(order.CardID);
            $("#suDeCardName").text(order.CardName);
            $("#suDeLevelName").text(order.LevelName);
            $("#suDeShopName").text(order.ShopName);
            $("#suDeRemark").text(order.Remark);
            $("#suDeRevokeUid").text(order.RevokeUid ? order.RevokeUid : "");
            $("#suDeRevokeTime").text(order.RevokeTime ? cashier.dateFormat(order.RevokeTime) : "");
            $("#suDeRevokeRemark").text(order.RevokeRemark ? order.RevokeRemark : "");
            $("#suDeDiscountMoney").text(order.DiscountMoney);
            $("#suDePayments").html(that._Payment(data.Payments ? data.Payments : []));
            $("#suDedetails").html(_detailed(details));
            return $("#sufficientDetailsBill")
        }
        //礼品兑换详情
        exchangeDetails(data) {
            var details = data.Details;
            var order = data.Order;
            var _detailed = function (data) {
                var _html = ''
                for (var i = 0; i < data.length; i++) {
                    if (data[i].GoodsType == 1) {
                        _html += `<tr><td>普通产品</td>`
                    } else if (data[i].GoodsType == 2) {
                        _html += `<tr><td>服务产品</td>`
                    }
                    _html += `<td>${data[i].GoodsCode}</td>
                      <td>${data[i].GoodsName}</td>
                      <td>${data[i].DiscountPrice}积分</td>
                      <td>${data[i].Number}</td>
                      <td>${data[i].TotalMoney}积分</td>
                    </tr>`
                }
                return _html
            }
            $("#exDeCreateTime").text(cashier.dateFormat(order.CreateTime));
            $("#exDeBillCode").text(order.BillCode);
            $("#exDeCardID").text(order.CardID);
            $("#exDeCardName").text(order.CardName);
            $("#exDeLevelName").text(order.LevelName);
            $("#exDeShopName").text(order.ShopName);
            $("#exDeRemark").text(order.Remark);
            $("#exDeRevokeUid").text(order.RevokeUid ? order.RevokeUid : "");
            $("#exDeRevokeTime").text(order.RevokeTime ? cashier.dateFormat(order.RevokeTime) : "");
            $("#exDeRevokeRemark").text(order.RevokeRemark ? order.RevokeRemark : "");
            $("#exDeTotalMoney").text(order.TotalMoney);
            $("#exDeTotalMoney2").text(order.TotalMoney);
            $("#exDedetails").html(_detailed(details));
            return $("#exchangeDetailsBill");
        }
        //消费订单退货
        returnGoods(data) {
            var that = this;
            var opt = that.payType(0, user.PaymentConfig);
            $("#productName").text(data.GoodsName);
            $("#productNumber").text(data.unumber);
            $("select[name='PaymentCode2']").html(that.PaymentType(opt));
            layer.open({
                type: 1,
                title: '请填写退货数量，并确认退货',
                closeBtn: 1,
                shadeClose: false,
                shade: 0.3,
                btn: ['取消', '确认退货'],
                btnAlign: "r",
                area: ['550px', '400px'],
                maxmin: false,//禁用最大化，最小化按钮
                resize: false,//禁用调整大小
                move: false,//禁止拖拽
                skin: "lomo-details",
                content: $(".order-th"),
                yes: function (index, layero) {
                    layer.close(index);
                },
                btn2: function (index, layero) {
                    return false;
                },
                success: function (layero, index) {
                    var refundPayments = ''
                    $("#shouldRetire").text(0);
                    $("#quantity").html();
                    that.returnGoodsDetails(
                        {
                            OrderID: data.OrderID,
                            GoodsType: data.GoodsType,
                            GoodsID: data.GoodsID,
                            Number: $("input[name='returnNumber']").val()
                        }
                    ).then(function (res) {
                        $("#quantity").html(res.html);
                        $("#shouldRetire").text('￥' + res.totalMoney);
                        refundPayments = res.refundPayments;
                    });
                    layero.addClass('layui-form');
                    layero.find('.layui-layer-btn1').attr({
                        'lay-filter': 'good',
                        'lay-submit': ''
                    });
                    form.render();
                    $("input[name='returnNumber']").on('blur', function () {
                        var reg = /^[1-9]\d*$/;
                        if (!reg.test($(this).val())) {
                            layer.msg('只能输入大于0的整数')
                            $("#shouldRetire").text(0);
                        } else if ($(this).val() > data.unumber) {
                            layer.msg('退货数量不能超过最大退货数')
                            $("#shouldRetire").text(0);
                        } else {
                            $("#quantity").html();
                            that.returnGoodsDetails(
                                {
                                    OrderID: data.OrderID,
                                    GoodsType: data.GoodsType,
                                    GoodsID: data.GoodsID,
                                    Number: $(this).val()
                                }
                            ).then(function (res) {
                                $("#quantity").html(res.html);
                                $("#shouldRetire").text('￥' + res.totalMoney);
                                refundPayments = res.refundPayments;
                            });

                        }
                    })
                    form.on('submit(good)', function (data2) {
                        var param = {
                            OrderID: data.OrderID,
                            GoodsType: data.GoodsType,
                            GoodsID: data.GoodsID,
                            Number: data2.field.returnNumber,
                            TotalMoney: $("#shouldRetire").text().split("￥")[1],
                            Source: 1,
                            PaymentCode: data2.field.PaymentCode2 ? data2.field.PaymentCode2 : "",
                            RefundPayments: refundPayments
                        }
                        if (refundPayments != '') {
                            $.http.post(that.url.returnGoods, param, user.token, function (res) {
                                layer.msg(res.msg);
                                if (res.status == 1) {
                                    $("#consumptionList tbody tr").eq(data.index).find("[name='consumpNumber']").text(data.unumber - data2.field.returnNumber)
                                    layer.close(index);
                                } else if (res.status == 300907) {
                                    layer.msg("退款失败，请重新选择退款方式")
                                    $("#refundGoods").show();
                                };
                            });
                        } else {
                            layer.msg("请稍等")
                        }
                        return false;
                    });
                }
            });
        }
        //消费订单退货详情查询
        returnGoodsDetails(data) {
            var param = {
                OrderID: data.OrderID,
                GoodsType: data.GoodsType,
                GoodsID: data.GoodsID,
                Number: data.Number
            }
            return new Promise(function (resolve, reject) {
                $.http.post2(LuckVipsoft.api.GetReturnGoodsPayments, param, user.token, function (res) {
                    if (res.status == 1) {
                        var refundPayments = res.data.RefundPayments;
                        var payments = res.data.Payments
                        var html = '';
                        var totalMoney = 0;
                        $.each(payments, function (index, item) {
                            $.each(refundPayments, function (index2, item2) {
                                if (item.code == item2.PaymentCode) {
                                    html += `<li style="float: left;width: 50%;">
                                <em for="">${item2.PaymentName}：</em><span class="size-red">￥${item2.PayAmount}</span></li>
                              <li style="float: left"><em for="">抵扣积分：</em><span>${item2.PayContent}</span></li>`
                                    totalMoney += item2.PayAmount;
                                }
                            })
                        })
                        var key = { html: html, totalMoney: totalMoney, refundPayments: refundPayments }
                        resolve(key);
                    } else {
                        layer.msg(res.msg);
                    }
                });
            })
        }
        //消费订单场地退款
        siteRefund(data){
          
        };
        //切换日期
        election(name, minTime, maxTime) {
            var that = this
            $('#' + name + " .online-order-time li").on("click", function () {
                var i = $(this).index()
                $(this).addClass("hover").siblings().removeClass("hover");
                if (i == 0) {
                    var nowtime = new Date();
                    var Time = that.getMinTime(nowtime, 0);
                } else if (i == 1) {
                    var nowtime = new Date();
                    var Time = that.getMinTime(nowtime, -7);
                } else if (i == 2) {
                    var Time = new Date();
                    Time.setDate(1)
                    Time.setHours(0);
                    Time.setSeconds(0);
                    Time.setMinutes(0);
                    var Time = cashier.curentTime(Time);
                } else if (i == 3) {
                    var nowtime = new Date();
                    var Time = that.getMinTime(nowtime, -30);
                };
                maxTime.config.min = {
                    date: Time.split(" ")[0].split("-")[2],
                    hours: 23,
                    minutes: 59,
                    month: Time.split(" ")[0].split("-")[1] - 1,
                    seconds: 59,
                    year: Time.split(" ")[0].split("-")[0],
                }
                $('#' + name + 'TimeStart').val(Time)
            })
        };
        //撤单
        cancelOrder(cancelData) {
            var that = this
            var opt = that.payType(cancelData.type, user.PaymentConfig);
            $("#refund").hide();
            var refundType = function (data, act, realMoney) {
                if (cancelData.type == 3) {
                    var html = `<li><em for="">应退积分：</em><span>${data.total}</span></li>`
                    html += `<li><em for="">积分支付：</em><span>${data.Payments}</span></li>`
                } else if (cancelData.type == 1) {
                    var html = `<li><em for="">充值金额：</em><span >￥${realMoney}</span></li>
                                <li><em for="">应退金额：</em><span class="size-red">￥${data.total}</span></li>`
                    for (var i = 0; i < data.Payments.length; i++) {
                        html += `<li><em for="">${data.Payments[i].PaymentName}：</em><span class="size-red">￥${data.Payments[i].PayAmount}</span></li>`;
                    };
                    for (var i = 0; i < act.length; i++) {
                        html += `<li><em for="">${act[i].ActTypeName}：</em><span>￥${act[i].ActMsg}</span></li>`
                    }
                } else {
                    var html = `<li><em for="">应退金额：</em><span class="size-red">￥${data.total}</span></li>`
                    for (var i = 0; i < data.Payments.length; i++) {
                        html += `<li><em for="">${data.Payments[i].PaymentName}：</em><span class="size-red">￥${data.Payments[i].PayAmount}</span></li>`
                    };
                }
                return html;
            }
            layer.open({
                type: 1,
                title: '确认撤单',
                closeBtn: 1,
                shadeClose: false,
                shade: 0.3,
                btnAlign: "r",
                btn: ['取消', '确定'],
                area: ['700px', '520px'],
                maxmin: false,//禁用最大化，最小化按钮
                resize: false,//禁用调整大小
                move: false,//禁止拖拽
                skin: "lomo-ordinary",
                content: `<div id="lomo-cd" class="lomo-gd order-cd"><div class="order-cd-form"><ul>
                        ${refundType(cancelData.record, cancelData.actInfo, cancelData.realMoney)}
                        <li class="layui-form-item hide" style="overflow:visible" id="refund"><label class="layui-form-label">退款至</label>
                        <div class="layui-input-inline"><select name="PaymentCode" class="yhhd">
                        ${that.PaymentType(opt)}
                        </select></div></li>
                        <li class="layui-form-item"><em>超级密码：</em><span><input name="pwd" type="password" class="cd-form-input pw" lay-verify="required" /></span></li>
                        <li class="layui-form-item"><em style="float:left">撤单备注：</em><textarea name="remark" class="cd-form-bz" maxlength="250"></textarea></li>
                      </ul>
                    </div>
                  </div>`,
                btn2: function () {
                    return false
                },
                success: function (layero, index) {
                    layero.addClass('layui-form');
                    layero.find('.layui-layer-btn1').attr({
                        'lay-filter': 'cancel',
                        'lay-submit': ''
                    });
                    form.render();
                    form.on('submit(cancel)', function (data) {
                        var param = {
                            OrderID: cancelData.record.OrderID,
                            Remark: data.field.remark ? data.field.remark : "",
                            RevokePwd: data.field.pwd,
                            PaymentCode: data.field.PaymentCode ? data.field.PaymentCode : ""
                        }
                        $.http.post(cancelData.url.cancel, param, user.token, function (res) {
                            layer.msg(res.msg);
                            if (res.status == 1) {
                                layer.close(data.index);
                                layer.close(index);

                            } else if (res.status == 300907) {
                                layer.msg("退货失败，请重新选择退货方式")
                                $("#refund").show();
                            };
                        });
                        return false;
                    });

                },
            })
        };
        _Payment(data) {
            if (data.length == 0) {
                return ""
            } else {
                var _html = "";
                for (var i = 0; i < data.length; i++) {
                    _html += ` <span >${data[i].PaymentName}：</span><span class="bold size-red" style="margin-right:20px;">￥${data[i].PayAmount}</span>`
                };
                return _html
            }
        };
        //获取需要展示的支付方式
        payType(type, entry) {
            if (!entry.length > 0) { return false; };
            if (type == 0 || type == 2) {
                var list = []
                for (var key in entry) {
                    if (entry[key].code != '003' && entry[key].code != '010' && entry[key].code != '020') {
                        list.push(entry[key]);
                    };
                };
                return list;
            } else if (type == 1) {
                var list = []
                for (var key in entry) {
                    if (entry[key].code != '003' && entry[key].code != '010' && entry[key].code != '020' && entry[key].code != '002') {
                        list.push(entry[key]);
                    };
                };
                return list;
            } else {
                return [];
            }
        };
        //拼接支付方式
        PaymentType(data) {
            var html = '<option value="">请选择退款方式</option>';
            for (var i = 0; i < data.length; i++) {
                html += `<option value="${data[i].code}">${data[i].name}</option>`
            };
            return html;
        };
        render(name) {
            var taht = this;
            var data = $('#' + name + 'Form').serializeArray();
            var page = $('#' + name + 'Page .layui-laypage-em').next().html(); //当前页码值
            var key = {
                field: {
                    BillCode: data[0].value,
                    DeliveryStatus: data[1].value,
                    Page: parseInt(page)
                }
            }
            taht.getList(name)
        }
    }
    var sufficient = new Bill();
    sufficient.start({
        name: 'sufficient',
        type: 2,
        url: {
            query: LuckVipsoft.api.GetRechargeCountOrderByPaged, //查询订单
            details: LuckVipsoft.api.GetRechargeCountOrderByDetail,//订单详情
            cancel: LuckVipsoft.api.RevokeRechargeCountOrder,//撤单
            reprint: LuckVipsoft.api.RechargeCountOrderRePrint,//重打印
            returnGoods: ""//退货
        }
    });
    var recharge = new Bill();
    recharge.start({
        name: 'recharge',
        type: 1,
        url: {
            query: LuckVipsoft.api.GetTopUpOrderByPaged, //查询订单
            details: LuckVipsoft.api.GetTopUpOrderByDetail,//订单详情
            cancel: LuckVipsoft.api.RevokeTopUpOrder,//撤单
            reprint: LuckVipsoft.api.RechargeCountOrderRePrint,//重打印
            returnGoods: ""//退货
        }
    });
    var exchange = new Bill();
    exchange.start({
        name: 'exchange',
        type: 3,
        url: {
            query: LuckVipsoft.api.GetRedeemOrderByPaged, //查询订单
            details: LuckVipsoft.api.GetRedeemOrderByDetail,//订单详情
            cancel: LuckVipsoft.api.RevokeTopUpOrder,//撤单
            reprint: LuckVipsoft.api.RevokeRedeemOrder,//重打印
            returnGoods: ""//退货
        }
    });
    var consumption = new Bill();
    consumption.start({
        name: 'consumption',
        type: 0,
        url: {
            query: LuckVipsoft.api.GetConsumeOrderList, //查询订单
            details: LuckVipsoft.api.GetConsumeOrderData,//订单详情
            cancel: LuckVipsoft.api.RevokeConsumeOrder,//撤单
            reprint: "",//重打印
            returnGoods: LuckVipsoft.api.MemberReturnGoods//退货
        }
    });
});
