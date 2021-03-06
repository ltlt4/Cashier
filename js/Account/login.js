var netWork = new Array();
var loginType = 1;//1收银端2后台
layui.use(['layer', 'jquery', "form"], function () {
    var layer = layui.layer, $ = layui.$, form = layui.form;
    initData();
    var user = {
        flag: $.local.get('flag') ? $.local.get('flag') : null, //自动登陆
        Record: $.local.get('Record') ? $.local.get('Record') : null,
        butTime: false,//是否禁用
        timer: null, //计时器名称
        phone: 0,
        enterprise2: 0,
    }
    //忘记密码
    $(".login-form-bt a").on("click", function () {
        $(this).blur()
        var html = ''
        html += '<div class="forget-password2 lomo-gd2 ">'
        html += '<div class="divTitle"><span class="close"><img src="../../Theme/images/icon010.png" alt=""></span>忘记密码</div>'
        html += '<dl class="gd-form" style="padding-top:10px;">'
        html += '<form>'
        html += '<dt style="margin-bottom:10px;">企业号</dt>'
        html += '<dd>'
        html += '<input  type="text" class="sph" placeholder="请输入企业号" id="enterprise2"  style="border:1px solid #ddd"/>'
        html += '</dd>'
        html += '<dt style="margin-bottom:10px;">手机号</dt>'
        html += '<dd>'
        html += '<input  type="text" class="sph" placeholder="请输入手机号"  style="border:1px solid #ddd" id="phone1"/>'
        html += '</dd>'
        html += ' <dt style="margin-bottom:10px;">验证码</dt>'
        html += '<dd style="display: flex;">'
        html += '<input  type="password" class="sph" placeholder="请输入验证码" style="width: 80%;border:1px solid #ddd" id="verCode" 验证码   />'
        html += ' <div class="forget-password-obtain" id="sendCode">获取</div>'
        html += '</dd>'
        html += '<dd class="gd-form-bt" style="margin-top:20px;">'
        html += '<button type="button" class="submit-bt-clear">取消</button>'
        html += ' <button type="submit" id="confirmVer" class="submit-bt">下一步</button>'
        html += ' </dd>'
        html += '</form>'
        html += '</dl>'
        html += '</div>'

        layer.open({
            type: 1,
            title: false,
            closeBtn: 0,
            shadeClose: false,
            shade: 0.3,
            skin: 'yourclass',
            area: ['560px', '440px'],
            maxmin: false,//禁用最大化，最小化按钮
            resize: false,//禁用调整大小
            content: html,
        })
    });
    $("body").on("click", ".close", function () {
        layer.closeAll()
    });
    $("body").on("click", " .submit-bt-clear", function () {
        layer.closeAll()
    });
    //是否启用记住密码，自动登陆
    // $(".login-form-other  label").on("click", function () {
    //     var i = $(this).attr('data-id')
    //     if (i == 1 && !$(this).prev().hasClass("choice")) {
    //         $(".login-form-other  label").eq(0).prev().addClass("choice")
    //     }
    //     $(this).prev().toggleClass("choice");
    // });

    form.on('checkbox(mind)', function (data) {
        if (data.elem.checked == false) {
            $('input[name="automatic"]').prop('checked', false);
        }
        form.render();
    });
    form.on('checkbox(automatic)', function (data) {
        if (data.elem.checked == true) {
            $('input[name="mind"]').prop('checked', true);
        }
        form.render();
    });
    //登陆 
    $("#login").on("click", function (e) {
        e.preventDefault()
        login()
    })
    if ($.local.get("Time") != undefined) {
        disButton()
    }
    //是否需要自动登录
    if (user.Record != null) {
        var base = new cashier.Base64();
        $('input[name="mind"]').prop('checked', true);
        $("#enterprise").val(base.decode(user.Record.a));
        $("#username").val(base.decode(user.Record.b));
        $("#pwd").val(base.decode(user.Record.c));
        if (user.flag != null) {
            $('input[name="automatic"]').prop('checked', true);
            if ($.session.get('signOut') != 'true') {
                $.session.remove('signOut')
                login();
            }
        }
        form.render();
    }
    //发送验证码
    $("body").on("click", "#sendCode", function () {
        if (!user.butTime) {
            var phone = $("#phone1").val()//手机号
            var enterprise2 = $("#enterprise2").val() //企业号

            if (enterprise2 == "") {
                layer.msg(LuckVipsoft.lan.ER0016);
                $('#enterprise2').focus();
                return false;
            }
            if (phone == "") {
                layer.msg(LuckVipsoft.lan.ER0014);
                $('#phone1').focus();
                return false;
            }
            if (!(/^[1][3,4,5,7,8][0-9]{9}$/.test(phone))) {
                layer.msg(LuckVipsoft.lan.ER0015);
                $('#phone1').focus();
                return false;
            }
            var param = {
                Mobile: phone,
                CompCode: enterprise2,
            }
            $("#sendCode").off('click')
            $.http.register(LuckVipsoft.api.retrievePasswordSendCode, param, function (res) {
                layer.msg(res.msg)
                if (res.status == 1) {
                    user.butTime = true
                    var time = new Date().getTime();
                    var date = new Date();
                    date.setTime(date.getTime() + (120 * 1000)); //设置过期时间为2分钟
                    $.local.set('Time', time, date);
                    disButton()
                }
            })
        } else {
            return false
        }

    })
    //确认验证码
    $("body").on("click", "#confirmVer", function (e) {
        e.preventDefault()
        var verCode = $("#verCode").val()
        var phone = $("#phone1").val()
        var enterprise2 = $("#enterprise2").val() //企业号
        if (!(/^[1][3,4,5,7,8][0-9]{9}$/.test(phone))) {
            layer.msg(LuckVipsoft.lan.ER0015);
            $('#phone1').focus();
            return false;
        }
        if (!/^\d{4}$/.test(verCode)) {
            layer.msg(LuckVipsoft.lan.ER0005);
            $('#verCode').focus();
            return false
        }
        var param = {
            Mobile: phone,
            Code: verCode
        }
        $.http.register(LuckVipsoft.api.CheckValidationCode, param, function (res) {
            layer.msg(res.msg)
            if (res.status == 1) {
                user.phone = phone;
                user.enterprise2 = enterprise2;
                layer.closeAll("page")
                layer.open({
                    type: 1,
                    title: false,
                    closeBtn: 0,
                    shadeClose: false,
                    shade: 0.3,
                    maxmin: false,//禁用最大化，最小化按钮
                    resize: false,//禁用调整大小
                    area: ['530px', '350px'],
                    content: $(".setting-password"),
                    success: function (layero, index) {

                    }
                })
            }
        })

    })
    //修改密码
    $("body").on("click", "#modifyPass", function (e) {
        e.preventDefault()
        var pwd1 = $("#editPass1").val()
        var pwd2 = $("#editPass2").val()
        var phone = user.phone
        if (pwd1 == "") {
            layer.msg(LuckVipsoft.lan.ER0003);
            $('#editPass1').focus();
            return false;
        }
        if (!verify.pwd[0].test(pwd1)) {
            $('#editPass1').focus();
            layer.msg(verify.pwd[1]);
        }
        if (pwd2 == "") {
            layer.msg(LuckVipsoft.lan.ER0003);
            $('#editPass2').focus();
            return false;
        }
        if (pwd2 != pwd1) {
            layer.msg(LuckVipsoft.lan.ER0017);
            return false;
        }
        var param = {
            Mobile: phone,
            Password: pwd1,
            CompCode: ""
        }
        $.http.register(LuckVipsoft.api.retrievePassword, param, function (res) {
            layer.msg(res.msg)
            if (res.status == 1) {
                layer.closeAll("page")
            }
        })
    })
    //按钮计时
    function disButton() {
        var time = $.local.get("Time")
        if (time != undefined) {
            time = parseInt(time)
            const TIME_COUNT = 60;
            var count = 0
            count = TIME_COUNT;
            user.butTime = true
            user.timer = setInterval(function () {
                var now = new Date().getTime()
                if ((now - time) < 60000) {
                    count = 60 - parseInt((now - time) / 1000)
                    var html = count + "s"
                    $("#sendCode").html(html).addClass("disbeal-button ")
                } else {
                    clearInterval(user.timer);
                    user.timer = null; //清除定时器
                    $.local.remove('Time');
                    user.butTime = false
                    $("#sendCode").html("获取").removeClass("disbeal-button")
                }
            }, 1000)
        }
    }
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
                else if (rTime > 0) {
                    html += ' <td onclick="chooseNetWork(\'' + item.NetworkName + '\')">进入该线路</td>'
                } else {
                    html += '<td><span>该线路不可用</span></td>';
                }
                html += ' </tr>'
            });
            $("#networklist").html(html);

        });
    });

    $("#logintype a").on("click", function () {
        $(this).addClass("hover").siblings().removeClass("hover");
        var n = $(this).index();
        if (n == 0) {
            loginType = 1;
        }
        else {
            loginType = 2;
        }
    });
})
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
            html += ' <td><span>-</span></td>'
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

