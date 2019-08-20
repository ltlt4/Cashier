layui.use(['laydate', 'laypage', 'form', 'jquery'], function () {
    var $ = layui.jquery;

    var user = {
        token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
        information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
    }
    var laypage = layui.laypage;
    var laydate = layui.laydate;
    var form = layui.form;

    //执行一个laypage实例
    laypage.render({
        elem: 'paging', //容器名称
        limit: 8,  //每页条数
        count: 50, //总页数
        theme: "#41c060"//颜色
    });

    //到店时间
    laydate.render({
        elem: '#ResDate',
        type: 'date',
        theme: '#41c060',
        done: function (value, date, endDate) {
            order.getSelTimesoft();
        }
    });

    //门店
    form.on('select(dianpu)', function (data) {
        order.getSelItem(data.value);
    })

    //服务项目
    form.on('select(fuwu)', function (data) {
        order.getSelTec(data.value);
    })

    $("#queryCode").click(function () {
        order.search();
    })

    form.on('submit(inquiry)', function (data) {
        order.search();
        return false;
    });

    //技师
    form.on('select(technician)', function (data) {
        order.StaffId = $(data.elem[data.elem.selectedIndex]).attr('data-staff');
        order.getSelTimesoft();
    })

    //新增预约
    form.on('submit(subscribe)', function (data) {
        data.field.ResDate = cashier.revShortDateFormat(data.field.ResDate);
        $.http.post(LuckVipsoft.api.CreatResOrder, data.field, user.token, function (res) {
            if (res.status == 1) {
                $("#formsearch")[0].reset();
                order.tbList();
                $.luck.success(res.msg);
                layer.closeAll('page');
            } else {
                $.luck.error(res.msg);
            }
        });
        return false;
    });

    var order = {
        list: [],
        STime: "",
        ETime: "",
        StaffId: "",
        start: function () {
            this.tbList();
            this.search();
            this.getSelShop();
            this.details();
            this.editOrder();
        },
        tbList: function () {
            _this = this;
            var param = {
                Page: 1,
                Rows: 7,
                Mobile: $("#Mobile").val(),
                Status: $("#Status").val(),
                ShopId: $("#ShopId").val(),
                STime: order.STime,
                ETime: order.ETime
            }
            $.http.post(LuckVipsoft.api.GetResOrderPageList, param, user.token, function (res) {
                if (res.status == 1) {
                    if (res.data.list.length > 0) {
                        _this.list = res.data.list;
                        var template = function (data) {
                            var html = "";
                            for (var i = 0; i < data.length; i++) {
                                html += "<tr><td>" + data[i].CustomerName + "</td>";
                                html += "<td>" + data[i].Mobile + "</td>";
                                html += "<td>" + data[i].NickName + "</td>";
                                html += "<td>" + data[i].GoodsName + "</td>";
                                if (data[i].CardID == '0000') {
                                    html += "<td>否</td>";
                                } else {
                                    html += "<td>是</td>";
                                }

                                html += "<td>" + cashier.ShortDateFormat(data[i].ResDate) + " " + data[i].TimeSlot + "</td>";
                                if (data[i].ServiceMode == 1) {
                                    html += "<td>到店服务</td>";
                                } else {
                                    html += "<td>上门服务</td>";
                                }
                                if (data[i].Status == 4) {
                                    html += "<td>已支付</td>";
                                } else {
                                    html += "<td>未支付</td>";
                                }
                                html += "<td>" + _this.orderStatus(data[i].Status) + "</td>";
                                html += "<td>" + data[i].ShopName + "</td><td>";
                                html += '<button type="button" class="add-bt online-order-bt orange detailsBtn">详情</button>';
                                if (data[i].Status == 4 && (data[i].PaymentType == 1 || data[i].PaymentType == 2)) {//微信支付  余额支付
                                    html += '<button type="button" class="add-bt online-order-bt bt-g openoder" data-id="' + data[i].Id + '">开单</button>';
                                } else if ((data[i].Status == 1 || data[i].Status == 4) && data[i].PaymentType == 3) {
                                    html += '<button type="button" class="add-bt online-order-bt bt-g adorder"  data-id="' + data[i].Id + '">开单</button>';
                                    html += '<button type="button" class="add-bt online-order-bt gray" data-id="' + data[i].Id + '">取消</button>';
                                }
                                html += '</td></tr>'
                            };
                            return html
                        }

                        $("#order tbody").html(template(res.data.list));
                        $('.layui-none').hide();
                        laypage.render({
                            elem: 'paging', //容器名称
                            limit: 7,  //每页条数
                            count: res.data.total, //总页数
                            theme: "#41c060",//颜色
                            jump: function (obj, first) {
                                if (!first) {
                                    var _param = {
                                        Page: obj.curr,
                                        Rows: 7,
                                        Mobile: $("#Mobile").val(),
                                        Status: $("#Status").val(),
                                        ShopId: $("#ShopId").val(),
                                        STime: order.STime,
                                        ETime: order.ETime
                                    }
                                    $.http.post(LuckVipsoft.api.GetResOrderPageList, _param, user.token, function (res) {
                                        _this.list = res.data.list;
                                        $('.layui-none').hide();
                                        $("#order tbody").html(template(res.data.list));
                                    });
                                }
                            },
                        });
                    } else {
                        $('.layui-none').show();
                        $("#order tbody").html("");
                    }
                }
            });
        },
        orderStatus: function (Status) {
            if (Status == 0) {
                return "未付款";
            } else if (Status == 1) {
                return "到店付款";
            } else if (Status == 2) {
                return "已开单";
            } else if (Status == 3) {
                return "已超时";
            } else if (Status == 4) {
                return "已支付";
            } else if (Status == 5) {
                return "已取消";
            }
        },
        search: function () {
            _this = this;
            _this.tbList();
        },
        getSelShop: function () {
            if (user.information.MShopID == user.information.ShopID) {
                $("#ShopId").empty();
                $("#Shop").empty();
                var list = $.session.get('belongShop');
                var html = '<option value="">请选择店铺</option>';
                if (list.length > 0) {
                    for (var i = 0; i < list.length; i++) {
                        html += '<option value="' + list[i].Id + '">' + list[i].ShopName + '</option>';
                    }
                }
                $("#ShopId").html(html);
                $("#Shop").html(html);
                form.render();
            } else {
                $("#shopList").hide();
            }
        },
        getSelItem: function (shopId) {
            $.http.post(LuckVipsoft.api.GetItemSelData, { shopId: shopId }, user.token, function (res) {
                $("#ProjectID").empty();
                var list = res.data.list;
                var html = '<option value="">请选择服务项目</option>';
                if (list.length > 0) {
                    for (var i = 0; i < list.length; i++) {
                        html += '<option value="' + list[i].Id + '">' + list[i].GoodsName + '</option>';
                    }
                }
                $("#ProjectID").html(html);
                form.render();
            });
        },
        getSelTec: function (itemId) {
            $.http.post(LuckVipsoft.api.GetTecSelData, { shopId: $("#Shop").val(), itemId: itemId }, user.token, function (res) {
                $("#tec").empty();
                var list = res.data.list;
                var html = '<option value="">请选择服务技师</option>';
                if (list.length > 0) {
                    for (var i = 0; i < list.length; i++) {
                        html += '<option value="' + list[i].Id + '" data-staff=' + list[i].StaffId + '>' + list[i].NickName + '</option>';
                    }
                }
                $("#tec").html(html);
                form.render();
            });
        },
        getSelTimesoft: function () {
            if ($("#arrivalTime").val() != "") {
                var postData = {
                    shopId: $("#Shop").val(),
                    itemId: $("#ProjectID").val(),
                    tecId: $("#tec").val(),
                    staffId: order.StaffId,
                    recdate: $("#arrivalTime").val()
                }
                $.http.post(LuckVipsoft.api.GetTimesoftSelData, postData, user.token, function (res) {
                    $("#timesoft").empty();
                    if (res.data.list.length > 0) {
                        var list = res.data.list[0].aviList;
                        var html = '<option value="">请选择到店时间</option>';
                        if (list.length > 0) {
                            for (var i = 0; i < list.length; i++) {
                                if (list[i].TimeSlot != "") {
                                    html += '<option value="' + list[i].TimeSlot + '">' + list[i].TimeSlot + '(剩余' + list[i].Available + '次)</option>';
                                }
                            }
                        }
                        $("#timesoft").html(html);
                        form.render();
                    }
                });
            }
        },
        editOrder: function () {
            var _this = this;
            //取消订单
            $('#order').on('click', '.gray', function () {
                //var index = $(this).attr('data-id');
                $.luck.confirm("确定取消此预约订单吗？", function () {
                    $.http.post(LuckVipsoft.api.CancelOrder, { id: $(this).attr('data-id') }, user.token, function (res) {
                        if (res.status == 1) {
                            $("#formsearch")[0].reset();
                            _this.tbList();
                            $.luck.success(res.msg);
                        } else {
                            $.luck.error(res.msg);
                        }
                    });
                })
            });
            //跳转页面  (到店)
            $('#order').on('click', '.adorder', function () {
                //var index = $(this).attr('data-id');
                parent.$("iframe").attr('src', "../../../Areas/Member/cashRegister/cashRegister.html?id=" + $(this).attr('data-id') + "&m=1")
            });
            //直接生成订单  (微信、余额)
            $('#order').on('click', '.openoder', function () {
                //var index = $(this).attr('data-id');
                $.http.post(LuckVipsoft.api.ReservationOpenOrder, { OrderID: $(this).attr('data-id') }, user.token, function (res) {
                    if (res.status == 1) {
                        $("#formsearch")[0].reset();
                        _this.tbList();
                        $.luck.success(res.msg);
                    } else {
                        $.luck.error(res.msg);
                    }
                });
            });
        },
        details: function () {
            var _this = this;
            $('#order').on('click', '.detailsBtn', function () {
                var index = $(this).index("#order .detailsBtn")
                $.http.post(LuckVipsoft.api.GetOrderInfo, { id: _this.list[index].Id }, user.token, function (res) {
                    if (res.status == 1) {
                        var itemModel = res.data.itemModel;
                        var orderModel = res.data.orderModel;
                        var tecModel = res.data.tecModel;
                        var shopModel = res.data.shopModel;

                        var time = cashier.ShortDateFormat(orderModel.ResDate) + " " + orderModel.TimeSlot
                        var source = "-";
                        if (orderModel.Source == 0) {
                            source = "PC";
                        } else if (orderModel.Source == 1) {
                            source = "APP";
                        } else if (orderModel.Source == 2) {
                            source = "微信会员卡";
                        } else if (orderModel.Source == 3) {
                            source = "微信";
                        } else if (orderModel.Source == 4) {
                            source = "其它";
                        } else if (orderModel.Source == 5) {
                            source = "微商城";
                        } else if (orderModel.Source == 6) {
                            source = "客户端";
                        } else if (orderModel.Source == 7) {
                            source = "微预约";
                        }

                        var payType = "-";
                        if (orderModel.PaymentType == 1) {
                            payType = "微信支付";
                        } else if (orderModel.PaymentType == 2) {
                            payType = "余额支付";
                        } else if (orderModel.PaymentType == 3) {
                            payType = "到店支付";
                        }

                        var html = '<div class="lomo-gd order-cd cd-info"  style="margin: 0;width: 100%;height: 100%;"><div class="order-cd-info">';
                        html += '<table width="100%" border="0" cellspacing="0" cellpadding="0" class="order-cdTable"style="background: #F2F2F2;">';
                        html += '<tr><td width="49%"><i>单据编号：</i><em>' + orderModel.BillCode + '</em></td><td></td></tr>';
                        if (orderModel.ResCode == "" || orderModel.ResCode == undefined || orderModel.ResCode == null) {
                            html += '<tr><td><i>验证码：</i><em></em></td>';
                        } else {
                            html += '<tr><td><i>验证码：</i><em>' + orderModel.ResCode + '</em></td>';
                        }
                        if (orderModel.MemID == "0000") {
                            html += '<td><i>是否会员：</i><em>否</em></td></tr>';
                        } else {
                            html += '<td><i>是否会员：</i><em>是</em></td></tr>';
                        }
                        if (orderModel.CustomerName == "") {
                            html += '<tr><td><i>顾客姓名：</i><em></em></td>';
                        } else {
                            html += '<tr><td><i>顾客姓名：</i><em>' + orderModel.CustomerName + '</em></td>';
                        }
                        if (orderModel.Mobile == "") {
                            html += '<td><i>顾客手机：</i><em></em></td></tr>';
                        } else {
                            html += '<td><i>顾客手机：</i><em>' + orderModel.Mobile + '</em></td></tr>';
                        }
                        html += '<tr><td><i>预约时间：</i><em>' + time + '</em></td><td><i>订单来源：</i><em>' + source + '</em></td><td></td></tr>';
                        html += '<tr><td><i>服务技师：</i><em>' + tecModel.NickName + '</em></td><td><i>门店：</i><em>' + shopModel.ShopName + '</em></td><td></td></tr></table>';
                        html += '<div class="lomo-xq-ksxf">';

                        html += '<div><span>订单状态：</span><span class="bold size-red">' + _this.orderStatus(orderModel.Status) + '</span></div>';
                        html += '<div><span>支付方式：</span><span class="bold">' + payType + '</span><span style="margin-left:20px;">支付金额：</span>';
                        if (orderModel.TotalMoney == "" || orderModel.TotalMoney == undefined || orderModel.TotalMoney == null) {
                            html += '<span class="bold">未支付</span></div>';
                        } else {
                            html += '<span class="bold">￥' + orderModel.TotalMoney + '</span></div>';
                        }
                        html += '<div><span>留言：</span><span class="bold">' + orderModel.Remark + '</span></div></div>';
                        html += '<div class="order-cdTable2Sco"><table width="100%" border="0" cellspacing="0" cellpadding="0" class="order-cdTable2"style="margin-top:20px;">';
                        html += '<tr><th>项目名称</th><th>项目单价</th><th>服务方式</th></tr>';
                        html += '<tbody><tr><td>' + itemModel.GoodsName + '</td><td>' + itemModel.Price + '</td>';
                        if (itemModel.ServiceModel == 1) {
                            html += '<td>到店服务</td></tr>';
                        } else {
                            html += '<td>上门服务</td></tr>';
                        }
                        html += '</tbody></table></div></div> </div>';

                        layer.open({
                            type: 1,
                            title: '单据详情',
                            closeBtn: 1,
                            shadeClose: false,
                            shade: 0.3,
                            btn: ['关闭'],
                            btnAlign: "r",
                            area: ['880px', '600px'],
                            maxmin: false,//禁用最大化，最小化按钮
                            resize: false,//禁用调整大小
                            move: false,//禁止拖拽
                            skin: "lomo-details",
                            content: html
                        });

                    }
                });
            });
        }
    }


    order.start();

    //日期范围（搜索用）
    laydate.render({
        elem: '#timeFrame',
        range: true,
        theme: '#41c060',
        done: function (value, date, endDate) {
            order.STime = value.substring(0, 10);
            order.ETime = value.substring(13);
        }
    });

    $("#addRes").click(function () {
        layer.open({
            type: 1,
            title: '新增预约订单',
            closeBtn: 1,
            shadeClose: false,
            shade: 0.3,
            btnAlign: "r",
            area: ['880px', '560px'],
            maxmin: false,//禁用最大化，最小化按钮
            resize: false,//禁用调整大小
            move: false,//禁止拖拽
            skin: "lomo-details",
            content: $("#lomo-yuyue"),
            success: function () {
                $("[name='CustomerName']").val("");
                $("[name='Mobile']").val("");
                //$("#Shop").find("option[value='']").prop("selected", true);
                $("[name='ShopID']").val("");
                $("[name='ProjectID']").val("");
                $("[name='TecID']").val("");
                $("[name='ResDate']").val("");
                $("[name='TimeSlot']").val("");
                $("[name='Remark']").val("");

                form.render();
            }
        });
    });

    $("#cancelBtn").click(function () {
        layer.closeAll('page');
    })

})

