layui.use(['layer', 'element', 'jquery', "form"], function () {
    var layer = layui.layer, element = layui.element, $ = layui.$, form = layui.form;

    //选项卡切换
    $(".lomoTab span").on("click", function () {
        $(this).addClass("hover").siblings().removeClass("hover");
        var index = $(this).index();
        $(".lomoTab-warp").eq(index).show().siblings(".lomoTab-warp").hide();
    });
	/******************初始化*************************/
	//IC卡设置
	var icOldval = JSON.parse(GetICCardSetting());
	if (icOldval.status == 1) {
	    var data = icOldval.data;
	    form.val("setIcCard", {
	        IsEnableICCard: data.IsEnableICCard == 0 ? false : true,
	        cardType: data.ICCardType,
	        sata: data.ICCardCom,
	        baudRate: data.ICCardBaudRate,
	    })
		if(data.ICCardType==3){
			$("#sataBox").show();
		}
	}
    //打印设置
    var printOldval = JSON.parse(GetPrintSetting());
    if (printOldval.status == 1) {
        var data = printOldval.data;
        form.val("setPrint", {
            rinting: data.IsPrint == 0 ? false : true,
            main: data.PrintName,
            secondary: data.OtherPrintName,
            printNum: data.TicketCount,
            MM: data.PrintSize,
        })
    }
	//客显设置
	var guestOldval = JSON.parse(GetDisplaySetting());
	if (guestOldval.status == 1) {
	    var data = guestOldval.data;
	    form.val("guestSet", {
	        IsDisplayCom: data.IsDisplayCom == 0 ? false : true,
	        guestShow: data.GuestDisplayCom,
	    })
	}
	
	/******************设置*************************/
    /****IC卡设置***/
	$("#curSataName").html($("select[name='sata']").val())
	//IC-芯片下拉框选中
    form.on('select(cardType)', function (data) {
        if (data.value == 3) {
            $("#sataBox").show();
        } else {
            $("#sataBox").hide();
        }
    })
	form.on('select(sataType)',function(data){
		$("#curSataName").html(data.value)
	})
	//IC-刷新串口
    $(".flashSata").on("click", function () {
		var result = LoadSerialPort();
		var html = '';
		if(result){
			$.each(page.Coms,function(index,item){
				html += '<option>'+item+'</option>'
			})
			$("select[name='sata']").html(html);
			$("select[name='guestShow']").html(html);
			form.render();
		}
    });
	//IC-保存
	$("#submitIcSet").on("click",function(){
		var icCardData = {
		    IsEnableICCard: $("input[name='IsEnableICCard']").is(":checked") ? '1' : '0',//是否启用系统IC卡
		    ICCardType: $("select[name='cardType']").val(),//IC卡类型
		    ICCardCom: $("select[name='sata']").val(),//串口
		    ICCardBaudRate: $("select[name='baudRate']").val(),//波特率
		}
		console.log($("select[name='sata']").val())
		var res = SaveICCardSetting(JSON.stringify(icCardData));
		layer.msg(JSON.parse(res).msg)
		
	})

    /****打印设置***/
	//打印-保存
    $("#submitPrint").on("click", function () {
        var printData = {
            IsPrint: $("#rinting").is(":checked") ? '1' : '0',//是否启用打印设置
            PrintName: $("select[name='main']").val(),//打印名称
            OtherPrintName: $("select[name='secondary']").val(),//从打印名称
            TicketCount: $("input[name='printNum']").val(),//打印份数
            PrintSize: $("input[name='MM']:checked").val(),//打印尺寸
        }
        var data = SavePrintSetting(JSON.stringify(printData));
        layer.msg(JSON.parse(data).msg)
    })
	
	/****其他设置***/
	//客显调试
	$(".guest-show-test button").on("click",function(){
		var n = $(this).index(),type='',data='';
		if(!($("input[name='IsDisplayCom']").is(":checked"))){
			layer.msg("请先启用可先系统!");
			return
		}
		//类型0-清屏1-单价2-总价3-收款4-找零
		if(n==0){
			type = '1';
			data = 66.66
		}else if(n==1){
			type = '2';
			data = 88.88
		}else if(n==2){
			type = '4';
			data = 22.22
		}
		var otherSet = {
		    data: data,
			type: type,
		    port: $("select[name='guestShow']").val(),//客显地址
		}
		TestDisplay(otherSet.data,otherSet.type,otherSet.port);
	})
	
	//其他-保存
	$("#submitOtherSet").on("click", function () {
	    var otherSet = {
	        IsDisplayCom: $("input[name='IsDisplayCom']").is(":checked") ? '1' : '0',//是否启用客显设置
	        GuestDisplayCom: $("select[name='guestShow']").val(),//客显地址
	    }
	    var data = SaveDisplaySetting(JSON.stringify(otherSet));
	    layer.msg(JSON.parse(data).msg);
		$.session.set('IsDisplayCom', otherSet.IsDisplayCom);
	})
	
})