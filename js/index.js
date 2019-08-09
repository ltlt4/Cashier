var netWork = new Array();
layui.use(['layer', 'jquery', 'form', 'table'], function () {
    var $ = layui.jquery,
        layer = layui.layer,
        form = layui.form,
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
    $(".tool-service").hover(function () {
        $(".Customer-center").animate({ top: '48px' },200).show()
    }, function () {
        $(".Customer-center").animate({ top: '76px' },200).hide()
    });
    $(".lomo-topTool li .lomo-eject").on("click", function () {
        var index = $(this).index('.lomo-topTool li .lomo-eject');
        $(this).blur();

        switch (index) {
            case 0:
                $.http.post(LuckVipsoft.api.GetMasterInfo, {}, user.token, function (res) {
                    if (res.status == 1) {
                        layer.open({
                            type: 1,
                            title: '客服中心',
                            closeBtn: 1,
                            shadeClose: false,
                            shade: 0.3,
                            area: ['280px', '374px'],
                            maxmin: false,
                            //禁用最大化，最小化按钮
                            resize: false,
                            //禁用调整大小
                            move: false,
                            //禁止拖拽
                            skin: "lomo-ordinary",
                            content: `<div class="Customer-center"><ul>
                                <li class="phone">${res.data.HotLine}</li>
                                <li class="qq">${res.data.CustomerQQ}</li>
                                <li class="wx"><img src="${user.information.ImageServerPath}${res.data.QrCode}" /></li>
                                <li>扫一扫加我微信号</li>
                            </ul>
                        </div>`
                        });
                    }
                });
                break;

            case 1:
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
                break;
        }
    });
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
                var html = "<div class=\"lomo-network-change\"><dl class=\"network-change-form\"><div class=\"change-form-address\"><img src=\"../../Theme/images/guard002.svg\" alt=\"\">\n                <span>".concat($.session.get('Cashier_User').ShopName, "</span>\n                </div><div class=\"change-form-person\"><img src=\"../../Theme/images/guard001.svg\" alt=\"\">\n                <span>").concat($.session.get('Cashier_User').MasterName, "</span>\n               </div><div class=\"change-form-time\"><img src=\"../../Theme/images/guard003.svg\" alt=\"\">\n<span>").concat(cashier.dateFormat(res.data.data.StatisticalTime), "-").concat(cashier.curentTime(new Date()), "</span>\n</div><div class=\"change-form-number\"><img src=\"../../Theme/images/guard005.svg\" alt=\"\">\n               <span>\u65B0\u589E\u4F1A\u5458\u4EBA\u6570\uFF1A</span><span class=\"change-form-span\">").concat(res.data.data.OpenCardNum, "</span>\n                 </div><div class=\"change-form-price\"><img src=\"../../Theme/images/guard004.svg\" alt=\"\">\n<span>\u552E\u5361\u91D1\u989D\uFF1A</span><span class=\"change-form-span\">").concat(res.data.data.SaleCardAmount, "</span></div></dl>\n                <div class=\"network-change-list\"><ul>\n                <li>\n                <div>\n                <div class=\"change-list-left\" style=\"background: #FFC542;\"></div>\n               <div class=\"change-list-right\">\n                 <div class=\"change-list-right-up\">\n                <span>\u5145\u503C\u603B\u989D\uFF1A</span><span class=\"change-form-span\">\uFFE5").concat(res.data.data.TopUpTotalAmount, "</span>\n               </div>\n                <div class=\"change-list-right-down\">\n                 ").concat(revenue(res.data.data.RechargeCountDetail), "\n                </div></div></div></li>\n               <li>\n                <div>\n                <div class=\"change-list-left\" style=\"background: #A461D8;\"></div>\n                <div class=\"change-list-right\">\n                 <div class=\"change-list-right-up\">\n                <span>\u5145\u6B21\u603B\u989D\uFF1A</span><span class=\"change-form-span\">\uFFE5").concat(res.data.data.RechargeCountTotalAmount, "</span>\n                </div>\n                <div class=\"change-list-right-down\">\n               ").concat(revenue(res.data.data.RechargeCountPreferentialDetail), "\n               </div></div></div></li>\n                <li>\n               <div>\n                <div class=\"change-list-left\" style=\"background: #3BA2F2;\"></div>\n                <div class=\"change-list-right\">\n                <div class=\"change-list-right-up\">\n                <span>\u9000\u6B3E\u8D27\u603B\u989D\uFF1A</span><span class=\"change-form-span\">\uFFE5").concat(res.data.data.ReturnGoodsTotalAmount, "</span>\n                </div>\n                <div class=\"change-list-right-down\">\n                ").concat(revenue(res.data.data.ReturnGoodsDetail), "\n                </div></div></div></li>\n                <li>\n                <div>\n                <div class=\"change-list-left\" style=\"background: #41C060;\"></div>\n                <div class=\"change-list-right\">\n                 <div class=\"change-list-right-up\">\n                <span>\u6D88\u8D39\u603B\u989D\uFF1A</span><span class=\"change-form-span\">\uFFE5").concat(res.data.data.ConsumeTotalAmount, "</span>\n               </div>\n                <div class=\"change-list-right-down\">\n                ").concat(revenue(res.data.data.ConsumeDetail), "\n                </div></div></div></li>\n                <li>\n               <div>\n                <div class=\"change-list-left\" style=\"background: #FF7174;\"></div>\n                <div class=\"change-list-right\">\n                <div class=\"change-list-right-up\">\n                <span>\u7EFC\u5408\u603B\u6536\u5165\uFF1A</span><span class=\"change-form-span\">\uFFE5").concat(res.data.data.TotalInCome, "</span>\n                </div>\n               <div class=\"change-list-right-down\">\n                ").concat(revenue(res.data.data.TotalInComeDetail), "\n               </div></div></div></li>\n                </ul></div>\n                <div class=\"network-change-remark layui-form-item\"><label for=\"\">\u5907\u6CE8</label><input type=\"text\" name=\"remarks\" placeholder=\"\u8BF7\u8F93\u5165\u5907\u6CE8\"></div>\n                <div class=\"network-change-Ticket layui-form-item\"><input  type=\"checkbox\" value=\"1\" name=\"printing\" lay-skin=\"primary\" title=\"\u6253\u5370\u4EA4\u73ED\u5C0F\u7968\" /><span></span></div>\n                </div>");
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
    var LoginMsg = $.session.get("LoginMsg") ? $.session.get("LoginMsg") : null;
    var param = { CompCode: LoginMsg.CompCode }, InterfaceKey = '';
    $.http.register(LuckVipsoft.api.GetAuthorizeByCompCode, param, function (res) {
        if (res.status == 1) {
            InterfaceKey = res.data.InterfaceKey
        } else {
            console.log(res)
        }
    })
    $(".enterStage").on("click", function () {
        $.getJSON("https://download.nakevip.com/NewNake/network.json", function (data) {
            console.log(data)
            var params = {
                CompCode: LoginMsg.CompCode,
                Account: LoginMsg.MasterAccount,
                Password: LoginMsg.Password,
                InterfaceKey: InterfaceKey,
                Url: data[0].Address
            };
            GoToBackstage(JSON.stringify(params))
        })
    })
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

function GoToBackstage() {
    data = {
        userName: "",
        pwd: "",
        enterprise: "",
    };
};
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