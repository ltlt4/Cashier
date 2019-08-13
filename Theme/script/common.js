var cashier = {
    open: function (element, animation1, animation2, mask) {
        $(element).removeClass(`animated ${animation2}`);
        $(element).addClass(`animated ${animation1}`);
        $(element).show()
        $(mask).show()
    },
    close: function (element, animation1, animation2, mask, mask2) {
        if (!mask2) {
            mask2 = null;
        }
        $(element).removeClass(`animated ${animation1}`);
        $(element).addClass(`animated ${animation2}`);
        setTimeout(function () {
            $(mask).hide()
            $(element).hide()
            $(mask2).show()
        }, 400);
    },
    throttle: function (fn, delay, mustRunDelay) {//函数节流 
        let timer = null;
        let t_start;
        return function () {
            let context = this, args = arguments, t_curr = +new Date();
            clearTimeout(timer);
            if (!t_start) {
                t_start = t_curr;
            }
            if (t_curr - t_start >= mustRunDelay) {
                fn.apply(context, args);
                t_start = t_curr;
            }
            else {
                timer = setTimeout(function () {
                    fn.apply(context, args);
                }, delay);
            }
        };
    },
    curentTime: function (now) { //获取当前日期
        let year = now.getFullYear();       //年
        let month = now.getMonth() + 1;     //月
        let day = now.getDate();            //日
        let hh = now.getHours();            //时
        let mm = now.getMinutes();          //分
        let ss = now.getSeconds();           //秒

        let clock = year + "-";
        if (month < 10)
            clock += "0";
        clock += month + "-";
        if (day < 10)
            clock += "0";
        clock += day + " ";
        if (hh < 10)
            clock += "0";
        clock += hh + ":";
        if (mm < 10) clock += '0';
        clock += mm + ":";
        if (ss < 10) clock += '0';
        clock += ss;
        return (clock);
    },
    Base64: function () {
        // 私钥
        _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        // 加密
        this.encode = function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            input = _utf8_encode(input);
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output +
                    _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
                    _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
            }
            return output;
        }
        // 解密
        this.decode = function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (i < input.length) {
                enc1 = _keyStr.indexOf(input.charAt(i++));
                enc2 = _keyStr.indexOf(input.charAt(i++));
                enc3 = _keyStr.indexOf(input.charAt(i++));
                enc4 = _keyStr.indexOf(input.charAt(i++));
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
                output = output + String.fromCharCode(chr1);
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
            }
            output = _utf8_decode(output);
            return output;
        }
        // private method for UTF-8 encoding
        _utf8_encode = function (string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";
            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                } else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                } else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
            }
            return utftext;
        }
        // private method for UTF-8 decoding
        _utf8_decode = function (utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;
            while (i < utftext.length) {
                c = utftext.charCodeAt(i);
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                } else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                } else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }
            return string;
        }
    },
    /* 长日期格式化 20130910155324->2013-09-10 15:53:24*/
    dateFormat: function (v) { if (v == null || v == undefined || v == '') return ''; var v = v.toString(); return v.substr(0, 4) + '-' + v.substr(4, 2) + '-' + v.substr(6, 2) + ' ' + v.substr(8, 2) + ':' + v.substr(10, 2) + ':' + v.substr(12); },
    /* 短日期格式化 20130910->2013-09-10*/
    ShortDateFormat: function (v) { if (v == null || v == undefined || v == '') return ''; var v = v.toString(); return v.substr(0, 4) + '-' + v.substr(4, 2) + '-' + v.substr(6, 2); },
    /* 长日期数字化 2013-09-10 15:53:24->20130910155324 */
    revDateFormat: function (v) { if (v == null || v == undefined || v == '') return ''; return v.toString().replace(/-/g, '').replace(/:/g, '').replace(/ /g, '') },
    /* 短日期数字化 2013-09-10->20130910*/
    revShortDateFormat: function (v) { if (v == null || v == undefined || v == '') return ''; return v.toString().replace(/-/g, ''); },
    unique: function (arr) { //去重
        if (!Array.isArray(arr)) {
            return
        }
        arr = arr.sort()
        var res = []
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] !== arr[i - 1]) {
                res.push(arr[i])
            }
        }
        return res
    },
    /** * 根据毫秒数转换为天时分秒  **/
    millisecondToTime: function (val) {
        var days = Math.floor(val / (24 * 3600 * 1000));    //计算出相差天数
        var leave1 = val % (24 * 3600 * 1000);              //计算天数后剩余的毫秒数
        var hours = Math.floor(leave1 / (3600 * 1000));     //计算出相差小时
        var leave2 = leave1 % (3600 * 1000);                //计算小时数后剩余的毫秒数
        var minutes = Math.floor(leave2 / (60 * 1000));     //计算相差分钟数
        var leave3 = leave2 % (60 * 1000);                  //计算分钟数后剩余的毫秒数
        var seconds = Math.round(leave3 / 1000);            //计算相差秒数

        var str = "";
        if (days > 0) str = days + '天';              //天
        if (hours > 0) str += hours + '时';           //时
        if (minutes > 0) str += minutes + '分';       //分
        if (seconds > 0) str += seconds + '秒';       //秒
        return str;
    },
    /************************************************************************************************************
    //金额小数精度
    0:保留两位小数
    1:保留整数 (四舍五入)
    2:保留整数 (舍弃小数)
    *************************************************************************************************************/
    MoneyPrecision: function (val) {
        val = val - 0;
        var sysArgument = $.session.get("sysArgument") ? $.session.get("sysArgument") : null;
        var t = 0;
        if (sysArgument != null) {
            t = sysArgument.MoneyPrecision;
        }
        if (t == 0) {
            return changeTwoDecimal_f(val);
        } else if (t == 1) {
            return Math.round(val);
        } else if (t == 2) {
            return parseInt(val);
        } else if (t == 3) {
            return changeOneDecimal_f(val);
        } else if (t == 4) {
            return changeThirdDecimal_f(val);
        }
        else return val;
    },
    staffInf: function (type, token, name = "") {
        var param = {
            StaffType: type,
            StaffName: name
        }
        return new Promise(function (resolve) {
            $.http.post(LuckVipsoft.api.getStaffList, param, token, function (res) {
                if (res.status == 1) {
                    resolve(res.data);
                }
            });
        })
    },
    //监控数字型
    clearNoNum: function(obj) {
         $(obj).val($(obj).val().substr(0,16));
         $(obj).val($(obj).val().replace(/[^\d.]/g, "")); //清除“数字”和“.”以外的字符   
         $(obj).val($(obj).val().replace(/^\./g, ""));  //验证第一个字符是数字而不是.
         $(obj).val($(obj).val().replace(/\.{2,}/g, ".")); //只保留第一个. 清除多余的   
         $(obj).val($(obj).val().replace(".", "$#$").replace(/\./g, "").replace("$#$", "."));
         $(obj).val($(obj).val().replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3')); //只能输入两个小数   
         if ($(obj).val().indexOf(".") < 0 && $(obj).val() != "") { //以上已经过滤，此处控制的是如果没有小数点，首位不能为类似于 01、02的金额  
             $(obj).val(parseFloat($(obj).val()));
         }
     }
}
$.luck = {
    confirm: function (title, func) {
        layer.confirm(title, {
            btn: ['确认', '取消'], title: ['提示'], icon: 0 //按钮
        }, function (res) {
            layer.closeAll('dialog');
            func(res);
        });
        return true;
    },
    success: function (callback) {
        if (typeof callback === "function") {
            layer.msg('操作成功', { time: 2000 }, function (res) {
                callback(res);
                layer.closeAll('dialog');
            });
        }
        else {
            layer.msg('操作成功', { time: 2000 });
        }
        return true;
    },
    error: function (msg, callback) {
        if (typeof callback === "function") {
            layer.msg(msg, { time: 2000 }, function (res) {
                callback(res);
                layer.closeAll('dialog');
            });
        }
        else {
            layer.msg(msg, { time: 2000 });
        }
        return true;
    },

    password: function (callback) {
        layer.open({
            type: '1',
            title: "确认密码",
            btn: ['确认', '取消'],
            area: ['350px', '200px'],
            skin: "lomo-ordinary inherit",
            content: `<dl class="card-num-form" style="float:none;">
                        <dd style="float:none;width:80%;margin:20px auto 0;">
                            <input id="password" style="width:230px;" type="password" placeholder="请输入密码" class="input">
                            <a href="javascript:void(0);" class="card-num-up" onclick="luckKeyboard.showSmallkeyboard(this)"></a>
                        </dd>
                    </dl>`,
            yes: function (res) {
                let val = $("#password").val();
                callback(res, val)
            }
        })
    }
}
$.http = {
    // 统一前端特殊码处理
    filter: function (res) {
        if (res.status == 0) {
            switch (res.code) {
                case 10000:

                    break;
                case 10001:

                    break;
                default:
                    layer.msg(res.msg)
                    break;
            }
            return false;
        }
        return true;
    },
    post: function (url, param, token, callback) {
        url = LuckVipsoft.http + url;
        $.ajax({
            type: "POST",
            contentType: "application/json",
            beforeSend: function (xrh) {
                layer.load(1, { shade: [0.2, '#fff'] });
                xrh.setRequestHeader("luck_api_token", token);
            },
            data: JSON.stringify(param),
            url: url,
            dataType: "json",
            success: function (res) {
                if (typeof callback === "function") {
                    callback(res)
                }
            },
            complete: function () {
                layer.closeAll('loading')
            },
            error: function (e) {
                layer.closeAll('loading')
                layer.msg('请求连接错误', { icon: 0 });
            }
        });
    },
    post2: function (url, param, token, callback) {
        url = LuckVipsoft.http + url;
        $.ajax({
            type: "POST",
            contentType: "application/json",
            beforeSend: function (xrh) {            
                xrh.setRequestHeader("luck_api_token", token);
            },
            data: JSON.stringify(param),
            url: url,
            dataType: "json",
            success: function (res) {
                if (typeof callback === "function") {
                    callback(res)
                }
            },         
            error: function (e) {
           
                layer.msg('请求连接错误', { icon: 0 });
            }
        });
    },
    register: function (url, param, callback) {
        url = LuckVipsoft.http + url
        param = JSON.stringify(param);
        $.ajax({
            dataType: "json",
            ContentType: 'application/json',
            type: "POST",
            data: param,
            url: url,
            success: function (res) {
                if (typeof callback === "function") {
                    callback(res)
                }
            },
            beforeSend: function () {
                layer.load(1, { shade: [0.2, '#fff'] })
            },
            complete: function () {
                layer.closeAll('loading')
            },
            error: function (e) {
                layer.closeAll('loading')
                layer.msg('请求连接错误', { icon: 0 });
            }
        });
    }
}
$.session = {
    get: function (key) {
        var data = sessionStorage[key];
        if (!data || data === "null") {
            return null;
        }
        return JSON.parse(data).value;
    },
    set: function (key, value) {
        var data = {
            value: value
        }
        sessionStorage[key] = JSON.stringify(data);
    },
    // 删除
    remove(key) {
        sessionStorage.removeItem(key);
    },
    // 清除全部
    clear() {
        sessionStorage.clear();
    }
}
$.local = {
    //存储,可设置过期时间
    set(key, value, expires) {
        var params = { key, value, expires };
        if (expires) {
            // 记录何时将值存入缓存，毫秒级
            var data = Object.assign(params, { startTime: new Date().getTime() });
            localStorage.setItem(key, JSON.stringify(data));
        } else {
            if (Object.prototype.toString.call(value) == '[object Object]') {
                value = JSON.stringify(value);
            }
            if (Object.prototype.toString.call(value) == '[object Array]') {
                value = JSON.stringify(value);
            }
            localStorage.setItem(key, value);
        }
    },
    //取出
    get(key) {
        let item = localStorage.getItem(key);
        // 先将拿到的试着进行json转为对象的形式
        try {
            item = JSON.parse(item);
        } catch (error) {
            // eslint-disable-next-line no-self-assign
            item = item;
        }
        // 如果有startTime的值，说明设置了失效时间
        if (item && item.startTime) {
            let date = new Date().getTime();
            // 如果大于就是过期了，如果小于或等于就还没过期
            if (date - item.startTime > item.expires) {
                localStorage.removeItem(name);
                return false;
            } else {
                return item.value;
            }
        } else {
            return item;
        }
    },
    // 删除
    remove(key) {
        localStorage.removeItem(key);
    },
    // 清除全部
    clear() {
        localStorage.clear();
    }
}
var http = {}
http.redirect = function (url) {
    window.location.href = url;
}
http.cashierEnd = {
    //设置会员信息
    seleMembers: function (data, imgurl, ele) {
        var html = ''
        if (!data.Avatar) {
            html += '<dt><img src="../../../Theme/images/touxiang.png" /></dt>';
        } else {
            html += '<dt><img src="' + imgurl + data.Avatar + '" /></dt>';
        }
        html += '<dd><b>' + data.CardName + '</b><i>(' + data.Mobile + ')</i><span>' + data.LevelName + '</span></dd>';
        html += '<dd><small>积分: ' + data.Point + '</small><small>余额：￥ ' + data.Money + '</small></dd>';
        html += '<div class="vip-delete"><img src="../../../Theme/images/del.png" alt=""></div>';
        $(ele).html(html)
    },
    //充次设置会员信息
    RechargeSetMembers: function (data, imgurl, ele) {
        var html = ''
        if (!data.Avatar) {
            html += '<dt><img src="../../../Theme/images/touxiang.png" /></dt>';
        } else {
            html += '<dt><img src="' + imgurl + data.Avatar + '" /></dt>';
        }
        html += '<dd><b>' + data.CardName + '</b><i>(' + data.Mobile + ')</i><span>' + data.LevelName + '</span></dd>';
        html += '<dd><small>积分: ' + data.Point + '</small><small>余额：￥ ' + data.Money + '</small></dd>';
        html += '<div class="vip-delete"><img src="../../../Theme/images/del.png" alt=""></div>';
        html += '<dd class="lomo-recharge" style="height: auto;"><button id="rechargeCard">储蓄卡充值</button></dd>'
        $(ele).html(html)
    },
    //清除会员信息
    delMembers: function (ele, value) {
        var html = ''
        html += '<dt><img src="../../../Theme/images/touxiang.png" /></dt>';
        html += '<dd><b></b><i></i><span class="hide"></span></dd>';
        html += '<dd><small>积分: 0</small><small>余额：0</small></dd>';
        html += '<div class="vip-delete"><img src="../../../Theme/images/del.png" alt=""></div>';
        $(ele).html(html)
        $.session.remove(value)
    }
}

