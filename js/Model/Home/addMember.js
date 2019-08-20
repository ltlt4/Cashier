layui.use(['layer', 'jquery', 'form', 'laydate'], function () {
    var layer = layui.layer, $ = layui.$, form = layui.form; var laydate = layui.laydate
    var user = {
        token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
        information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null
    }
    var dateSelect = []
    var list = [], //所有默认表单
        list2 = [],//启用的表单
        list3 = [];//自定义表单

    //选择头像
    $(".upload").on("click", function () {
        return $('#userUpload').click();
    })
    $("#userUpload").on("change", function (e) {
        var reader = new FileReader();
        var file = this.files[0];
        if (file == null && file == "") {
            layer.msg(LuckVipsoft.lan.ER0018);
            return false;
        }
        if (!verify.uploadimg[0].test($(this).val())) {
            layer.msg(LuckVipsoft.lan.ER0019);
            return false;
        }
        reader.onload = function () {
            // 通过 reader.result 来访问生成的 DataURL
            var url = reader.result;
            tailoring(url, file.name);
        };
        reader.readAsDataURL(file);
    })
    //拍摄照片
    $("#Photograph").on("click", function () {
        OpenCamera();
    });


    //获取所属店铺信息            
    if ($.session.get('belongShop')) {
        var _html = ''
        for (i = 0; i < $.session.get('belongShop').length; i++) {
            _html += `<option value="${$.session.get('belongShop')[i].Id}">${$.session.get('belongShop')[i].ShopName}</option>`
        }
        $('#ShopID').find('select').html(_html)
    }
    //获取会员等级信息
    if ($.session.get('levelList')) {
        var _html = ''
        for (i = 0; i < $.session.get('levelList').length; i++) {
            _html += `<option value="${$.session.get('levelList')[i].Id}">${$.session.get('levelList')[i].LevelName}</option>`
        }
        $('#LevelID').find('select').html(_html)
    }
    //售卡提成员工
    cashier.staffInf(0, user.token)
        .then(function (result) {
            var staffInf = result;
            var staffClass = $.session.get('staffClass')
            var _html = '<option value="">请选择提成员工</option>'
            for (i = 0; i < staffClass.length; i++) {
                _html += `<optgroup label="${staffClass[i].ClassName}">`
                for (g = 0; g < staffInf.length; g++) {
                    if (staffInf[g].StaffClassId == staffClass[i].Id) {
                        _html += `<option value="${staffInf[g].Id}">${staffInf[g].StaffName}</option>`
                        staffInf[g].ClassName = staffClass[i].ClassName
                    }
                }
                _html += ` </optgroup>`
            }
            $('#Staff').find('select').html(_html)
        })
        .then(customList())

    //获取自定义字段
    function customList() {
        return new Promise(function (resolve) {
            $.http.post(LuckVipsoft.api.GetCustomFieldList, { CustomType: 1 }, user.token, function (res) {
                if (res.status == 1) {
                    var $html = $('.layui-form').html()
                    for (var i = 0; i < 21; i++) {
                        var dom = {
                            id: $(".layui-form-item").eq(i).attr('id'),
                            html: $html.split('</li>')[i] + '</li>'
                        }
                        list.push(dom)
                    }
                    for (var i = 0; i < res.data.length; i++) {
                        if (res.data[i].IsCustom == 0) {
                            list2.push(res.data[i]) //取出所有系统默认的
                        } else {
                            list3.push(res.data[i])
                        }
                    }
                    if (list2.filter(function (item) {
                        return item.FieldValue == 'Avatar'
                    }).length == 0) {
                        $("#Avatar").hide()
                    }

                    var html = ''
                    //系统默认字段
                    for (var i = 0; i < list.length; i++) {
                        for (var g = 0; g < list2.length; g++) {
                            if (list[i].id == list2[g].FieldValue) {
                                if (list2[g].FieldValue == ('ShopID') && $.session.get('Cashier_User').MShopID == $.session.get('Cashier_User').ShopID) {
                                    html += list[i].html
                                } else if (list2[g].FieldValue == ('PassWord')) {
                                    html += list[i].html
                                    html += '<li class="layui-form-item" id="PassWord2">'
                                    html += '<em>确认密码：</em>'
                                    html += '<span>'
                                    html += '<input name="addPassWord2" type="password" placeholder="再次输入会员密码" class="cd-form-input" lay-verify="repass2|pwd" />'
                                    html += '</span></li>'
                                } else {
                                    html += list[i].html
                                }

                            }

                        }
                    }
                    //自定义字段
                    if (list3.length > 0) {
                        html += '<li class="lomo-custom"><h1>自定义属性:</h1></li>'
                        for (var i = 0; i < list3.length; i++) {
                            switch (list3[i].FieldType) {
                                case 1:
                                    html += `<li id="form_${i}" class="layui-form-item" ><em>${list3[i].FieldName}：</em><span>`
                                    if (list3[i].IsRequired == 1) {
                                        html += `<input name="${list3[i].Id}" type="text" class="cd-form-input" lay-verify="required"/>`
                                    } else {
                                        html += `<input name="${list3[i].Id}" type="text" class="cd-form-input" />`
                                    }
                                    html += '</span></li>'
                                    break;
                                case 2:
                                    html += `<li id="form_${i}" class="layui-form-item" ><em>${list3[i].FieldName}：</em><span>`
                                    if (list3[i].IsRequired == 1) {
                                        html += `<input name="${list3[i].Id}" type="text" class="cd-form-input" lay-verify="required|number"/>`
                                    } else {
                                        html += `<input name="${list3[i].Id}" type="text" class="cd-form-input" lay-verify="number" />`
                                    }
                                    html += `</span></li>`
                                    break;
                                case 3:
                                    html += `<li id="form_${i}" class="layui-form-item" ><em>${list3[i].FieldName}：</em><span>`
                                    if (list3[i].IsRequired == 1) {
                                        html += `<input name="${list3[i].Id}" type="text" class="cd-form-input" lay-verify="required|timer" id="timeform_${i}"/>`
                                    } else {
                                        html += `<input name="${list3[i].Id}" type="text" class="cd-form-input" id="timeform_${i}" lay-verify="timer" />`
                                    }
                                    html += `</span></li>`
                                    dateSelect.push(`#timeform_${i}`)
                                    break;
                                case 4:
                                    var value = list3[i].FieldValue.split('|')
                                    var option = ''
                                    for (var g = 0; g < value.length; g++) {
                                        option += `<option value="${value[g]}">${value[g]}</option>`
                                    }
                                    html += `<li id="form_${i}" class="layui-form-item">
                                        <em>${list3[i].FieldName}：</em><span>
                                        <select name="${list3[i].Id}" class="cd-form-select" name="${list3[i].Id}">
                                            ${option}
                                        </select></span></li>`
                                    break
                            }
                        }
                    }
                    html += '<li  style="position: absolute;top: 130%;left: 49%;width: 400px;text-align: right;"><button type="button" class="submit-bt-clear" id="close">取消</button><button  class="submit-bt" lay-submit="" lay-filter="addMem">保存</button></li>'
                    $('.layui-form').html(html);
                    if (html.indexOf('Birthday') != -1) {
                        laydate.render({
                            elem: '#timeBirthday',
                            range: false,
                            theme: '#41c060',
                            type: 'date',
                            done: function (value, date, endDate) {
                                if ($("input[name='MemReg_BirthdayType']:checked").val() == 1) {
                                    $("#timeBirthdaySon").val(value);
                                } else if ($("input[name='MemReg_BirthdayType']:checked").val() == 0) {
                                    var date = value.split('-')
                                    var _date = LunarCalendar.solarToLunar(date[0], date[1], date[2]);
                                    $("#timeBirthdaySon").val(_date.lunarYearName + _date.lunarMonthName + _date.lunarDayName)
                                }
                            }
                        });
                    }
                    form.on('radio(MemReg_BirthdayType)', function (data) {
                        if (data.value == 1) {
                            $("#timeBirthdaySon").val($("#timeBirthday").val());
                        } else if (data.value == 0 && $("#timeBirthday").val() != '') {
                            var date = $("#timeBirthday").val().split('-')
                            var _date = LunarCalendar.solarToLunar(date[0], date[1], date[2]);
                            $("#timeBirthdaySon").val(_date.lunarYearName + _date.lunarMonthName + _date.lunarDayName)
                        }
                    });
                    for (var i = 0; i < dateSelect.length; i++) {
                        laydate.render({
                            elem: dateSelect[i],
                            range: false,
                            theme: '#41c060',
                            type: 'date',
                            done: function (value, date, endDate) {

                            }
                        });
                    }
                    form.render();//重新渲染表单
                    $("#List").show();
                }
            })
        })
    }

    //编辑输入规则
    form.verify({
        onlynum: function (value, item) {
            if (value != "") {
                if (!verify.money[0].test(value))
                    return '金额输入错误';
            }
        },
        name: function (value, item) {
            if (value != "") {
                if (!verify.name[0].test(value))
                    return '姓名输入错误';
            }
        },
        pwd: function (value, item) {
            if (value != "") {
                if (!verify.pwd[0].test(value))
                    return verify.pwd[1];
            }
        },
        email: function (value, item) {
            if (value != "") {
                if (!verify.email[0].test(value))
                    return '邮箱输入错误';
            }
        },
        phone: function (value, item) {
            if (value != "") {
                if (!verify.phone[0].test(value))
                    return verify.phone[1];
            }
        },
        identity: function (value, item) {
            if (value != "") {
                if (!verify.identity[0].test(value))
                    return verify.identity[1];
            }
        },
        cardID: function (value, item) {
            if (value != "") {
                if (!verify.cardID[0].test(value))
                    return verify.cardID[1];
            }
        },
        repass: function (value, item) {
            var psw2 = $('#PassWord').find('input').val()
            if (value != '') {
                if (!new RegExp(psw2).test(value)) {
                    return '两次输入的密码不一致';
                }
            }
        },
        repass2: function (value, item) {
            var psw = $('#PassWord').find('input').val()
            if (value != '') {
                if (!new RegExp(psw).test(value)) {
                    return '两次输入的密码不一致';
                }
            }
        },
        timer: function (value, item) {
            if (value != "") {
                if (!verify.timer[0].test(value))
                    return verify.timer[1];
            }
        },
        vehicleNumber: function (value, item) {
            if (value != "") {
                if (!verify.vehicleNumber[0].test(value))
                    return verify.vehicleNumber[1];
            }
        },
    });
    //提交表单
    form.on('submit(addMem)', function (data) {
        BirthdayType = $("input[name='MemReg_BirthdayType']:checked").val();
        if (data.field.addBirthday) {
            var Birthday = data.field.addBirthday
            if (BirthdayType == 1) {
                var BirthdayYear = Birthday.split('-')[0],
                    BirthdayMonth = Birthday.split('-')[1],
                    BirthdayDay = Birthday.split('-')[2];
            } else if (BirthdayType == 2) {
                var date = Birthday.split('-');
                var _date = LunarCalendar.solarToLunar(date[0], date[1], date[2]);
                var BirthdayYear = _date.lunarYear,
                    BirthdayMonth = _date.lunarMonth,
                    BirthdayDay = _date.lunarDay;
            }

        } else {
            var BirthdayYear = 0,
                BirthdayMonth = 0,
                BirthdayDay = 0;
        }
        var customFieldsJson = [];//获取自定义选择的值
        for (key in data.field) {
            for (var i = 0; i < list3.length; i++) {
                if (list3[i].Id == key) {
                    customFieldsJson.push({
                        CustomID: list3[i].Id,
                        ModelValue: data.field[key]
                    })
                }
            }
        }
        var shopID = '' //判断是否有权选择所属店铺
        if (data.field.addShopID && $.session.get('Cashier_User').MShopID == $.session.get('Cashier_User').ShopID) {
            shopID = data.field.addShopID;
        } else if (!data.field.addShopID && $.session.get('Cashier_User').MShopID == $.session.get('Cashier_User').ShopID) {
            shopID = $.session.get('Cashier_User').ShopID;
        } else if (!data.field.addShopID && $.session.get('Cashier_User').MShopID != $.session.get('Cashier_User').ShopID) {
            shopID = $.session.get('Cashier_User').MShopID;
        }
        var param = {
            Id: "",
            CardID: data.field.addCardID ? data.field.addCardID : "",
            CardName: data.field.addCardName ? data.field.addCardName : "",
            Mobile: data.field.addMobile ? data.field.addMobile : "",
            LevelID: data.field.addLevelID ? data.field.addLevelID : 0,
            ShopID: shopID,
            PassWord: data.field.addPassWord ? data.field.addPassWord : "",
            Sex: data.field.addSex ? data.field.addSex : "",
            IdentityCode: data.field.addIdentityCode ? data.field.addIdentityCode : "",
            BirthdayType: BirthdayType ? BirthdayType : "",
            BirthdayYear: BirthdayYear,
            BirthdayMonth: BirthdayMonth,
            BirthdayDay: BirthdayDay,
            Referer: data.field.addRefererCardID ? data.field.addRefererCardID : "",
            Staff: data.field.addStaff ? data.field.addStaff : "",
            Address: data.field.addAddress ? data.field.addAddress : "",
            Avatar: $('.upload').find('img').attr('src') ? $('.upload').find('img').attr('src') : "",
            Remark: data.field.addRemark ? data.field.addRemark : "",
            CardMoney: data.field.addCardMoney ? data.field.addCardMoney : 0.0,
            PlateNumber: data.field.addPlateNumber ? data.field.addPlateNumber : "",
            RegSource: 6,
            OutCardID: data.field.addOutCardID ? data.field.addOutCardID : "",
            WeChatCode: "",
            Money: data.field.addMoney ? data.field.addMoney : 0.0,
            CustomFields: customFieldsJson.length > 0 ? JSON.stringify(customFieldsJson) : ""
        }

        $.http.post(LuckVipsoft.api.SaveMemberData, param, user.token, function (res) {
            layer.msg(res.msg)
        })
        return false
    });
    //关闭
    $("#close").on('click', function () {
        var index = parent.layer.getFrameIndex(window.name);
        parent.layer.close(index); 

    })
})
function Cashier_video(imgUrl) {
    var imgName = cashier.revDateFormat(cashier.curentTime(new Date()));
    imgUrl = 'data:image/png;base64,' + imgUrl;
    tailoring(imgUrl, imgName)
}
//裁剪图片并上传
function tailoring(url, imgName) {
    layui.use(['layer', 'jquery', 'form', 'laydate'], function () {
        var user = {
            token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
            information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null
        }
        var html = ''
        html += '<div class="lomo-upload-ava">'
        html += '<div class="lomo-upload-ava-body">'
        html += '<div class="lomo-upload-ava-left">'
        html += '<div>'
        html += '<img src="" alt="" id="preview">'
        html += '</div>'
        html += '</div>'
        html += '<div class="lomo-upload-ava-right">'
        html += '<div class="lomo-upload-ava-preview">'
        html += '</div>'
        html += '<div class="lomo-upload-ava-span">'
        html += '<span>头像预览</span>'
        html += '</div>'
        html += '</div>'
        html += '</div>'
        html += '<div class="lomo-upload-ava-footer"></div>'
        html += '</div>'
        layer.open({
            type: 1,
            title: '上传头像',
            closeBtn: 1,
            shadeClose: false,
            shade: 0.3,
            maxmin: false,//禁用最大化，最小化按钮
            resize: false,//禁用调整大小
            area: ['90%', '90%'],
            btn: ['取消', '确认'],
            skin: "lomo-ordinary",
            btnAlign: "c",
            anim: 5,
            content: html,
            yes: function (index, layero) {
                layer.close(index);
            },
            btn2: function (index, layero) {
                var cas = $('#preview').cropper('getCroppedCanvas');// 获取被裁剪后的canvas 
                var base64 = cas.toDataURL('image/png');//转为base64
                var param = {
                    Type: 2,
                    FileName: imgName,
                    ImgData: base64.split(',')[1]
                }
                $.http.post(LuckVipsoft.api.UploadImg, param, user.token, function (res) {
                    layer.msg(res.msg);
                    if (res.status == 1) {
                        layer.close(index);
                        var html = ''
                        html += '<img src="'
                        html += user.information.ImageServerPath + res.data
                        html += '" alt="">'
                        $(".upload").html(html).css({ "padding": 0, "height": "100px" })
                    }
                })
                return false;
            }
        })
        $("#preview").attr("src", url);
        $('#preview').cropper({
            aspectRatio: 1 / 1,// 默认比例  
            preview: '.lomo-upload-ava-preview',// 预览视图  
            guides: true, // 裁剪框的虚线(九宫格) 
            viewMode: 2,
            autoCropArea: 0.5, // 0-1之间的数值，定义自动剪裁区域的大小，默认0.8  
            movable: false, // 是否允许移动图片  
            dragMode: 'crop', // 是否允许移除当前的剪裁框，并通过拖动来新建一个剪裁框区域  
            movable: true, // 是否允许移动剪裁框  
            resizable: true, // 是否允许改变裁剪框的大小  
            zoomable: false, // 是否允许缩放图片大小  
            mouseWheelZoom: false, // 是否允许通过鼠标滚轮来缩放图片  
            touchDragZoom: true, // 是否允许通过触摸移动来缩放图片  
            background: true, //是否在容器上显示网格背景。
            modal: true, //是否在剪裁框上显示黑色的模态窗口
            rotatable: false,//是否允许旋转图片
            highlight: false,//在裁剪框上方显示白色模态
            crop: function (e) {
                // 输出结果数据裁剪图像。  
            }
        });
    })
};
