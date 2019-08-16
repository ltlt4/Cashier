var netWork = new Array();
var sysArgument = $.session.get('Cashier_User').SysArguments
var oPayCompose = new payCompose(sysArgument)


layui.use(['layer','element', 'jquery', 'form', 'table'], function () {
    var $ = layui.jquery,
        layer = layui.layer,
        form = layui.form,
        element = layui.element,
        table = layui.table; 
    var maskBody = ".lomo-mask-body";
    var mask1 = ".lomo-mask";
    var initial = {
        menu: true,
        //左侧菜单Cashier_User
        shut: function shut() {
            //关闭菜单
            cashier.close('.lomo-topTool', 'fadeInLeft', 'fadeOutLeft', mask1);
            this.menu = true;
        },
        unfold: function unfold() {
            //打开菜单
            cashier.open('.lomo-topTool', 'fadeInLeft', 'fadeOutLeft', mask1);
            this.menu = false;
        }
    };
    var user = {
        token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
        information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
        lock: $.session.get("lock") ? $.session.get("lock") : null
    };
    $.http.post(LuckVipsoft.api.GetCashierSetting, {}, user.token, function (res) {
        if (res.status == 1) {
            if(typeof(SetCashierSetting)=="function"){ 
                SetCashierSetting(JSON.stringify(res.data));
            }
           // if(SetCashierSetting) SetCashierSetting(JSON.stringify(res.data));
        }
    });
    //打开左侧菜单
    $(".lomo-top-logo a").on("click", cashier.throttle(function () {
        if (initial.menu) {
            initial.unfold();
        } else if (!initial.menu) {
            initial.shut();
        }
    }, 300, 600));
    $(mask1).on("click", function () {
        initial.shut();
    });
    /*验证有无token*/
    if (user.token == null) {
        window.location.href = "../../Views/Account/login.html";
    } else {
        $(".lomo-top-tool dt").html(user.information.MasterName);
    }
    /**验证有无锁屏 */
    if (user.lock != null) {
        var html = '<div class="lomo-Unlock"><div class="lomo-Unlock-top"><img src="../../Theme/images/lock.svg" alt=""></div><div class="lomo-Unlock-bottom"><div><form><input type="password"   placeholder="请输入解锁密码"><button type="submit" class="lomo-Unlock-img"></button><form></div></div></div>';
        layer.open({
            type: 1,
            title: false,
            closeBtn: false,
            shadeClose: false,
            shade: 0.4,
            area: ['400px', '350px'],
            maxmin: false,
            //禁用最大化，最小化按钮
            resize: false,
            //禁用调整大小
            move: false,
            //禁止拖拽
            skin: "lomo-Unlock-c",
            content: html
        });
    }
    //菜单选项
    $(".lomo-topTool li .lomo-skip").on("click", function () {
        var iframe = $('#childframe');
        var router = $(this).attr("data-route");
        iframe.attr('src', router);
        initial.shut();
    });
    //加载客服中心
    $.http.post(LuckVipsoft.api.GetMasterInfo, {}, user.token, function (res) {
        if (res.status == 1) {
            $("#CustomerMobile").text(res.data.HotLine);
            $("#CustomerQQ").text(res.data.CustomerQQ);
        }
    });
    //意见反馈
    $("#feedbackBut").click(function () {
        layer.open({
            type: 1,
            title: '意见反馈',
            closeBtn: 1,
            shadeClose: false,
            shade: 0.3,
            btnAlign: "c",
            area: ['450px', '400px'],
            maxmin: false,
            resize: false,
            move: false,
            skin: "lomo-alone",
            content: $(".feedback").html(),
            yes: function yes() {
                return false;
            },
            success: function success(layero, index) {
                form.render();
                form.verify({
                    name: function name(value, item) {
                        if (value != "") {
                            if (!verify.name[0].test(value)) return '姓名输入错误';
                        }
                    },
                    phone: function phone(value, item) {
                        if (value != "") {
                            if (!verify.phone[0].test(value)) return verify.phone[1];
                        }
                    }
                });
                form.on('submit(opinion)', function (data) {
                    var param = {
                        Name: data.field.contacts,
                        Phone: data.field.contactInf,
                        Message: data.field.describe,
                        MessageType: data.field.mesType
                    };
                    $.http.post(LuckVipsoft.api.SaveUserFeedBackData, param, user.token, function (res) {
                        layer.msg(res.msg);
                        if (res.status == 1) {
                            layer.close(index);
                        }
                    });
                    return false;
                });
            }
        });
    })
    /*交班*/
    $('.tool-man').click(function () {
        $.http.post(LuckVipsoft.api.GetShiftTurnOverData, {}, user.token, function (res) {
            if (res.status == 1) {
                var revenue = function revenue(record) {
                    if (record) {
                        var ht = '';

                        for (var i = 0; i < record.length; i++) {
                            ht += "<div><span class=\"text-j change-list-right-j\">".concat(record[i].name, "<i></i></span><span>:</span><span class=\"change-form-span\"style=\"margin-left:7px;\">\uFFE5").concat(record[i].amount, "</span></div>");
                        }
                        return ht;
                    } else {
                        return '';
                    }
                };
                var html = `<div class="lomo-network-change"><dl class="network-change-form"><div class="change-form-address"><img src="../../Theme/images/guard002.svg" alt="">
                <span>${$.session.get('Cashier_User').ShopName}</span>
                </div><div class="change-form-person"><img src="../../Theme/images/guard001.svg" alt="">
                <span>${$.session.get('Cashier_User').MasterName}</span>
               </div><div class="change-form-time"><img src="../../Theme/images/guard003.svg" alt="">
               <span>${cashier.dateFormat(res.data.StatisticalTime)}-${cashier.curentTime(new Date())}</span>
               </div><div class="change-form-number"><img src="../../Theme/images/guard005.svg" alt="">
               <span>新增会员人数：</span><span class="change-form-span">${res.data.OpenCardNum}</span>
                 </div><div class="change-form-price"><img src="../../Theme/images/guard004.svg" alt="">
                <span>售卡金额：</span><span class="change-form-span">${res.data.SaleCardAmount}</span></div></dl>
                <div class="network-change-list"><ul>
                <li>
                <div>
                <div class="change-list-left" style="background: #FFC542;"></div>
               <div class="change-list-right">
                 <div class="change-list-right-up">
                <span>充值总额：</span><span class="change-form-span">￥${res.data.TopUpTotalAmount}</span>
               </div>
                <div class="change-list-right-down">
                 ${revenue(res.data.RechargeCountDetail)}
                </div></div></div></li>
               <li>
                <div>
                <div class="change-list-left" style="background: #A461D8;"></div>
                <div class="change-list-right">
                 <div class="change-list-right-up">
                <span>充次总额：</span><span class="change-form-span">￥${res.data.RechargeCountTotalAmount}</span>
                </div>
                <div class="change-list-right-down">
               ${revenue(res.data.RechargeCountPreferentialDetail)}
               </div></div></div></li>
                <li>
               <div>
                <div class="change-list-left" style="background: #3BA2F2;"></div>
                <div class="change-list-right">
                <div class="change-list-right-up">
                <span>退款货总额：</span><span class="change-form-span">￥${res.data.ReturnGoodsTotalAmount}</span>
                </div>
                <div class="change-list-right-down">
                ${revenue(res.data.ReturnGoodsDetail)}
                </div></div></div></li>
                <li>
                <div>
                <div class="change-list-left" style="background: #41C060;"></div>
                <div class="change-list-right">
                 <div class="change-list-right-up">
                <span>消费总额：</span><span class="change-form-span">￥${res.data.ConsumeTotalAmount}</span>
               </div>
                <div class="change-list-right-down">
                ${revenue(res.data.ConsumeDetail)}
                </div></div></div></li>
                <li>
               <div>
                <div class="change-list-left" style="background: #FF7174;"></div>
                <div class="change-list-right">
                <div class="change-list-right-up">
                <span>综合总收入：</span><span class="change-form-span">￥${res.data.TotalInCome}</span>
                </div>
               <div class="change-list-right-down">
                ${revenue(res.data.TotalInComeDetail)}
               </div></div></div></li>
                </ul></div>
                <div class="network-change-remark layui-form-item"><label for="">备注</label><input type="text" name="remarks" placeholder="请输入备注"></div>
                <div class="network-change-Ticket layui-form-item"><input  type="checkbox" value="1" name="printing" lay-skin="primary" title="打印交班小票" /><span></span></div>
                </div>`
                layer.open({
                                        type: 1,
                                        title: '交班',
                                        closeBtn: 1,
                                        shadeClose: false,
                                        shade: 0.4,
                                        btn: ['取消', '退出并交班'],
                                        btnAlign: "c",
                                        area: ['880px', '730px'],
                                        maxmin: false,
                                            //禁用最大化，最小化按钮
                                        resize: false,
                                            //禁用调整大小
                                        move: false,
                                            //禁止拖拽
                                        skin: "lomo-ordinary",
                                        content: html,
                                        btn2: function btn2(index, layero) {
                                            return false;
                                        },
                                        success: function success(layero, index) {
                                            layero.addClass('layui-form');

                                            layero.find('.layui-layer-btn1').attr({
                                                'lay-filter': 'handinshift',
                                                'lay-submit': ''
                                                });
                                            form.render();
                                            form.on('submit(handinshift)', function (data) {
                                                var param = {
                                                    Remark: data.field.remarks
                                                };
                                                $.http.post(LuckVipsoft.api.SaveShiftTurnOverData, param, user.token, function (res) {
                                                    layer.msg(res.msg);

                                                    if (res.status == 1) {
                                                        layer.close(index);
                                                        $.session.clear();
                                                        $.local.clear();
                                                        window.location.href = "../../Views/Account/login.html";
                                                    }

                                                        ;
                                                    });
                                                return false;
                                                });
                                        }
                                    });
                                    }
            });
        });
        /*锁屏设置*/
    $(".tool-lock").click(function () {
        $(this).blur();
        layer.open({
                type: 1,
                    title: '输入锁屏密码',
                    closeBtn: 1,
                    shadeClose: false,
                    shade: 0.3,
                    btnAlign: "c",
                    area: ['400px', '160px'],
                    maxmin: false,
                    //禁用最大化，最小化按钮
                    resize: false,
                    //禁用调整大小
                    move: false,
                    //禁止拖拽
                    skin: "lomo-alone",
                    content: '<div  class="lomo-lock"><form><input type="password" placeholder="请输入锁屏密码" ><button type="submit" class="submit-bt" id="lockScreen">确定</button></form></div>'
                    });
                });
            /*锁屏界面*/
    $('body').on('click', '#lockScreen', function (e) {
        e.preventDefault();
        var lock = $.md5($(this).prev().val());
        if (!lock.match(verify.empty[0])) {
            $.session.set('lock', lock);
            layer.closeAll('page');
            var html = '<div class="lomo-Unlock"><div class="lomo-Unlock-top"><img src="../../Theme/images/lock.svg" alt=""> </div><div class="lomo-Unlock-bottom"><div><form><input type="password"   placeholder="请输入解锁密码"><button type="submit" class="lomo-Unlock-img"></button><form></div></div></div>';
            layer.open({
                type: 1,
                    title: false,
                    closeBtn: false,
                    shadeClose: false,
                    shade: 0.4,
                    area: ['400px', '350px'],
                    maxmin: false,
                    //禁用最大化，最小化按钮
                    resize: false,
                    //禁用调整大小
                    move: false,
                    //禁止拖拽
                    skin: "lomo-Unlock-c",
                    content: html,
                    success: function success() {
                        layer.msg("锁屏成功");
                }
                    });
                } else {
            layer.msg(LuckVipsoft.lan.ER0020);
            }
        });
            /*解锁*/
    $('body').on('click', '.lomo-Unlock-img', function (e) {
        e.preventDefault();
        var unlock = $(this).prev().val();
        var _unlock = $.session.get('lock');
        if ($.md5(unlock) == _unlock) {
            layer.msg('解锁成功');
            layer.closeAll('page');
            $.session.remove('lock');
            } else {
            layer.msg('解锁密码输入错误');
            }
        });
            //网络设置
    $(".tool-web").on("click", function () {
        netWork = new Array();
        getNetWorks();
        layer.open({
                type: 1,
                    id: "searchMemCard",
                    title: '网络设置',
                    closeBtn: 1,
                    shadeClose: false,
                    shade: 0.3,
                    maxmin: false,//禁用最大化，最小化按钮
                    resize: false,//禁用调整大小
                    area: ['90%', '80%'],
                    skin: "lomo-ordinary",
                    content: $(".lomo-network-set")
                    })
                });
            //检测线路
    $("#checknetwork").on("click", function () {
        $.getJSON("https://download.nakevip.com/NewNake/network.json", function (data) {
            $("#networklist").html('');
            netWork = new Array();
            var html = '<tr><th>线路地址</th><th>响应时间</th><th>响应速度</th><th>操作</th></tr>';
            $.each(data, function (index, item) {
                var rTime = getNetWorkResponse(item);
                item.ResponseTime = rTime + "ms";
                item.ResponseSpeed = getResponseSpeed(rTime);
                netWork.push(item);
                html += ' <tr>'
                html += '<td>' + item.NetworkName + '</td>'
                html += ' <td>' + item.ResponseTime + '</td>'
                html += ' <td>' + item.ResponseSpeed + '</td>'
                if (LuckVipsoft.network.NetworkName == item.NetworkName) {
                    html += '<td><span>当前线路</span></td>';
                    }
                else {
                    html += ' <td onclick="chooseNetWork(\'' + item.NetworkName + '\')">进入该线路</td>'
                    }
                html += ' </tr>'
            });
            $("#networklist").html(html);

            });
            });

            //进入后台
    $(".tool8").on("click", function () {
        var LoginMsg = $.session.get("LoginMsg") ? $.session.get("LoginMsg") : null;
        var compCode = LoginMsg != null ? LoginMsg.CompCode : "lucksoft";
        if (!LuckVipsoft.InterfaceKey) {
            var param = {
                CompCode: compCode
            }
            $.ajax({
                dataType: "json",
                    ContentType: 'application/json',
                    type: "POST",
                    data: JSON.stringify(param),
                    url: LuckVipsoft.http + "/api/GeneralInterface/GetAuthorizeByCompCode",
                    async: false,
                    success: function (res) {
                        LuckVipsoft.InterfaceKey = res.data.InterfaceKey;
                        }
                        });
                }
        var params = {
                CompCode: LoginMsg.CompCode,
                    Account: LoginMsg.MasterAccount,
                    Password: LoginMsg.Password,
                    InterfaceKey: LuckVipsoft.InterfaceKey,
                    Url: LuckVipsoft.network.Address ? LuckVipsoft.network.Address : "http://192.168.0.13:84"
                    };
            console.log(JSON.stringify(params));
        GoToBackstage(JSON.stringify(params))
    })

    //支付
    var pay = {
        StaffList:[],
        StaffClassList:[],
        choosedStaffAry:[],
        init: function () {
            var _this = this;
            _this.payPopArea();
            _this.initPayItem();
            _this.initStaffList();
        },
        //初始化支付项
        initPayItem: function () {
            var html = ''
            $.each(sysArgument.PaymentConfig, function (index, item) {
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
                        chooseStaff = Object.assign([], oPayCompose.result.staffs)
                        $("body").find('.staff-list li').removeAttr("class");
                        $.each(chooseStaff, function (index, item) {
                            $("body").find('.staff-list li[data-id="' + item.StaffId + '"]').toggleClass("active");
                        })
                        tab_staff.reload({
                            data: chooseStaff
                        });

                        //初始
                        var html = '';
                        $(".staffname").remove();
                        _this.choosedStaffAry = Object.assign([], chooseStaff)
                        $.each(chooseStaff, function (index, item) {
                            html += '<span class="name staffname" data-id="' + item.StaffId + '">' + item.StaffName + '<i class="deletStaff">x</i></span>'
                        })
                        $(".lomo-tcyg-add .nameTitle").after(html);

                        element.render();
                    },
                    yes: function (index) {
                        oPayCompose.settingOrderStaffs(_this.choosedStaffAry)
                        console.log('_this.choosedStaffAry', _this.choosedStaffAry)
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
                                    { type: 'checkbox' },
                                    { field: 'Title', title: '名称', align: 'center' },
                                    { field: 'ConponCode', title: '券号', align: 'center' },
                                    { field: 'ValidType', title: '券类型', align: 'center' },
                                    { field: 'Quota', title: '优惠金额', align: 'center' },
                                    { field: 'WithUseAmount', title: '最低消费', align: 'center' },
                                ]
                            ]
                        });
                    },
                    yes: function (index, layero) {
                        console.log('chooseAry', oPayCompose.pageChooseConpon)
                        if (oPayCompose.pageChooseConpon.length > 0) {
                            var postData = oPayCompose.postCouponData() //获取优惠券提交数据
                            console.log('postData', JSON.stringify(postData))
                            $.http.post(LuckVipsoft.api.CalculateConponAmount, postData, user.token, function (res) {
                                if (res.status == 1) {
                                    if (oPayCompose.settingCoupon(res.data)) {
                                        layer.close(index)
                                    }
                                    else {
                                        $.luck.error('优惠卷计算错误')
                                    }
                                }
                                else {
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
                    if (obj.type == "one") {
                        if (obj.checked == true) {
                            if (obj.data.WithUseAmount > paidMoney) {
                                $.luck.error('当前优惠券不满足使用条件');
                                $(this).prop("checked", false);
                                form.render('checkbox')
                                return false
                            } else {
                                oPayCompose.pageChooseConpon.push(obj.data);
                            }
                        } else {
                            $.each(oPayCompose.pageChooseConpon, function (index, item) {
                                if (item.Id == obj.data.Id) {
                                    oPayCompose.pageChooseConpon.splice(index, 1)
                                    return
                                }
                            })
                        }
                        console.log(oPayCompose.pageChooseConpon)
                    } else { // 表示全选
                        if (obj.checked == true) {
                            var data = checkStatus.data;
                            layer.alert(JSON.stringify(data));
                        } else {

                        }
                    }

                })
            });

            //点击结算：微信或支付宝付款时用
            $("body").on("click", "#finishPayBtn", function () {
                if (oPayCompose.validPayMoney() < 0) {
                    $.luck.error('付款金额不足,无法完成支付')
                    return false
                }
                //请求接口
                let postUrl =''    
                let printMode = 0
                    
                console.log('oPayCompose.result.mode',oPayCompose.result.mode)
                switch(oPayCompose.result.mode)
                {
                    case 1:
                        postUrl =  LuckVipsoft.api.QuickConsume   
                        printMode =1                              
                        break;
                    case 2:                                   
                        postUrl = LuckVipsoft.api.GoodsConsume
                        printMode =2
                        break;
                    case 9:                                 
                        postUrl = LuckVipsoft.api.VenueConsume
                        printMode =5
                        break;
                    case 11:                                
                        postUrl = LuckVipsoft.api.TopUp
                        printMode =7
                        break;
                    case 12:                                   
                        postUrl =  LuckVipsoft.api.RechargeCount
                        printMode =8
                        break;                                                    
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
                        success: function (layero, index) {
                            $('#paymentCode').val('')
                            $('#onlinePayMoney').html(item.amount)
                            if (item.code == '020') {
                                $("#onlinePayTitle").html('<img src="../../../Theme/images/tool013.png" /> 支付宝支付')
                            }
                            else if (item.code == '010') {
                                $("#onlinePayTitle").html('<img src="../../../Theme/images/tool012.png" /> 微信支付')
                            }
                            else {
                                $("#onlinePayTitle").html('未知支付方式')
                            }
                        },
                        yes: function (index, layero) {
                            if ($('#paymentCode').val() == '') {
                                $.luck.error('请输入付款码')
                                return false
                            }
                            else {
                                var payCode = $('#paymentCode').val()
                                oPayCompose.payPostData(pwd).then(function(postData){                                    
                                    //在线支付
                                    onlinePay(item.amount, item.code, payCode, user.token).then(
                                        function(res){
                                            if(res.status==1){    
                                                item.PayContent = res.out_trade_no  
                                                //支付
                                                postPay(pwd,postUrl,printMode,user.token)   
                                            }
                                            else if(res.status ==3){
                                               // setTimeout(queryPay(outTradeNo,payType,token), 2000)
                                            }
                                            else{
                                                layer.alert(res.return_msg, { icon: 1, closeBtn: 0 }, function (index2) {
                                                    layer.close(index2)                                                  
                                                });
                                            }

                                    })
                                })
                            }
                        },
                        btn2: function (index, layero) {
                            layer.close(index);
                            return false;
                        }
                    })
                }
                else {
                    postPay(pwd,postUrl,printMode,user.token)      
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
                if (val.length != undefined) {
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
        //初始化员工提成
		initStaffList:function(){
			let that = this
		
			//员工分类
			let p1 = new Promise(function(resolve, reject){						
				$.http.post(LuckVipsoft.api.getStaffClassList, {}, user.token, function (res) {
					if (res.status == 1) {										
						resolve(res.data)
					}
				});
			})
			p1.then(function(res){
				that.StaffClassList = res;
				//提成员工 StaffType必填0-售卡提成1-快速消费提成2-商品消费提成3-充值充次提成
				$.http.post(LuckVipsoft.api.getStaffList, { StaffType: 1, StaffName: "" }, user.token, function (res) {
					if (res.status == 1) {
						that.StaffList.QuickConsume = res.data;					
					}
				});
				$.http.post(LuckVipsoft.api.getStaffList, { StaffType: 2, StaffName: "" }, user.token, function (res) {
					if (res.status == 1) {
						that.StaffList.GoodsConsume  = res.data;					
					}
				});
				$.http.post(LuckVipsoft.api.getStaffList, { StaffType: 3, StaffName: "" }, user.token, function (res) {
					if (res.status == 1) {
						that.StaffList.RechargeCount = res.data;					
					}
				});			
			})

			pay.chooseMembergetCommission()
			return true
		},
        //选中员工树形列表根据收银类型初始化员工
		StaffTree:function(mode){
			var _this = this;
			var html = '';
			let staffList = []

			switch(mode)
			{
				case 1:
					staffList = _this.StaffList.QuickConsume
				break;
				case 2:
					staffList = _this.StaffList.GoodsConsume
				break;
				case 3:
					staffList = _this.StaffList.RechargeCount
				break;
				default:
					staffList = _this.StaffList.GoodsConsume
				break;
			}

			if (_this.StaffClassList.length > 0) {
                $.each(_this.StaffClassList, function (index, item) {
                    html += '<div class="layui-collapse">'
                    html += '<div class="layui-colla-item">'
                    html += '<h2 class="layui-colla-title">' + item.ClassName + '</h2>'
                    html += '<div class="layui-colla-content layui-show"><ul class="staff-list">'
                    if (staffList.length > 0) {
                        $.each(staffList, function (n, items) {
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
		},
		//选择提成员工
		chooseMembergetCommission: function () {
            var _this = this;
			var html = '';
			let chooseStaff =[]
            //员工树形列表 ->StaffTree
          
            $('.lomo-xztcyg .lomo-xztcyg-left').html(html);
            //已选择员工列表
            tab_staff = table.render({
                elem: '#StaffList',
               	//data: _this.choosedStaffAry,
                cellMinWidth: 95,
                cols: [
                    [
						{ field: 'StaffName', title: '姓名', align: 'center' },
                        { field: 'CommissionMoney', title: '自定义提成金额', edit: 'text', align: 'center',event: "money" },
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
                        $.each(_this.chooseStaff, function (index, item) {
                            if (item.StaffId == obj.data.StaffId) {
                                _this.chooseStaff.splice(index, 1)
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
                $.each(_this.chooseStaff, function (index, item) {
                    if (item.StaffId == obj.data.StaffId) {
                        _this.chooseStaff.splice(index, 1, obj.data)
                        return
                    }
                })
			});
			//整单提成
			$("body").on("click", ".choose-order-member", function () {		
				_this.StaffTree(oPayCompose.result.staffMode)
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
						chooseStaff  = Object.assign([],_this.choosedStaffAry)
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
                    "CommissionMoney": '',
                    "Remark": '',
                }
                $(this).toggleClass("active");
                if ($(this).attr("class").indexOf("active") >= 0) {
					chooseStaff.push(newData);
                } else {
                    $.each(chooseStaff, function (index, item) {
                        if (item.StaffId == id) {
							chooseStaff.splice(index, 1)
                            return false
                        }
                    })
                }
                tab_staff.reload({
                    data:chooseStaff
                });
            })
        },
    }
    pay.init()
    });
//退出登录
$('.tool-close').on('click', function () {
    layer.open({
            type: 1,
                title: '提示',
                closeBtn: 1,
                shadeClose: false,
                shade: 0.2,
                btnAlign: "c",
                area: ['380px', '200px'],
                maxmin: false,
                //禁用最大化，最小化按钮
                resize: false,
        //禁用调整大小
                move: false,
        //禁止拖拽
                btn: ['关闭系统', '退出登录'],
                skin: "lomo-ordinary",
                content: '<div  class="lomo-signOut"><span >请选择退出登录或关闭系统</span></div>',
                yes: function yes(index) {
                    layer.close(index);
                    if (Command_Close) {
                        Command_Close();
            }
                    },
                btn2: function btn2(index) {
                    $.session.clear();
            $.local.clear();
                    window.location.href = "../../Views/Account/login.html";
                    return false;
        }
                });
            });

        //获取路线
function getNetWorks() {
    $.getJSON("https://download.nakevip.com/NewNake/network.json", function (data) {
        netWork = data;
        setNetWork(data);
    });
    }

            //绑定路线
function setNetWork(data) {
    $("#networklist").html('');
    var html = '<tr><th>线路地址</th><th>响应时间</th><th>响应速度</th><th>操作</th></tr>';
    $.each(data, function (index, item) {
        html += ' <tr>'
        html += '<td>' + item.NetworkName + '</td>'
        html += ' <td>' + (item.ResponseTime ? item.ResponseTime : "-") + '</td>'
        html += ' <td>' + (item.ResponseSpeed ? item.ResponseSpeed : "-") + '</td>'
        if (LuckVipsoft.network.NetworkName == item.NetworkName) {
            html += '<td><span>当前线路</span></td>';
            }
        else {
            html += ' <td onclick="chooseNetWork(\'' + item.NetworkName + '\')">进入该线路</td>'
            }
        html += ' </tr>'
    });
    $("#networklist").html(html);

    }

//选择线路
function chooseNetWork(networkName) {
    $.each(netWork, function (index, item) {
        if (item.NetworkName == networkName) {
            LuckVipsoft.network = item;
            LuckVipsoft.http = item.API;
            }
        });
    setNetWork(netWork);
    }
//获取响应信息
function getNetWorkResponse(network) {
    var rTime = 0;
    var sendDate = (new Date()).getTime();
    var LoginMsg = $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null;
    var compCode = LoginMsg != null ? LoginMsg.CompCode : "lucksoft";
    var param = {
        CompCode: compCode
    }
    $.ajax({
    dataType: "json",
        ContentType: 'application/json',
            type: "POST",
            data: JSON.stringify(param),
            url: network.API + "/api/GeneralInterface/GetAuthorizeByCompCode",
            async: false,
            success: function (res) {
                var receiveDate = (new Date()).getTime();
                rTime = receiveDate - sendDate;
                }
                });
    return rTime;
}
    //获取响应速度
function getResponseSpeed(time) {
    if (time > 0 && time <= 50) {
        return "很快";
    }
    else if (time > 50 && time <= 100) {
        return "快";
    }
    else if (time > 100 && time <= 200) {
        return "普通";
    }
    else if (time > 200 && time <= 500) {
        return "慢";
    }
    else {
        return "很慢";
    }
    }

function banBackSpace(e) {
    var ev = e || window.event; //获取event对象     

    var obj = ev.target || ev.srcElement; //获取事件源     

    var t = obj.type || obj.getAttribute('type'); //获取事件源类型    
    //获取作为判断条件的事件类型  

    var vReadOnly = obj.getAttribute('readonly');
    var vEnabled = obj.getAttribute('enabled'); //处理null值情况  

    vReadOnly = vReadOnly == null ? false : vReadOnly;
    vEnabled = vEnabled == null ? true : vEnabled; //当敲Backspace键时，事件源类型为密码或单行、多行文本的，  
    //并且readonly属性为true或enabled属性为false的，则退格键失效  

    var flag1 = ev.keyCode == 8 && (t == "password" || t == "text" || t == "textarea") && (vReadOnly == true || vReadOnly == "readonly" || vEnabled != true) ? true : false; //当敲Backspace键时，事件源类型非密码或单行、多行文本的，则退格键失效  

    var flag2 = ev.keyCode == 8 && t != "password" && t != "text" && t != "textarea" ? true : false; //判断  

    if (flag2) {
        return false;
        }

        if (flag1) {
        return false;
        }
        } //禁止后退键 作用于Firefox、Opera  
document.onkeypress = banBackSpace; //禁止后退键  作用于IE、Chrome  

document.onkeydown = banBackSpace;


//支付相关参数计算完成函数回调
oPayCompose.finishCallback = function () {
    console.log("支付相关参数计算完成函数回调")
    console.log('oPayCompose.result', oPayCompose.result)
    let amountDiscountMoney = parseFloat(oPayCompose.result.amountDiscountMoney)
    let amountActivityMoney = parseFloat(oPayCompose.result.amountActivityMoney)
    let amountModifyMoney = parseFloat(oPayCompose.result.amountModifyMoney)
    let allPayMoney = parseFloat(oPayCompose.result.allPayMoney)
    let zeroAmount = parseFloat(oPayCompose.result.zeroAmount)

    let paid = math.chain(amountDiscountMoney).subtract(amountActivityMoney).subtract(amountModifyMoney).subtract(zeroAmount).subtract(allPayMoney).done().toFixed(2)
    //01.payInfoTmp 渲染
    dataResult = {
        isZero: oPayCompose.result.isZeroAmount,
        isOpenZero: oPayCompose.config.IsAllowModifyOrderTotal,
        amount: amountDiscountMoney.toFixed(2),	//应收
        paid: paid >= 0 ? paid : 0.00,			//待收
        discount: math.chain(amountActivityMoney).add(amountModifyMoney).add(zeroAmount).done().toFixed(2),				   //优惠
        payItem: oPayCompose.payItem,				   //支付列表
        curPayItem: oPayCompose.curPayItem				   //当前选中支付方式
    }
    let html = template('payInfoTmp', dataResult);
    $('#cashier-num').html(html)

    $('.pay_item').removeClass('border-red')

    $.each(oPayCompose.payItem, function (index, item) {
        $('#pay_item_' + item.code).addClass('border-red')
    })

    if (oPayCompose.curPayItem != 999) {
        let oInput = $("#pay_input_" + oPayCompose.curPayItem)
        let value = oInput.val()
        oInput.val('').focus().val(value)
    }
}

function callPay (chooseMember, result) {
    //console.log('123', chooseMember, result, staffMode)
    let mdata = {}
    $('.pay_item').removeClass('border-red')
    //会员信息
    if (chooseMember.Id == undefined) {
        mdata.mid = 0
    }
    else {
        //会员信息
        mdata.mid = chooseMember.Id
        mdata.cardname = chooseMember.CardName
        mdata.mobile = chooseMember.Mobile
        mdata.levelname = chooseMember.LevelName
        mdata.point = chooseMember.Point
        mdata.money = chooseMember.Money
        if (chooseMember.Avatar == '' || chooseMember.Avatar == undefined) {
            mdata.avatar = '../../../Theme/images/morentouxiang.svg'
        }
        else {
            let = information = $.session.get("Cashier_User")
            mdata.avatar = information.ImageServerPath + chooseMember.Avatar
        }
    }

    let html = template('memberTmp', mdata);
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
        success: function (layero, index) {           
            //result.staffMode = staffMode   //员工提成方式      
            chooseMember = Object.assign({},chooseMember)
            result = Object.assign({},result)
            oPayCompose.initShoppingData(chooseMember, result,function(){
                oPayCompose.finishCallback()
            })
        },
        yes: function (index, layero) {
        },
        cancel: function () {
        }
    })
} 


//在线支付请求
function onlinePay(amount, code, payCode, token) {
    var loadingIndex = layer.load(2, {
        shade: [0.5, 'gray'],
        content: '支付中，请等待...',
        success: function (layero) {
            layero.find('.layui-layer-content').css({
                'padding-top': '39px',
                'width': '60px'
            });
        }
    });

    return new Promise(function (resolve, reject) {
        let result = { status: 0 }
        if (token != null) {
            $.http.post(LuckVipsoft.api.ComboBarcodePay, { PayMoney: amount, AuthNo: payCode }, token, function (res) {
                console.log('LuckVipsoft.api.ComboBarcodePay', res)
                if (res.status == 1) {
                    /// return_code：响应码(01成功 ，02失败)
                    /// return_msg：返回信息提示
                    /// result_code：业务结果：“01”成功 ，02”失败 ，“03”支付中，如果为“03”则需要调用查询接口查询支付状态                
                    if (res.data.return_code == '01') {
                        switch (res.data.result_code) {
                            case '01':
                                result = {
                                    status: 1,
                                    out_trade_no: res.data.out_trade_no,
                                    return_msg: res.data.return_msg
                                }
                                break;
                            case '02':
                                result = {
                                    status: 0,
                                    out_trade_no: res.data.out_trade_no,
                                    return_msg: res.data.return_msg
                                }
                                break
                            case '03':
                                result = {
                                    status: 3,
                                    out_trade_no: res.data.out_trade_no,
                                    return_msg: res.data.return_msg
                                }
                                //setTimeout(queryPay( res.data.out_trade_no,code,token), 1500);                          
                                break;
                        }
                    }
                    else {
                        result = {
                            status: 0,
                            out_trade_no: res.data.out_trade_no,
                            return_msg: res.data.return_msg
                        }

                    }
                }
                else {
                    result = {
                        status: 0,
                        out_trade_no: res.data.out_trade_no,
                        return_msg: res.data.return_msg
                    }
                }
                resolve(result)
            })
        }
    });
}


function queryPay(outTradeNo, payType, token) {
    if (token != null) {
        $.http.post(LuckVipsoft.api.QueryPay, { OutTradeNo: outTradeNo, PayType: payType }, token, function (res) {
            console.log('LuckVipsoft.api.QueryPay', res)
            /// return_code：响应码(01成功 ，02失败)
            /// return_msg：返回信息提示
            /// result_code：业务结果：“01”成功 ，02”失败 ，“03”支付中，如果为“03”则需要调用查询接口查询支付状态
            /// pay_type：请求类型(010微信，020 支付宝)
            /// out_trade_no：系统流水号，用于查询支付结果，支付信息PayContent要保存此值用于退款
            if (res.status == 1) {
                if (res.data.return_code == '01') {
                    switch (res.data.result_code) {
                        case '01':
                            // return {
                            //     status: 1,
                            //     out_trade_no: res.data.out_trade_no,
                            //     return_msg: res.data.return_msg
                            // }
                      
                            break ;
                        case '02':
                            //执行退款
                            break;
                        case '03':
                            setTimeout(queryPay(outTradeNo, payType, token),3000)
                            break;
                    }
                }
                else {
                      //支付失败          
                }
            }
            else {
                //支付失败
            }
        })
    }
}

function postPay(pwd,postUrl,printMode,token){
    oPayCompose.payPostData(pwd).then(function(res){
        console.log( 'oPayCompose.payPostData',res)
        $.http.post(postUrl, res, token, function (res) {
            if (res.status == 1) {
                //打印小票
                if(typeof(TicketPrintt)=="function"){ 
                    console.log('执行打印函数',printMode)
                    TicketPrint(JSON.stringify(res.data), printMode);
                }
                layer.alert('支付完成', { icon: 1, closeBtn: 0 }, function (index) {
                    layer.closeAll()
                    $("#childframe")[0].contentWindow.pageMethod.resetPage(); 
                });
            }
            else {
                layer.alert(res.msg, { icon: 2, closeBtn: 0 }, function (index) {
                    layer.close(index)
                });
            }
        })
    })  
}