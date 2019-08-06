layui.use(['layer', 'jquery', "form", "laypage"], function () {
    var layer = layui.layer, $ = layui.$, form = layui.form, laypage = layui.laypage;
    var user = {
        token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
        information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
    };
    var writeOff = {
        record: "", //    小键盘输入
        initial: {
            keyPanel: true //小键盘
        },
        conponCode: 0,
        couponList: [],
        init: function () {
            this.keyboard();
            this.search();
            this.destruction();
        },
        keyboard: function () {
            //打开小新键盘
            var _this = this;
            var record = this.record;
            var initial = this.initial;
            $(".card-num-up").on("click", function () {
                if (initial.keyPanel) {
                    $(".Card-Cancel-keyboard").show()
                    initial.keyPanel = false;
                } else if (!initial.keyPanel) {
                    $(".Card-Cancel-keyboard").hide()
                    initial.keyPanel = true;
                }
            })
            //键盘点击
            $(".small-keyboard-num li").on("click", function () {
                var key = $(this).html();
                if (key == "确认") {
                    var param = {
                        Page: 1,
                        Rows: 6,
                        ConponCode: $("#inSearch").val(),
                        UseType: "1"
                    };
                    _this.submitted(param);
                } else {
                    if (key == "清除") {
                        record = ""
                    } else if (key == "←") {
                        record = record.substring(0, record.length - 1)
                    }
                    else {
                        record += key
                    };
                    $("#inSearch").val(record);
                }
            })
        },
        search: function () {
            var _this = this;
            form.verify({
                ticket: function (value, item) {
                    if (value != "") {
                        if (!verify.cardID[0].test(value) && !verify.coupon[0].test(value)) {
                            return '输入错误';
                        }
                    };
                }
            });
            form.on('submit(search)', function (data) {
                var param = {
                    Page: 1,
                    Rows: 6,
                    ConponCode: data.field.inSearch,
                    UseType: "1"
                };
                _this.submitted(param);
                return false;
            });
        },
        destruction: function () {
            var _this = this;
            $(".Card-Cancel-list").on("click", "li", function () {
                $(this).addClass("li-selected").siblings().removeClass("li-selected")
                writeOff.conponCode = $(this).find('.list-discount').html().split('优惠券号：')[1]

            });
            form.on('submit(del)', function (data) {
                if (_this.conponCode == 0) {
                    layer.msg('请选择优惠券')
                } else {
                    var param = {
                        ConponCode: _this.conponCode
                    }
                    $.http.post(LuckVipsoft.api.WriteOffCoupon, param, user.token, function (res) {
                        layer.msg(res.msg)
                        if (res.status == 1) {
                            var curr = 0
                            var html = ''
                            for (var i = 0; i < _this.couponList.length; i++) {
                                if (_this.couponList[i] == _this.conponCode) {
                                    curr = i
                                }
                            }
                            _this.couponList.splice(curr, 1)
                            for (var i = 0; i < _this.couponList.length; i++) {
                                var state = '未使用'
                                if ( _this.couponList[i].State == 0) {
                                    state = '未使用'
                                } else if ( _this.couponList[i].State == 1) {
                                    state = '已使用'
                                } else if ( _this.couponList[i].State == 2) {
                                    state = '部分使用'
                                }
                                html += `<li><img src="../../../../Theme/images/icon012.png" />
                                       <div> <span>${ _this.couponList[i].Title}<i>${state}</i></span> <small>有效期：${ _this.couponList[i].EndTime}</small>
                                          <small class="list-discount">优惠券号：${ _this.couponList[i].ConponCode}</small></div></li>`
                            }
                            $('.Card-Cancel-list').children().html(html)
                        }
                    })
                };
                return false;
            });

        },
        submitted: function (param) {
            var _this = this
            $.http.post(LuckVipsoft.api.GetConponLogListPage, param, user.token, function (res) {
                layer.msg(res.msg);
                if (res.status == 1) {
                    if (res.data.list.length > 0) {
                        _this.couponList = res.data.list;
                        layer.msg('操作成功')
                        $(".Card-Cancel-txt").parent().hide();
                        $(".Card-Cancel-list").parent().show();
                        var html = '';
                        for (var i = 0; i < res.data.list.length; i++) {
                            var state = '未使用'
                            if (res.data.list[i].State == 0) {
                                state = '未使用'
                            } else if (res.data.list[i].State == 1) {
                                state = '已使用'
                            } else if (res.data.list[i].State == 2) {
                                state = '部分使用'
                            }
                            html += `<li><img src="../../../../Theme/images/icon012.png" /><div> <span>${res.data.list[i].Title}<i>${state}</i></span> <small>有效期：${res.data.list[i].EndTime}</small><small class="list-discount">优惠券号：${res.data.list[i].ConponCode}</small></div></li>`;
                        }
                        laypage.render({
                            elem: 'paging', //容器名称
                            limit: 6,  //每页条数
                            count: res.data.total, //总页数
                            theme: "#41c060",//颜色
                            curr: 1,
                            jump: function (obj, first) {
                                var _param = {
                                    Page: obj.curr,
                                    Rows: 6,
                                    ConponCode: param.ConponCode,
                                    UseType: "1"
                                };
                                $.http.post(LuckVipsoft.api.GetConponLogListPage, _param, user.token, function (res) {
                                    if (res.status == 1) {
                                        var html = '';
                                        for (var i = 0; i < res.data.list.length; i++) {
                                            var state = '未使用'
                                            if (res.data.list[i].State == 0) {
                                                state = '未使用'
                                            } else if (res.data.list[i].State == 1) {
                                                state = '已使用'
                                            } else if (res.data.list[i].State == 2) {
                                                state = '部分使用'
                                            }
                                            html += `<li><img src="../../../../Theme/images/icon012.png" />
                                                   <div> <span>${res.data.list[i].Title}<i>${state}</i></span> <small>有效期：${res.data.list[i].EndTime}</small>
                                                      <small class="list-discount">优惠券号：${res.data.list[i].ConponCode}</small></div></li>`;
                                            $('.Card-Cancel-list').children().html(html);
                                        }
                                    };
                                })
                            }
                        })
                        $('.Card-Cancel-list').children().html(html);
                    } else {
                        layer.msg("未找到符号条件的卡券");
                    }
                }
            })
        }
    };
    writeOff.init();


})