function changeTwoDecimal_f(x) {
    var f_x = parseFloat(x);
    if (isNaN(f_x)) {
        alert('function:changeTwoDecimal->parameter error');
        return false;
    }
    f_x = Math.round(f_x * 100) / 100;
    var s_x = f_x.toString();
    var pos_decimal = s_x.indexOf('.');
    if (pos_decimal < 0) {
        pos_decimal = s_x.length;
        s_x += '.';
    }
    while (s_x.length <= pos_decimal + 2) {
        s_x += '0';
    }
    return s_x;
}

function changeOneDecimal_f(x) {
    var f_x = parseFloat(x);
    if (isNaN(f_x)) {
        alert('function:changeOneDecimal_f->parameter error');
        return false;
    }
    f_x = Math.round(f_x * 10) / 10;
    var s_x = f_x.toString();
    var pos_decimal = s_x.indexOf('.');
    if (pos_decimal < 0) {
        pos_decimal = s_x.length;
        s_x += '.';
    }
    while (s_x.length <= pos_decimal + 1) {
        s_x += '0';
    }
    return s_x;
}

function changeThirdDecimal_f(x) {
    var f_x = parseFloat(x);
    if (isNaN(f_x)) {
        alert('function:changeTwoDecimal->parameter error');
        return false;
    }
    f_x = Math.round(f_x * 1000) / 1000;
    var s_x = f_x.toString();
    var pos_decimal = s_x.indexOf('.');
    if (pos_decimal < 0) {
        pos_decimal = s_x.length;
        s_x += '.';
    }
    while (s_x.length <= pos_decimal + 3) {
        s_x += '0';
    }
    return s_x;
}


