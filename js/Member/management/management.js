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
            var html = '';
            for (var i = 0; i < data.length; i++) {
                html += `<option value="${data[i].code}">${data[i].name}</option>`
            };
            return html;
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
                returnGoods:function(value, item){
                    if (value != ""){
                        var reg = /^[1-9]\d*$/;
                        if (!reg.test(value)) {
                         return '只能输入大于0的整数'
                        }
                    }
                },
                returnNumber: function (value, item) {
                    if (value != "") {
                        var productNumber = parseInt($("#productNumber").text());
                        if(value>productNumber){
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
            if (type == 0) {
                var param = {
                    OptMinTime: time[0] != '' ? time[0] : cashier.revDateFormat(cashier.curentTime(new Date(new Date() - 1000 * 60 * 60 * 24 * 1))),
                    OptMaxTime: time[1] != '' ? time[1] : cashier.revDateFormat(cashier.curentTime(new Date())),
                    BillCode: data.field.cardId ? data.field.cardId : "",
                    CardCode: data.field.id ? data.field.id : "",
                    PayMinQuota: data.field.minimum ? data.field.minimum : "",
                    PayMaxQuota: data.field.highest ? data.field.highest : "",
                    Remark: data.field.remarks ? data.field.remarks : "",
                    RevokeState: data.field.type ? data.field.type : 0,
                    OrderType: data.field.documentType,
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
                    BTime: time[0] != '' ? time[0] : cashier.revDateFormat(cashier.curentTime(new Date(new Date() - 1000 * 60 * 60 * 24 * 1))),
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
                            var html = that.consumptionDetails(res.data);
                        } else if (type == 1) {
                            var details = res.data;
                            var preferential = function (data) {
                                var html = ""
                                for (var i = 0; i < data.length; i++) {
                                    html += `<span class="bold">${data[i].ActTypeName}：${data[i].ActMsg}</span>`
                                }
                                return html;
                            };
                            var html = `<div class="lomo-gd order-cd cd-info" style="margin: 0;width: 100%;height: 100%;">
                        <div class="order-cd-info">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" class="order-cdTable"
                            style="background: #F2F2F2;">
                            <tr>
                              <td width="49%"><i>订单日期：</i><em>${cashier.dateFormat(details.CreateTime)}</em></td>
                              <td></td>
                            </tr>
                            <tr>
                              <td width="49%"><i>单据编号：</i><em>${details.BillCode}</em></td>
                              <td></td>
                            </tr>
                            <tr>
                              <td><i>会员卡号：</i><em>${details.CardID}</em></td>
                              <td><i>会员姓名：</i><em>${details.CardName}</em></td>
                            </tr>
                            <tr>
                              <td><i>会员等级：</i><em>${details.LevelName}</em></td>
                              <td><i>所属门店：</i><em>${details.ShopName}</em></td>
                            </tr>
                            <tr>
                              <td><i>订单备注：</i><em>${details.Remark}</em></td>
                              <td></td>
                            </tr>
                            <tr>
                              <td><i>撤单人：</i><em>${details.RevokeUid ? details.RevokeUid : ""}</em></td>
                              <td><i>撤单时间：</i><em>${details.RevokeTime ? cashier.dateFormat(details.RevokeTime) : ""}</em></td>
                            </tr>
                            <tr>
                              <td colspan="2"><i>撤单备注：</i><em>${details.RevokeRemark ? details.RevokeRemark : ""}</em></td>
                            </tr>
                          </table>
                          <div class="lomo-xq-czxq">
                            <div><span>实付金额：</span><span class="bold size-red">￥${details.TotalMoney}</span></div>
                            <div> <span>优惠活动：</span>${preferential(details.ActInfo ? details.ActInfo : [])}</div>
                            <div><span>实际到账：</span><span class="bold size-red">￥${details.RealMoney}</span></div>
                            <div>
                            ${that._Payment(res.data.Payments ? res.data.Payments : [])}
                            </div>
                          </div>
                        </div>
                      </div>`

                        } else if (type == 2) {
                            var details = res.data.Details;
                            var order = res.data.Order;
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
                                      <td>￥${data[i].TotalMoney}</td>
                                    </tr>`
                                }
                                return _html
                            }
                            var html = `<div class="lomo-gd order-cd cd-info"  style="margin: 0;width: 100%;height: 100%;"><div class="order-cd-info">
                              <table width="100%" border="0" cellspacing="0" cellpadding="0" class="order-cdTable"style="background: #F2F2F2;">
                                <tr>
                                  <td width="49%"><i>订单日期：</i><em>${cashier.dateFormat(order.CreateTime)}</em></td>
                                  <td><i>获得积分：</i><em>${order.TotalPoint}</em></td>
                                </tr>
                                <tr><td width="49%"><i>单据编号：</i><em>${order.BillCode}</em></td><td></td></tr>
                                <tr><td><i>会员卡号：</i><em>${order.CardID}</em></td>
                                <td><i>会员姓名：</i><em>${order.CardName}</em></td></tr>
                                <tr> <td><i>会员等级：</i><em>${order.LevelName}</em></td>
                                <td><i>所属门店：</i><em>${order.ShopName}</em></td></tr>
                                <tr><td><i>订单备注：</i><em>${order.Remark}</em></td><td></td></tr>
                                <tr><td><i>撤单人：</i><em>${order.RevokeUid ? order.RevokeUid : ""}</em></td>
                                <td><i>撤单时间：</i><em>${order.RevokeTime ? cashier.dateFormat(order.RevokeTime) : ""}</em></td></tr>
                                <tr><td colspan="2"><i>撤单备注：</i><em>${order.RevokeRemark ? order.RevokeRemark : ""}</em></td></tr>
                              </table>
                              <div class="lomo-xq-ksxf">
                                <div><span>实付金额：</span><span class="bold size-red">￥${order.DiscountMoney}</span></div>
                                <div>
                                ${that._Payment(res.data.Payments ? res.data.Payments : [])}
                                </div></div>
                              <div class="order-cdTable2Sco"><table width="100%" border="0" cellspacing="0" cellpadding="0" class="order-cdTable2"style="margin-top:20px;">
                                <tr><th>商品类型</th><th>商品编号</th><th>商品名称</th><th>折后单价</th><th>充次数量</th><th>总金额</th> </tr>
                                 <tbody>${_detailed(details)}</tbody>
                                </table>
                              </div>
                            </div>
                          </div>`
                        } else if (type == 3) {
                            var details = res.data.Details;
                            var order = res.data.Order;
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
                            var html = `<div class="lomo-gd order-cd cd-info"  style="margin: 0;width: 100%;height: 100%;">
                            <div class="order-cd-info">
                              <table width="100%" border="0" cellspacing="0" cellpadding="0" class="order-cdTable"
                                style="background: #F2F2F2;">
                                <tr>
                                  <td width="49%" colspan="2"><i>订单日期：</i><em>${cashier.dateFormat(order.CreateTime)}</em></td>
                                  <td></td>
                                </tr>
                                <tr>
                                  <td width="49%"><i>单据编号：</i><em>${order.BillCode}</em></td>
                                  <td></td>
                                </tr>
                                <tr>
                                  <td><i>会员卡号：</i><em>${order.CardID}</em></td>
                                  <td><i>会员姓名：</i><em>${order.CardName}</em></td>
                                </tr>
                                <tr>
                                  <td><i>会员等级：</i><em>${order.LevelName}</em></td>
                                  <td><i>所属门店：</i><em>${order.ShopName}</em></td>
                                </tr>
                                <tr>
                                  <td><i>订单备注：</i><em>${order.Remark}</em></td>
                                  <td></td>
                                </tr>
                                <tr>
                                  <td><i>撤单人：</i><em>${order.RevokeUid ? order.RevokeUid : ""}</em></td>
                                  <td><i>撤单时间：</i><em>${order.RevokeTime ? cashier.dateFormat(order.RevokeTime) : ""}</em></td>
                                </tr>
                                <tr>
                                  <td colspan="2"><i>撤单备注：</i><em>${order.RevokeRemark ? order.RevokeRemark : ""}</em></td>
                                </tr>
                              </table>
                              <div class="lomo-xq-ksxf">
                                <div><span>实付积分：</span><span class="bold size-red">￥${order.TotalMoney}</span></div>
                                <div>
                                <span>积分支付：</span><span class="bold">￥${order.TotalMoney}</span>
                                </div>
                              </div>
                              <div class="order-cdTable2Sco">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" class="order-cdTable2"
                                  style="margin-top:20px;">
                                  <tr>
                                    <th>商品类型</th>
                                    <th>商品编号</th>
                                    <th>商品名称</th>
                                    <th>折后单价</th>
                                    <th>兑换数量</th>
                                    <th>总积分</th>
                                  </tr>
                                 <tbody>
                                 ${_detailed(details)}
                                 </tbody>
                                </table>
                              </div>
                            </div>
                          </div>`
                        }
                        layer.open({
                            type: 1,
                            title: '单据详情',
                            closeBtn: 1,
                            shadeClose: false,
                            shade: 0.3,
                            btn: ['取消', '整单撤单'],
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
                                that.cancelOrder(index, record, that.url, that.type);
                                return false
                            },
                            end: function () {
                                $("#consumptionList").html();
                                $("body").off("click", '.returnEd');//移除消费单据退货事件
                            }
                        });
                    }
                });

            })
        };
        //消费订单详情
        consumptionDetails(data) {
            var that = this;
            var type = data.Order.OrderType;
            var payments = data.Payments;
            var details = data.Details;
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
                $("#consumptionList").hide();
            } else if (type == 2) {
                var html = ''
                for (var i = 0; i < details.length; i++) {
                    if (details[i].GoodsType == 1) {
                        html += `<tr><td>普通产品</td>`
                    } else if (details[i].GoodsType == 2) {
                        html += `<tr><td>服务产品</td>`
                    } else if (details[i].GoodsType == 3) {
                        html += `<tr><td>计时产品</td>`
                    } else if (details[i].GoodsType == 4) {
                        html += `<tr><td>计次产品</td>`
                    } else if (details[i].GoodsType == 5) {
                        html += '<tr><td>套餐</td>'
                    }
                    html += `<td>${details[i].GoodsCode}</td>
                        <td>${details[i].GoodsName}</td>
                        <td>${details[i].DiscountPrice}</td>
                        <td>${details[i].Number}</td>
                        <td>${details[i].RefundableQty}</td>
                        <td>￥${details[i].TotalMoney}</td>
                        <td class="size-red returnEd">退货</td></tr>`
                }
                $("#consumptionList").show();
                $("#consumptionList tbody").html(html);
                $("body").on("click", ".returnEd", function () {
                    var i = $(this).index("#consumptionList .returnEd");
                    var record = {
                        GoodsID: details[i].GoodsCode,
                        GoodsType: details[i].GoodsType,
                        OrderID: data.Order.Id,
                        unumber: details[i].RefundableQty,
                        GoodsName: details[i].GoodsName,
                        DiscountPrice: details[i].DiscountPrice
                    }
                    that.returnGoods(record);
                });
            } else if (type == 9) {

            }
            return $("#detailsBill");
        }
        //消费订单退货
        returnGoods(data) {
            var that=this;
            var opt = that.payType(0, user.PaymentConfig);
            $("#productName").text(data.GoodsName);
            $("#productNumber").text(data.unumber);
            $("select[name='PaymentCode2']").html( that.PaymentType(opt));
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
                success: function (layero,index) {
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
                            $("#shouldRetire").text('￥' + $(this).val() * data.DiscountPrice);
                        }
                    })
                    form.on('submit(good)', function (data2) {
                        var param = {
                            OrderID: data.orderId,
                            GoodsType:data.GoodsType,
                            GoodsID: data.GoodsCode,
                            Number: data2.field.returnNumber,
                            TotalMoney:$("#shouldRetire").text().split("￥")[1],
                            Source:1,
                            PaymentCode:data2.field.PaymentCode2 ? data2.field.PaymentCode2 : ""
                        }
                        $.http.post(that.url.returnGoods, param, user.token, function (res) {
                            layer.msg(res.msg);
                            if (res.status == 1) {
                                layer.close(index);
                            } else if (res.status == 300907) {
                                layer.msg("退款失败，请重新选择退款方式")
                                $("#refundGoods").show();
                            };
                        });
                        return false;
                    });
                }
            });
        }
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
        cancelOrder(dom, record, url, type) {
            var that = this
            var opt = that.payType(type, user.PaymentConfig);
            $("#refund").hide();
            var refundType = function (data) {
                if (type == 3) {
                    var html = `<li><em for="">应退积分：</em><span>${record.total}</span></li>`
                    html += `<li><em for="">积分支付：</em><span>${record.Payments}</span></li>`
                } else if (type == 2) {
                    var html = `<li><em for="">应退金额：</em><span class="size-red">￥${record.total}</span></li>`
                } else {
                    var html = `<li><em for="">应退金额：</em><span class="size-red">￥${record.total}</span></li>`
                    for (var i = 0; i < data.length; i++) {
                        html += `<li><em for="">${data[i].PaymentName}：</em><span class="size-red">￥${data[i].PayAmount}</span></li>`
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
                        ${refundType(record.Payments)}
                        <li class="layui-form-item hide" style="overflow:visible" id="refund"><label class="layui-form-label">退款至</label>
                        <div class="layui-input-inline"><select name="PaymentCode" class="yhhd">
                        ${that.PaymentType(opt)}
                        </select></div></li>
                        <li class="layui-form-item"><em>超级密码：</em><span><input name="pwd" type="password" class="cd-form-input pw" lay-verify="required" /></span></li>
                        <li class="layui-form-item"><em>撤单备注：</em><textarea name="remark" class="cd-form-bz"></textarea></li>
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
                            OrderID: record.OrderID,
                            Remark: data.field.remark ? data.field.remark : "",
                            RevokePwd: data.field.pwd,
                            PaymentCode: data.field.PaymentCode ? data.field.PaymentCode : ""
                        }
                        $.http.post(url.cancel, param, user.token, function (res) {
                            layer.msg(res.msg);
                            if (res.status == 1) {
                                layer.close(dom);
                                layer.close(index);
                            } else if (res.status == 300907) {
                                layer.msg("退款失败，请重新选择退款方式")
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
                    _html += ` <span >${data[i].PaymentName}：</span><span class="bold" style="margin-right:20px;">￥${data[i].PayAmount}</span>`
                };
                return _html
            }
        };
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
