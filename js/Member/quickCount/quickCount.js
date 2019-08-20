var childPage = layui.use(['layer', 'element', 'jquery', "form", 'table'], function () {
	var layer = layui.layer, element = layui.element, $ = layui.$, form = layui.form, table = layui.table;
	
	var user = {
	    token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
	    information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
		staffClass:$.session.get("staffClass")? $.session.get("staffClass") : null,
		staffInf:$.session.get("staffInf")? $.session.get("staffInf") : null,
	}
	var member = null;//选择的会员信息
	var countProjectId = null;//扣次项目Id
	var royaltyMemId = '';//提成员工Id
	
	window.pageMethod={
		pageIndex: 1,
		pageSize: 10,
		init:function(){
			var _this = this;
			
			_this.bindSelect();//绑定计次项目,提成员工下拉框
			$("#search").on("click", function (e) {
				_this.searchMemCard();//选择会员扣次
			})
		},
		//查询选择会员
		searchMemCard: function (parameter) {
			var _this = this;
			var value = '';
			countProjectId = $("select[name='countList']").val();
			royaltyMemId = $("select[name='staffList']").val();
			
			if(!countProjectId){
				layer.msg("请先选择扣次项目");
				return;
			}
			if(parameter){
				value = parameter;
				$("#barCode").val(parameter);
			}else{
				value = $("#barCode").val();
			}
			if (!value.match(/^\s*$/)) {
				var param = {
					SearchCriteria: value,
					Type: 0
				}
				$.http.post(LuckVipsoft.api.SearchMemCardList, param, user.token, function (res) {
					if (res.status == 1) {
						if (res.data.length == 1) {
							http.cashierEnd.seleMembers(res.data[0], user.information.ImageServerPath, '.lomo-mian-left .vipInfo')
							member = res.data[0];
							_this.getMemberCountProlist(value,res.data[0].Id);
							
							$(".timescount").show();
							$(".lomo-order").css({"top":"84px","margin-top":"11px"});
			            } else {
			                layer.msg('请输入正确的卡号')
						}
					}
				})
			}
		},
		//绑定计次项目,提成员工下拉框
		bindSelect:function(){
			var _this = this;
			var html = '';
			html += '<option value="">请选择提成员工</option>'
			$.each(user.staffInf,function(index,item){
				html += '<option value="'+item.Id+'">'+item.StaffName+'</option>'
			})
			$("#staffList").html(html);
			
			//所有计次项目
			var countHtml = '';
			countHtml += '<option value="">请选择项目</option>'
			$.http.post(LuckVipsoft.api.GetServiceGoods, {}, user.token,function(res){
				if(res.data&&res.data.length>0){
					$.each(res.data,function(index,item){
						countHtml += '<option value="'+item.Id+'">'+item.GoodsName+'</option>'
					})
					$("#countList").html(countHtml);
					form.render('select'); 
				}
			})
		},
		//获取选中会员的计次项目及历史记录
		getMemberCountProlist:function(cardId,memId){
			var _this = this;
			//会员计次项目
			var param = {
				Page: _this.pageIndex,
				Rows: _this.pageSize,
				MemID: memId,//会员ID
				Key: '',//扫码时商品条码
				Type: 3,//1产品 2套餐 3计次 4扫码
				ClassID: ''
			}
			var memberProCount='',hasCurAct=false;
			$(".count-list").html('')
			$.http.post(LuckVipsoft.api.GetCashierGoodsListPage, param, user.token, function (res) {
				if(res.data.list&&res.data.list.length>0){
					$.each(res.data.list,function(index,item){
						memberProCount += `<div class="count-item" data-id="${item.Id}"><i class="count-icon">次</i><p>${item.GoodsName}</p><span>数量：<b>${item.Number}</b></span></div>`
						if(item.Id==countProjectId){
							hasCurAct = true;
							return;
						}
					})
					if(hasCurAct){
						_this.submitQuickCount();//提交扣次订单
					}else{
						layer.msg("当前会员无该计次项目")
					}
					$(".count-list").html(memberProCount);
				}else{
					if(_this.pageIndex==1){
						$.luck.error('当前会员暂无计次项目');
					}else{
						$.luck.error('没有更多了');
					}
				}
			})
			//会员历史订单记录
			var param = {
				"OrderType":5,//2、商品消费 5、快速扣次
				"BillCode":'',
				"CardCode":cardId,//会员卡号、姓名、手机号
				"Remark":'',
				"RevokeState":0, 
				"PayMinQuota":'',
				"PayMaxQuota":'', 
				"OptMinTime":'20170629000000',
				"OptMaxTime":'20170729000000',
			}
			$.http.post(LuckVipsoft.api.GetConsumeOrderList, param, user.token, function (res) {
				console.log(res)
			})
			
		},
		//快速扣次提交
		submitQuickCount:function(){
			var _this = this;
			
			var param = {
				"MemID": member.Id,//会员Id
				"GoodsID": countProjectId,//扣次项目Id
				"StaffId": royaltyMemId,//提成员工Id
				"Source":1,//消费来源:0-PC、1-前台收银、2-收银机、3-APP 4 公众号 5 小程序
			}
			$.http.post(LuckVipsoft.api.SaveDeductFixedCountOrder, param, user.token, function (res) {
				console.log(res);
				layer.msg(res.msg)
			})
		},
	}
	
	pageMethod.init();
})
//刷卡获取卡号后续处理
function getIccardNumber(parameter){
	pageMethod.searchMemCard(parameter)
}