//刷卡传回会员卡号
function getMemberCardMsg(cardMsg) {
    childframe.window.getIccardNumber(cardMsg);
}
//F2操作-定位刷卡
function shortcutKeysF2() {
    var curIframe = $("iframe"),
        curIframeCt = curIframe.contents();
    curIframeCt.find("#barCode").focus();
}
//F3操作-定位商品筛选
function shortcutKeysF3() {
    var curIframe = $("iframe"),
        curIframeCt = curIframe.contents();
    curIframeCt.find("#searchVal").focus();
}
//F5操作-相关操作（结算、保存等)
function shortcutKeysF5() {
    var curIframe = $("iframe"),
        curIframeCt = curIframe.contents();


}
//客显金额
function guestShowMoney() {
    var guestShowState = $.session.get('IsDisplayCom');
    if (guestShowState == 1) {
        childframe.window.backGuestShowMoney();
    }
}

function accAdd(arg1, arg2) {//加
    var r1, r2, m, c;
    if (arg1 == null || arg1 == "") {
        arg1 = 0;
    }
    if (arg2 == null || arg2 == "") {
        arg2 = 0;
    }
    try {
        r1 = arg1.toString().split(".")[1].length;
    }
    catch (e) {
        r1 = 0;
    }
    try {
        r2 = arg2.toString().split(".")[1].length;
    }
    catch (e) {
        r2 = 0;
    }
    c = Math.abs(r1 - r2);
    m = Math.pow(10, Math.max(r1, r2));
    if (c > 0) {
        var cm = Math.pow(10, c);
        if (r1 > r2) {
            arg1 = Number(arg1.toString().replace(".", ""));
            arg2 = Number(arg2.toString().replace(".", "")) * cm;
        } else {
            arg1 = Number(arg1.toString().replace(".", "")) * cm;
            arg2 = Number(arg2.toString().replace(".", ""));
        }
    } else {
        arg1 = Number(arg1.toString().replace(".", ""));
        arg2 = Number(arg2.toString().replace(".", ""));
    }
    return (arg1 + arg2) / m;
}
function accSub(arg1, arg2) {//减
    return accAdd(arg1, accMul(arg2, -1));
}
function accMul(arg1, arg2) {//乘
    var m = 0, s1 = arg1.toString(), s2 = arg2.toString();
    try { m += s1.split(".")[1].length } catch (e) { }
    try { m += s2.split(".")[1].length } catch (e) { }
    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
}
function accDiv(arg1, arg2) {//除
    var t1 = 0, t2 = 0, r1, r2;
    try { t1 = arg1.toString().split(".")[1].length } catch (e) { }
    try { t2 = arg2.toString().split(".")[1].length } catch (e) { }
    with (Math) {
        r1 = Number(arg1.toString().replace(".", ""));
        r2 = Number(arg2.toString().replace(".", ""));
        return (r1 / r2) * pow(10, t2 - t1);
    }
}