function initData() {
    if (!LuckVipsoft.InterfaceKey) {
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
            url: LuckVipsoft.http + "/api/GeneralInterface/GetAuthorizeByCompCode",
            async: false,
            success: function (res) {
                LuckVipsoft.InterfaceKey = res.data.InterfaceKey;
            }
        });
    }
}

//进前前台
function doLogin() {
    loginType = 1;
    login();
}
//登录
function login() {
    var enterprise = $("#enterprise").val() //企业号
    var username = $("#username").val()//账号
    var pwd = $("#pwd").val() //密码
    //验证企业号
    if (enterprise == '') {
        layer.msg(LuckVipsoft.lan.ER0026);
        $('#enterprise').focus();
        return false;
    }
    //验证账号
    if (username == "") {
        layer.msg(LuckVipsoft.lan.ER0002);
        $("#username").focus();
        return false;

    }
    //验证密码
    if (pwd == '') {
        layer.msg(LuckVipsoft.lan.ER0003);
        $('#pwd').focus();
        return false;
    }
    var param = {
        CompCode: enterprise,
        MasterAccount: username,
        Password: pwd,
        LoginSource: 2
    }

    $.http.register(LuckVipsoft.api.login, param, function (res) {
        if (res.status == 1) {
            layer.msg(res.msg);
            if ($('input[name="mind"]').prop('checked')==true) {
                var base = new cashier.Base64();
                var Record = {
                    a: base.encode(enterprise),
                    b: base.encode(username),
                    c: base.encode(pwd)
                }
                $.local.set('Record', Record);
            }
            if ($('input[name="automatic"]').prop('checked')==true) {
                $.local.set('flag', true);
            }
            $.session.set('LoginMsg', param);
            $.session.set('Cashier_Token', res.data.Token)
            $.session.set('Cashier_User', res.data);
            if (loginType == 2) {
                param = {
                    CompCode: enterprise,
                    Account: username,
                    Password: pwd,
                    InterfaceKey: LuckVipsoft.InterfaceKey,
                    Url: LuckVipsoft.network.Address ? LuckVipsoft.network.Address : "http://192.168.0.13:84",
                };
                if (GoToBackstage) {
                    GoToBackstage(JSON.stringify(param));
                }
                return;
            }
            //数据初始化
            var MemberMethod = {
                start: function () {
                    var _this = this
                    Promise.all([_this.belongShop(), _this.staffClass(), _this.levelList(), _this.sysArgument()])
                        .then(function (res) {
                            window.location.href = "../../Views/home/index.html";
                        })
                },
                /*获取所属店铺信息*/
                belongShop: function () {
                    return new Promise(function (resolve, reject) {
                        $.http.post(LuckVipsoft.api.getShopList, {}, res.data.Token, function (res) {
                            if (res.status == 1) {
                                $.session.set('belongShop', res.data);
                                resolve(true);
                            }
                        });
                    });
                },
                /*获取员工分类数据*/
                staffClass: function () {
                    return new Promise(function (resolve, reject) {
                        $.http.post(LuckVipsoft.api.getStaffClassList, {}, res.data.Token, function (res) {
                            if (res.status == 1) {
                                $.session.set('staffClass', res.data);
                                resolve(true);
                            }
                        });
                    });
                },
                /*获取售卡提成员工*/
                staffInfCard: function () {
                    return new Promise(function (resolve, reject) {
                        var param = {
                            StaffType: 0,
                            StaffName: '',
                        }
                        $.http.post(LuckVipsoft.api.getStaffList, param, res.data.Token, function (res) {
                            if (res.status == 1) {
                                resolve(res.data);
                            }
                        });
                    });
                },
                /*快速消费提成*/
                staffInfConsump: function () {
                    return new Promise(function (resolve, reject) {
                        var param = {
                            StaffType: 1,
                            StaffName: '',
                        }
                        $.http.post(LuckVipsoft.api.getStaffList, param, res.data.Token, function (res) {
                            if (res.status == 1) {
                                resolve(res.data);
                            }
                        });
                    });
                },
                /*商品消费提成*/
                staffInfcommodity: function () {
                    return new Promise(function (resolve, reject) {
                        var param = {
                            StaffType: 2,
                            StaffName: '',
                        }
                        $.http.post(LuckVipsoft.api.getStaffList, param, res.data.Token, function (res) {
                            if (res.status == 1) {
                                resolve(res.data);
                            }
                        });
                    });
                },
                /*充值充次提成*/
                staffInfRecharge: function () {
                    return new Promise(function (resolve, reject) {
                        var param = {
                            StaffType: 3,
                            StaffName: '',
                        }
                        $.http.post(LuckVipsoft.api.getStaffList, param, res.data.Token, function (res) {
                            if (res.status == 1) {

                                resolve(res.data);
                            }
                        });
                    });
                },
                /*获取等级信息*/
                levelList: function () {
                    return new Promise(function (resolve, reject) {
                        $.http.post(LuckVipsoft.api.BindMemLevelList, {}, res.data.Token, function (res) {
                            if (res.status == 1) {
                                $.session.set('levelList', res.data);
                                resolve(true);
                            }
                        });
                    });
                },

                /*获取系统参数*/
                sysArgument: function () {
                    return new Promise(function (resolve, reject) {
                        $.http.post(LuckVipsoft.api.GetSysArgument, {}, res.data.Token, function (res) {
                            if (res.status == 1) {
                                $.session.set('sysArgument', res.data);
                                resolve(true);
                            }
                        });
                    });
                }
            };
            MemberMethod.start();

        } else {
            layer.msg(res.msg);
        }
    })
}