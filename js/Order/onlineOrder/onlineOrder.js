layui.use(['layer', 'jquery', "form", 'laydate', 'laypage', 'table', 'element'], function () {
    var layer = layui.layer, $ = layui.$, form = layui.form, laypage = layui.laypage, laydate = layui.laydate, table = layui.table, element = layui.element;
    var record = "" //    小键盘输入
    var initial = {
        keyPanel: true //小键盘
    }
    var user = {
        token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
        information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
        staffClass: $.session.get("staffClass") ? $.session.get("staffClass") : null,
    }
    //时间切换
    $(".online-order-time li").on("click", function () {
        var i = $(this).index()
        $(this).addClass("hover").siblings().removeClass("hover");
    })
    laypage.render({
        elem: 'paging', //容器名称
        limit: 8,  //每页条数
        count: 50, //总页数
        theme: "#41c060"//颜色
    });

    var order = {
        list: [],
        company: [],
        maxTime: "",
        minTime: "",
        start: function () {
            this.form();
            this.search();
            this.details();
            this.election(this.maxTime, this.minTime);
            this.writeOff();
            this.keyboard();
            this.getList('');
        },
        //layui初始化
        form: function () {
            var _this = this
            form.render();
            form.verify({
                choice: function (value, item) {
                    if (value != "") {
                        var display = $(".lomo-express-option").css('display')
                        if (display != "none") {
                            return LuckVipsoft.lan.ER0024;
                        }
                    }
                }
            });
            var nowtime = new Date();
            var startTime = this.getMinTime(nowtime, 0);
            var endTime = this.getMaxTime(nowtime);
            _this.minTime = laydate.render({
                type: "datetime",
                elem: '#orderTimeStart',
                theme: '#41c060',
                max: endTime,
                value: startTime,
                btns: ['now', 'confirm'],
                done: function (value, date, endDate) {
                    _this.maxTime.config.min = date;
                    _this.maxTime.config.min.month = date.month - 1;
                }
            });
            _this.maxTime = laydate.render({
                type: "datetime",
                min: startTime,
                max: endTime,
                value: endTime,
                elem: '#orderTimeEnd',
                theme: '#41c060',
                btns: ['now', 'confirm'],
                done: function (value, date, endDate) {
                    _this.minTime.max = date;
                    _this.minTime.config.max.month = date.month - 1;
                }
            });
        },
        //获取订单
        search: function () {
            _this = this
            form.on('submit(inquiry)', function (data) {
                _this.getList(data);
                return false;
            });
        },
        getList: function (data) {
            var time = this._time()
            if (!data) {
                var Filter = {
                    BTime: time[0],
                    ETime: time[1],
                    BillCode: "",
                    DeliveryStatus: "",
                }
                var param = {
                    Page: 1,
                    Rows: 7,
                    Filter: JSON.stringify(Filter)
                }
            } else {
                var Filter = {
                    BTime: time[0],
                    ETime: time[1],
                    BillCode: data.field.billCode ? data.field.billCode : "",
                    DeliveryStatus: data.field.type ? data.field.type : "",
                }
                var param = {
                    Page: data.field.Page ? data.field.Page : 1,
                    Rows: 7,
                    Filter: JSON.stringify(Filter)
                }
            }

            $.http.post(LuckVipsoft.api.GetMallOrderListPage, param, user.token, function (res) {
                if (res.status == 1) {
                    if (res.data.list.length > 0) {
                        _this.list = res.data.list;
                        var template = function (data) {
                            var html = "";
                            for (var i = 0; i < data.length; i++) {
                                html += `<tr>
                               <td>${data[i].BillCode}</td>
                               <td>${data[i].CardID}</td>
                               <td>${data[i].CardName}</td>
                               <td>${_this.orderStatus(data[i].Status)}</td>
                               <td>${cashier.dateFormat(data[i].CreateTime)}</td>
                               <td><button type="button" class="add-bt online-order-bt bt-xq">详情</button></td>
                             </tr>`
                            };
                            return html
                        }
                        $("#order tbody").html(template(res.data.list));
                        $('.layui-none').hide();
                        laypage.render({
                            elem: 'orderPage', //容器名称
                            limit: 7,  //每页条数
                            count: res.data.total, //总页数
                            theme: "#41c060",//颜色
                            curr:param.Page,
                            jump: function (obj, first) {
                                if (!first) {
                                    var _param = {
                                        Page: obj.curr,
                                        Rows: 7,
                                        Filter: JSON.stringify(Filter)
                                    }
                                    $.http.post(LuckVipsoft.api.GetMallOrderListPage, _param, user.token, function (res) {
                                        _this.list = res.data.list;
                                        $("#order tbody").html(template(res.data.list));
                                        $('.layui-none').hide();
                                    });
                                }
                            },
                        });
                    } else {
                        $("#order tbody").html('');
                        $('.layui-none').show();
                    }
                }
            });
        },
        //订单详情
        details: function () {
            _this = this
            $("#order").on("click", ".bt-xq", function () {
                $(this).blur();
                var i = $(this).index("#order .bt-xq")
                var param = {
                    OrderId: _this.list[i].Id
                };
                $.http.post(LuckVipsoft.api.GetMallOrderDetail, param, user.token, function (res) {
                    if (res.status == 1) {
                        var details = res.data.Details ? res.data.Details : [];
                        var _detailed = function (data) {
                            var _html = '';
                            for (var i = 0; i < data.length; i++) {
                                if (data[i].GoodsType == 1) {
                                    _html += `<tr><td>普通产品</td>`
                                } else if (data[i].GoodsType == 2) {
                                    _html += `<tr><td>服务产品</td>`
                                } else if (data[i].GoodsType == 3) {
                                    _html += `<tr><td>计时产品</td>`
                                } else if (data[i].GoodsType == 4) {
                                    _html += `<tr><td>计次产品</td>`
                                } else if (data[i].GoodsType == 5) {
                                    _html += `<tr><td>套餐</td>`
                                };
                                _html += `<td>${data[i].GoodsCode ? data[i].GoodsCode : ""}</td>
                                  <td>${data[i].GoodsName}</td>
                                  <td>￥${data[i].DiscountPrice}</td>
                                  <td>${data[i].Number}</td>
                                  <td>￥${data[i].TotalMoney}</td>
                                </tr>`
                            }
                            return _html
                        }
                        if (_this.list[i].Status == 0 || _this.list[i].Status == 8) {
                            var btn = ['确定']
                        } else if (_this.list[i].Status == 1) {
                            var btn = ['发货', '取消']
                        } else if (_this.list[i].Status > 1 && _this.list[i].Status < 7) {
                            var btn = ['查看物流', '取消']
                        } else if (_this.list[i].Status == 7) {
                            var btn = ['确认退货', '取消']
                        }
                        layer.open({
                            type: 1,
                            title: '订单',
                            closeBtn: 1,
                            shadeClose: false,
                            shade: 0.3,
                            btn: btn,
                            btnAlign: "r",
                            area: ['880px', '650px'],
                            maxmin: false,//禁用最大化，最小化按钮
                            resize: false,//禁用调整大小
                            move: false,//禁止拖拽
                            skin: "lomo-ordinary",
                            content: $(".lomo-gd"),
                            yes: function (index, layero) {
                                $(this).blur();
                                if (_this.list[i].Status == 1) {
                                    _this.deliverGoods(_this.list[i].Id);
                                    return false;
                                } else if (_this.list[i].Status > 1 && _this.list[i].Status < 7) {
                                    _this.logistics(res.data.ExpressNo, res.data.ExpressCode);
                                    return false;
                                } else if (_this.list[i].Status == 7) {

                                }
                                else {
                                    layer.close(index)
                                }
                            },
                            success: function (layero, index) {
                                $('#CreateTime').text(cashier.dateFormat(_this.list[i].CreateTime));
                                $('#BillCode').text(res.data.BillCode);
                                $('#CardID').text(res.data.CardID);
                                $('#CardName').text(res.data.CardName);
                                $('#LevelName').text(res.data.LevelName);
                                $('#ShopName').text(res.data.ShopName);
                                $('#Consignee').text(res.data.Consignee ? res.data.Consignee : "");
                                $('#ConsigneeMobile').text(res.data.ConsigneeMobile ? res.data.ConsigneeMobile : "");
                                $('#Address').text(res.data.Address ? res.data.Address : "");
                                $('#ExpressNo').text(res.data.ExpressNo ? res.data.ExpressNo : "");
                                $('#ExpressName').text(res.data.ExpressName ? res.data.ExpressName : "");
                                $('#Remark').text(res.data.ExpressName ? res.data.Remark : "");
                                $('#TotalMoney').text('￥' + (res.data.TotalMoney ? res.data.TotalMoney : ""));
                                $('#Postage').text(res.data.Postage ? res.data.Postage : "");
                                $('#Payments').html(_this._Payment(res.data.Payments ? res.data.Payments : []));
                                $('#details').html(_detailed(details ? details : []));
                            }
                        });
                    }
                });
            })
        },
        _time: function () {
            time1 = cashier.revDateFormat($('#orderTimeStart').val());
            time2 = cashier.revDateFormat($('#orderTimeEnd').val());
            return [time1, time2]
        },
        _Payment: function (data) {
            if (data.length == 0) {
                return ""
            } else {
                var _html = "";
                for (var i = 0; i < data.length; i++) {
                    _html += ` <span >${data[i].PaymentName}：</span><span class="bold" style="margin-right:20px;">￥${data[i].PayAmount}</span>`
                };
                return _html
            }
        },
        getMaxTime: function (dtTime, numDay) {
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
        },
        getMinTime: function (dtTime, numDay) {
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
        },
        orderStatus: function (type) {
            if (type == 0) {
                return '待付款'
            } else if (type == 1) {
                return '待发货'
            } else if (type == 2) {
                return '待收货'
            } else if (type == 3) {
                return '待评价'
            } else if (type == 4) {
                return '正常'
            } else if (type == 5) {
                return '已取消'
            } else if (type == 6) {
                return '退款'
            } else if (type == 7) {
                return '申请退货'
            } else if (type == 8) {
                return '待核销'
            } else {
                return ""
            }
        },
        election: function (minTime, maxTime) {
            var that = this
            $(".online-order-time li").on("click", function () {
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
                $("#orderTimeStart").val(Time)

            })
        },
        //订单核销
        writeOff: function () {
            var _this = this
            form.on('submit(search)', function (data) {
                var param = {
                    Code: data.field.inSearch
                };
                _this.submitted(param);
                return false
            });
        },
        //核销确定
        submitted: function (data) {
            var _this = this
            $.http.post(LuckVipsoft.api.GetPreWriteOffOrder, data, user.token, function (res) {
                if (res.status == 1) {
                    $('*').blur();
                    var _detailed = function (data) {
                        var _html = '';
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].GoodsType == 1) {
                                _html += `<tr><td>普通产品</td>`
                            } else if (data[i].GoodsType == 2) {
                                _html += `<tr><td>服务产品</td>`
                            } else if (data[i].GoodsType == 3) {
                                _html += `<tr><td>计时产品</td>`
                            } else if (data[i].GoodsType == 4) {
                                _html += `<tr><td>计次产品</td>`
                            } else if (data[i].GoodsType == 5) {
                                _html += `<tr><td>套餐</td>`
                            };
                            _html += `<td>${data[i].GoodsCode ? data[i].GoodsCode : ""}</td>
                              <td>${data[i].GoodsName}</td>
                              <td>￥${data[i].DiscountPrice}</td>
                              <td>${data[i].Number}</td>
                              <td>￥${data[i].TotalMoney}</td>
                              <td>${data[i].WriteOffCode}</td>`
                            if (data[i].IsWriteOff == 0) {
                                _html += '<td class="lomo-commodities-hx">单独核销</td></tr>'
                            } else {
                                _html += '<td>已核销</td></tr>'
                            }
                        }
                        return _html
                    }
                    var details = res.data.Details
                    var html = `<div class="lomo-gd order-cd cd-info" style="margin: 0;width: 100%;height: 100%;">
                        <div class="order-cd-info">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" class="order-cdTable"
                            style="background: #F2F2F2;">
                            <tr>
                              <td width="49%"><i>订单日期：</i><em>${cashier.dateFormat(res.data.CreateTime)}</em></td>
                              <td></td>
                            </tr>
                            <tr>
                              <td width="49%"><i>单据编号：</i><em>${res.data.BillCode}</em></td>
                              <td></td>
                            </tr>
                            <tr>
                              <td><i>会员卡号：</i><em>${res.data.CardID}</em></td>
                              <td><i>会员姓名：</i><em>${res.data.CardName}</em></td>
                            </tr>
                            <tr>
                              <td><i>会员等级：</i><em>${res.data.LevelName}</em></td>
                              <td><i>所属门店：</i><em>${res.data.ShopName}</em></td>
                            </tr>
                            <tr>
                            <td><i>收货人：</i><em>${res.data.Consignee ? res.data.Consignee : ""}</em></td>
                            <td><i>联系方式：</i><em>${res.data.ConsigneeMobile ? res.data.ConsigneeMobile : ""}</em></td>
                            </tr>
                            <tr>
                            <td colspan="2"><i>收货地址：</i><em>${res.data.Address ? res.data.Address : ""}</em></td>
                            </tr>
                            <tr>
                            <td><i>快递单号：</i><em>${res.data.ExpressNo ? res.data.ExpressNo : ""}</em></td>
                            <td><i>快递公司：</i><em>${res.data.ExpressName ? res.data.ExpressName : ""}</em></td>
                            </tr>
                            <tr>
                              <td colspan="2"><i>卖家留言：</i><em>${res.data.Remark ? res.data.Remark : ""}</em></td>
                            </tr>
                          </table>
                          <div class="lomo-xq-czxq" style="min-height:80px;height:auto;">
                            <div><span>折后金额：</span><span class="bold size-red">￥${res.data.TotalMoney}</span></div>
                            <div> <span>运费：</span><span class="bold">${res.data.Postage ? res.data.Postage : ""}</span></div>
                            <div style="min-height:30px;height:auto;">
                              ${_this._Payment(res.data.Payments ? res.data.Payments : [])}
                            </div>
                          </div>
                          <div class="order-cdTable2Sco"><table width="100%" border="0" cellspacing="0" cellpadding="0" class="order-cdTable2"style="margin-top:20px;">
                          <tr><th>商品类型</th><th>商品编号</th><th>商品名称</th><th>折后单价</th><th>商品数量</th><th>总金额</th><th>核销码</th><th>操作</th></tr>
                           <tbody>${_detailed(details)}</tbody>
                          </table>
                        </div>
                        </div>
                      </div>`;
                    layer.open({
                        type: 1,
                        title: '订单详情',
                        closeBtn: 1,
                        shadeClose: false,
                        shade: 0.3,
                        btn: ['整单核销', '取消'],
                        btnAlign: "r",
                        area: ['880px', '640px'],
                        maxmin: false,//禁用最大化，最小化按钮
                        resize: false,//禁用调整大小
                        move: false,//禁止拖拽
                        skin: "lomo-ordinary",
                        content: html,
                        yes: function (index, layero) {
                            _this.destruction(0, res.data.BillCode)
                            return false
                        },
                        success: function () {
                            $('body').on('click', '.lomo-commodities-hx', function () {
                                var i = $(this).index();
                                _this.destruction(1, details[i].GoodsCode);
                            });
                        }
                    });
                } else {
                    layer.msg(res.msg)
                }
            });
        },
        //商品核销
        destruction: function (type, data) {
            var _this = this;
            var html = '';
            layer.msg('请选择提成员工')
            //员工树形列表
            if (user.staffClass && user.staffInf[0]) {
                $.each(user.staffClass, function (index, item) {
                    html += '<div class="layui-collapse">'
                    html += '<div class="layui-colla-item">'
                    html += '<h2 class="layui-colla-title">' + item.ClassName + '</h2>'
                    html += '<div class="layui-colla-content layui-show"><ul class="">'
                    $.each(user.staffInf, function (n, items) {
                        if (items.StaffClassId == item.Id) {
                            html += '<li>' + items.StaffName + '</li>'
                        }
                    })
                    html += '</div>'
                    html += '</div>'
                    html += '</div>'
                })
            }
            $('.lomo-xztcyg .lomo-xztcyg-left').html(html);
            //已选择员工列表
            var grid_conpon = table.render({
                elem: '#List',
                data: user.staffInf[0],
                cellMinWidth: 95,
                cols: [
                    [
                        { field: 'StaffName', title: '姓名', align: 'center' },
                        { field: 'money', title: '提成金额', edit: 'text', align: 'center' },
                        { field: 'remark', title: '备注', edit: 'text', align: 'center' },
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
            layer.open({
                type: 1,
                id: "searchMemCard",
                title: '商品核销',
                closeBtn: 1,
                shadeClose: false,
                shade: 0.3,
                maxmin: false,//禁用最大化，最小化按钮
                resize: false,//禁用调整大小
                area: ['90%', '80%'],
                btn: ['确认核销', '取消'],
                skin: "lomo-ordinary",
                btnAlign: "r",
                content: $(".lomo-xztcyg"),
                yes: function (index, layero) {
                    var staffs = [{ StaffId: '', CommissionMoney: 10.0, Remark: '' }]
                    var param = {
                        WriteOffType: type,
                        WriteOffId: data,
                        Staffs: JSON.stringify(staffs)
                    }
                    $.http.post(LuckVipsoft.api.WriteOffMallOrder, param, user.token, function (res) {

                    });
                    return false;
                },
                success: function () {
                    grid_conpon.reload();
                    element.render();
                    table.on('tool(List)', function (obj, index) {
                        if (obj.event == 'delete') {
                            obj.del(index);
                        }
                    });

                    $('body').on('click', '.layui-colla-content li', function () {
                        var i = $(this).index('.layui-colla-content li');
                    })
                }
            })
        },
        //键盘操作
        keyboard: function () {
            $(".card-num-up").on("click", function () {
                if (initial.keyPanel) {
                    $(this).parent().addClass("key-confirm") //用于确认哪个输入框打开小键盘
                    $(".Card-Cancel-keyboard").show();
                    initial.keyPanel = false;
                } else if (!initial.keyPanel) {
                    $(".Card-Cancel-keyboard").hide();
                    initial.keyPanel = true;
                };
            });
            //小键盘点击
            $(".small-keyboard-num li").on("click", function () {
                let key = $(this).html();
                if (key == "确认") {
                    var param = {
                        OrderID: $("#inSearch").val()
                    };
                    if (param.OrderID == "") return false
                    _this.submitted(param);
                } else {
                    if (key == "清除") {
                        record = "";
                    } else if (key == "←") {
                        record = record.substring(0, record.length - 1);
                    }
                    else {
                        record += key;
                    };
                    $(".key-confirm input").val(record);
                };
            });
        },
        //发货
        deliverGoods: function (OrderId) {
            var _this = this
            layer.open({
                type: 1,
                title: '确认发货',
                closeBtn: 1,
                shadeClose: false,
                shade: 0.3,
                btn: ['发货', '取消'],
                btnAlign: "r",
                area: ['800px', '580px'],
                maxmin: false,//禁用最大化，最小化按钮
                resize: false,//禁用调整大小
                move: false,//禁止拖拽
                skin: "lomo-ordinary",
                content: $('.lomo-fh'),
                yes: function (index, layero) {
                    return false;
                },
                success: function (layero, index) {
                    var list = [
                        { expName: "EMS", simpleName: "ems", },
                        { expName: "中通快运", simpleName: "ztoKy" },
                        { expName: "顺丰速运", simpleName: "shunfeng" },
                        { expName: "申通快递", simpleName: "shentong" },
                        { expName: "韵达美国件", simpleName: "yundaexus" },
                        { expName: "圆通速递", simpleName: "yuantong" },
                        { expName: "天天快递", simpleName: "tiantian" },
                        { expName: "百世快递(原汇通)", simpleName: "huitong" }
                    ]
                    var explist = new Array;
                    layero.addClass('layui-form');
                    layero.find('.layui-layer-btn0').attr({
                        'lay-filter': 'deliverGoods',
                        'lay-submit': ''
                    });
                    form.render();
                    $("#courierName").val(list[0].expName).attr({ "readonly": "readonly", "data-simpleName": list[0].simpleName })
                    //选择默认的快递公司
                    $('body').on('click', '.lomo-express-list div', function () {
                        var i = $(this).index('.lomo-express-list>li>div');
                        $("#courierName").val(list[i].expName).attr({ "readonly": "readonly", "data-simpleName": list[i].simpleName })
                        $(".lomo-express-option").html('').hide();
                        $(this).addClass('lomo-express-list-hover').parent().siblings().children().removeClass('lomo-express-list-hover');
                    })
                    //选择更多的快递公司
                    $('.fh-form-label').on('click', function () {
                        $("#courierName").removeAttr("readonly").val('').focus();
                        $(".lomo-express-list li div").removeClass('lomo-express-list-hover');
                    });
                    $("#courierName").on('input', cashier.throttle(function () {
                        var value = $(this).val();
                        if (value != "") {
                            _this.express(value).then(function (exp) {
                                explist = exp
                                if (exp.length > 0) {
                                    var html = '';
                                    exp.forEach(element => {
                                        html += `<span>${element.expName}</span>`
                                    });
                                    $(".lomo-express-option").html(html).show();
                                } else {
                                    $(".lomo-express-option").html('').show();
                                }
                            })
                        }
                    }, 300, 600));
                    //搜索点击
                    $(".lomo-express-option").on("click", "span", function () {
                        var i = $(this).index();
                        $("#courierName").val($(this).text()).attr({ "readonly": "readonly", "data-simpleName": explist[i].simpleName })
                        $(".lomo-express-option").html('').hide();
                    });

                    form.on('submit(deliverGoods)', function (data) {
                        var param = {
                            OrderID: OrderId,
                            ExpressNo: data.field.courierCode,
                            ExpressCode: $("#courierName").attr("data-simpleName"),
                            ExpressName: data.field.courierName,
                        };
                        $.http.post(LuckVipsoft.api.DeliverMallOrder, param, user.token, function (res) {
                            layer.msg(res.msg);
                            if (res.status == 1) {
                                $('#ExpressNo').text(data.field.courierCode);
                                $('#ExpressName').text(data.field.courierName);
                                $('#Remark').text(data.field.courierName);
                                layer.close(index);
                            }
                        });
                        return false;
                    });
                },
            });
        },
        // <span class="card-num-up"></span>
        // <div class="small-keyboard Card-Cancel-keyboard hide" style="top: 126px;left: 150px;">
        //   <ul class="small-keyboard-num"><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li><li>8</li> <li>9</li><li>0</li><li>00</li><li>.</li><li>←</li><li class="keyboard-remove">清除</li><li class="keyboard-confirm">确认</li></ul>
        //   <em class="topSjx"></em>
        // </div>
        //查询快递公司
        express: function (name) {
            return new Promise(function (resolve, reject) {
                $.ajax({
                    type: "POST",
                    contentType: "application/json",
                    beforeSend: function (xrh) {
                        xrh.setRequestHeader("luck_api_token", user.token);
                    },
                    data: JSON.stringify({
                        Page: 1, Rows: 5, ExpressName: name
                    }),
                    url: LuckVipsoft.http + LuckVipsoft.api.GetExpressList,
                    dataType: "json",
                    success: function (res) {
                        resolve(res.data.list)
                    },
                });
            });
        },
        //查看物流
        logistics: function (ExpressNo, Expresscode) {
            $.http.post(LuckVipsoft.api.GetExpressInfo, { ExpressNumber: ExpressNo, ExpressType: Expresscode }, user.token, function (res) {
                if (res.status == 1) {
                    var html = `<div><h2>${res.data[0].number}</h2></div>`
                    var log = function (data) {
                        var _html = ''
                        data.forEach(item => {
                            _html += `<li class="layui-timeline-item">
                            <i class="layui-icon layui-timeline-axis"></i>
                             <div class="layui-timeline-content layui-text">
                             <h3 class="layui-timeline-title">${item.time}</h3>
                               <div class="layui-timeline-title"> ${item.context}</div>
                             </div>
                           </li>`
                        })
                        return _html
                    }
                    layer.open({
                        type: 1,
                        title: '物流信息',
                        closeBtn: 1,
                        shadeClose: false,
                        shade: 0.3,
                        btn: ['确定'],
                        btnAlign: "r",
                        area: ['580px', '690px'],
                        maxmin: false,//禁用最大化，最小化按钮
                        resize: false,//禁用调整大小
                        move: false,//禁止拖拽
                        skin: "lomo-ordinary",
                        content: `<div style="padding:20px;">
                        <div class="lomo-logistics">
                          <div class="lomo-logistics-Inf">
                            <span>快递单号：</span>
                            <span> ${res.data[0].number}</span>
                          </div>
                          <div class="lomo-logistics-Inf">
                            <span>快递公司：</span>
                            <span>${res.data[0].name}</span>
                          </div>
                        </div>
                        <div style="margin-top:20px;">
                        </div>
                        <div class="lomo-logistics" style="height:400px">
                        <ul class="layui-timeline">
                        ${log(res.data)}
                        </ul> 
                        </div>
                      </div>`,
                    });
                } else {
                    layer.msg(res.msg);
                }
            });
        },
        //退货
        returnGoods:function(){

        },
        //重新渲染表单
        render: function (name) {
            var _this = this;
            var data = $("#List").serializeArray();
            var page = $("#orderPage .layui-laypage-em").next().html(); //当前页码值
            var key = {
                field: {
                    BillCode: data[0].value,
                    DeliveryStatus: data[1].value,
                    Page:parseInt(page)
                }
            }
            _this.getList(key)
        }
    };
    order.start();
    //选项卡切换
    $(".lomoTab span").on("click", function () {
        $(this).addClass("hover").siblings().removeClass("hover");
        var index = $(this).index();
        $(".lomoTab-warp").eq(index).show().siblings(".lomoTab-warp").hide();
        $(".Card-Cancel-keyboard").hide();
        initial.keyPanel = true;
    });

})