//js获取页面参数
function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
}

//四舍五入丢精度问题 ->数字金额格式
Number.prototype.toFixed = function (d) {
    var s = this + "";
    if (!d) d = 0;
    if (s.indexOf(".") == -1) s += ".";
    s += new Array(d + 1).join("0");
    if (new RegExp("^(-|\\+)?(\\d+(\\.\\d{0," + (d + 1) + "})?)\\d*$").test(s)) {
        var s = "0" + RegExp.$2, pm = RegExp.$1, a = RegExp.$3.length, b = true;
        if (a == d + 2) {
            a = s.match(/\d/g);
            if (parseInt(a[a.length - 1]) > 4) {
                for (var i = a.length - 2; i >= 0; i--) {
                    a[i] = parseInt(a[i]) + 1;
                    if (a[i] == 10) {
                        a[i] = 0;
                        b = i != 1;
                    } else break;
                }
            }
            s = a.join("").replace(new RegExp("(\\d+)(\\d{" + d + "})\\d$"), "$1.$2");

        } if (b) s = s.substr(1);
        return (pm + s).replace(/\.$/, "");
    } return this + "";

}
//字符出现次数
function patch(re,s){
    re=eval("/"+re+"/ig")
    return s.match(re).length;
}


Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
function uuid()
{
    return new Date().Format("yyyyMMddhhmmssS", new Date()) + Math.random().toString(36).substr(2);
}


//加法   
Number.prototype.add = function(arg){   
    var r1,r2,m;   
    try{r1=this.toString().split(".")[1].length}catch(e){r1=0}   
    try{r2=arg.toString().split(".")[1].length}catch(e){r2=0}   
    m=Math.pow(10,Math.max(r1,r2))   
    return (this.mul(m) + arg.mul(m)) / m;   
}  

//减法   
Number.prototype.subtract = function (arg){   
    return this.add(-arg);   
}   

//乘法   
Number.prototype.multiply = function (arg)   
{   
    var m=0,s1=this.toString(),s2=arg.toString();   
    try{m+=s1.split(".")[1].length}catch(e){}   
    try{m+=s2.split(".")[1].length}catch(e){}   
    return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m)   
}   

//除法   
Number.prototype.divide = function (arg){   
    var t1=0,t2=0,r1,r2;   
    try{t1=this.toString().split(".")[1].length}catch(e){}   
    try{t2=arg.toString().split(".")[1].length}catch(e){}   
    with(Math){   
        r1=Number(this.toString().replace(".",""))   
        r2=Number(arg.toString().replace(".",""))   
        return (r1/r2)*pow(10,t2-t1);   
    }   
}