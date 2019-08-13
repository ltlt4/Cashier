layui.use(['layer', 'element', 'jquery', "form", 'table','laypage',], function () {
	var layer = layui.layer, element = layui.element, $ = layui.$, form = layui.form, table = layui.table,laypage = layui.laypage;

	var user = {
		token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
		information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
		staffClass: $.session.get("staffClass") ? $.session.get("staffClass") : null,
		staffInf: $.session.get("staffInf") ? $.session.get("staffInf") : null,
	}

	var sysArgument = $.session.get('Cashier_User').SysArguments
	console.log('sysArgument', sysArgument)
	console.log(sysArgument)
	var oPayCompose = new payCompose(sysArgument)


	console.log('-------------页面参数-------------------')
	var id = getQueryString('id')
	var m = getQueryString('m')
	console.log('orderId', id)
	console.log('m', m) //1.预约
	console.log('-------------页面参数-------------------')

	//计算完成后回调，页面执行渲染
	oPayCompose.processCallback = function () {
		//活动勾选状态
		$('.act_item').removeClass('checked')
		let actHtml = ''
		if (oPayCompose.chooseBirthdayActivity.Id != undefined) {
			actHtml += '<i class="shopAct">' + oPayCompose.chooseBirthdayActivity.ActName + '</i>'
			$('.act_' + oPayCompose.chooseBirthdayActivity.Id).addClass('checked')
		}

		if (oPayCompose.chooseActivity.Id != undefined) {
			// console.log('result',result)
			actHtml += '<i class="shopAct">' + oPayCompose.chooseActivity.ActName + '</i>'
			$('.act_' + oPayCompose.chooseActivity.Id).addClass('checked')
		}

		if (actHtml == '') {
			if (hasShopAcivity) {
				$(".order-select").html('请选择优惠活动')
			}
			else {
				$(".order-select").html('暂无优惠活动')
			}
		}
		else {
			$(".order-select").html(actHtml)
		}

		//购物车
		let pageGoodsSelector = 'goodsTmp'
		let pageGoodsTempleteId = '.order-list'
		//var data={ name:'yxtic', age:'0' };
		let html = template(pageGoodsSelector, oPayCompose.result.goods);
		$(pageGoodsTempleteId).html(html)

		//金额面板
		let pageGoodsAmountTempleteId = 'goodsAmountTmp'
		let pageGoodsAmountTmpSelector = '.order-Pay'

		let dataResult = {
			num: oPayCompose.result.goodsNum,
			point: (oPayCompose.result.amountPoint - 0).toFixed(2),
			cutPrice: (oPayCompose.result.amountDiscountMoney - 0).toFixed(2),
			price: (oPayCompose.result.amountMoney - 0).toFixed(2),
			activityPrice: (oPayCompose.result.amountActivityMoney).toFixed(2),
		}

		let html2 = template(pageGoodsAmountTempleteId, dataResult);
		$(pageGoodsAmountTmpSelector).html(html2)
	}
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



	var member = null;//选择的会员信息
	var coupoonListAry = [];//会员优惠券列表
	var proPageTotalNum = 1;
	var maskBody = ".lomo-mask-body";
	var graph = true;          //判断是否开启无图模式
	var keySwitch = true;    //小、全键盘
	var overall = false; //需要esc关闭的界面是否打开
	var hasShopAcivity = false;//是否有店铺活动
	// var maskCashier = ".lomo-mask-cashier";
	var memId = '';//会员ID
	var proboxHeight = $(".lomo-mian-right").height();
	var proboxWidth = $(".lomo-mian-right").width();
	var X = '', Y = Math.floor(proboxHeight / 226);
	// var BirthdayValidRule = 3;//1-生日优先、2-系统活动优先、3-系统活动上叠加
	// var totleMoney = 0;//当前消费总金额--折前
	// var shopActivityAry = [];//当前店铺优惠券活动
	// var shopMemberActAry = [];//会员所有店铺优惠

	var pageMethod = {
		StaffClassList: [],//员工分类
        StaffList: [],//提成员工
		pageIndex: 1,
		pageSize: 10,
		key: '',//商品条码
		searchType: 1,//1产品 2套餐 3计次 4扫码
		classId: '',//产品类目Id(一级，二级)
		detailsList: [],//购物车内产品列表
		parent: [],//一级菜单
		children: [],//二级菜单
		order: {//订单信息
			OrderType: 6,//订单类型
			MemberPwd: "",//会员密码
			MemID: "",//会员ID
			TotalMoney: 0,//订单总金额
			Remark: "",//备注
			Source: 6,//消费来源
			Status: 4,//状态
			LogisticsWay: 1,//物流方式
			ConsigneeID: ""//收货人ID
		},
		choosedStaffAry: [],//商品提成员工信息
		resetPage:function(){
			pageMethod.getGoodsListPageList()
			pageMethod.removeChooseMember()
			oPayCompose.clearShoppingCar()
		},
		//选会员
		changeMember:function(member,billCode){
			if(billCode==undefined) { billCode ='' }
			if(member.Id!=undefined){
				http.cashierEnd.seleMembers(member, user.information.ImageServerPath, '.lomo-mian-left .vipInfo')
				// member = res.data[0];
				memId = member.Id;
				oPayCompose.changeMember(member,billCode)
				pageMethod.getShopActivity()
				$(".timescount").show();
				$(".lomo-order").css({ "top": "84px", "margin-top": "11px" });
				var param = {
					Page:1,
					Rows:10000,
					MemID:member.Id,
					ConponCode:"",
					UseType:"2",
				}
				$.http.post(LuckVipsoft.api.GetMemConponList, param, user.token, function (res) {
					coupoonListAry = res.data;
				})
			}
			else{
				oPayCompose.changeMember({},billCode)
			}
		},
		//清除页面会员信息
		removeChooseMember: function (){
			shopMemberActAry = [];
			member = null;
			http.cashierEnd.delMembers('.lomo-mian-left .vipInfo', 'member');
			//$(".check-box-list .birthday").remove();
			$(".timescount").hide();
			$(".lomo-order").css({ "top": "0", "margin-top": "0" });
			oPayCompose.changeMember({},'')
			memId = ''
			pageMethod.getShopActivity()
			//pageMethod.checkSystemActivity();//重新选择系统优惠活动
		},
		//取单
		getRestingOrder:function(id){
			postData ={OrderID:id}
			$.http.post(LuckVipsoft.api.GetRestingOrderData,postData, user.token, function (res) {
				console.log('取数据',res)
				if(res.status == 1){
					if( oPayCompose.settingRestingReslut(res.data)){
						let m =res.data.MemberInfo ==undefined ?{} :res.data.MemberInfo
						pageMethod.changeMember( m , res.data.BillCode)
						//页面数据
						$("#resting_handCode").val(res.data.HandCode)
						$("#resting_remark").val(res.data.Remark)
						$("#resting_handCode").attr("readonly",true)
					}
					layer.closeAll()
				}
				else{
					layer.alert(res.msg, { icon: 2, closeBtn: 0 }, function (index) {
						layer.close(index)
					});
				}
			})			
		},
		//快速收银活动变化
		chargeActivity:function(){
			//活动判断
			$('.act_item').removeClass('checked')
			let actHtml = ''
			if (oPayCompose.chooseBirthdayActivity.Id != undefined) {
				actHtml += '<i class="shopAct">' + oPayCompose.chooseBirthdayActivity.ActName + '</i>'
				$('.act_' + oPayCompose.chooseBirthdayActivity.Id).addClass('checked')
			}

			if (oPayCompose.chooseActivity.Id != undefined) {
				// console.log('result',result)
				actHtml += '<i class="shopAct">' + oPayCompose.chooseActivity.ActName + '</i>'
				$('.act_' + oPayCompose.chooseActivity.Id).addClass('checked')
			}

			if (actHtml == '') {
				if (hasShopAcivity) {
					$(".rechargeActivity").html('请选择优惠活动')
				}
				else {
					$(".rechargeActivity").html('暂无优惠活动')
				}
			}
			else {
				$(".rechargeActivity").html(actHtml)
			}
		},
		init: function () {
			var _this = this;
			_this.getShopActivity();//获取店铺优惠活动
			_this.getGoodsClassList();//产品分类：一级类目
			_this.classSlide();//一级菜单滑动
			_this.classTwoSlide();//二级菜单滑动
			_this.countProductNum();//一屏显示产品
			_this.searchMemCard();//查询会员
			//_this.chooseMembergetCommission();//提成员工
			_this.orderManage();//订单相关管理
			_this.editShopcarProduct();//编辑购物车产品
			_this.checkProductIntoCar();//向购物车添加产品
			_this.payPopArea();//收银相关操作弹层
			_this.initClick();//其他点击事件
			_this.initPayItem();
			//获取提成员工
			new Promise(_this.GetStaffClassList.bind(_this)).then(function (res) {
                   return new Promise(_this.GetStaffList.bind(_this))
               }).then(function (res) {
                   _this.chooseMembergetCommission()
			   });
			   
			if(id != null){
				_this.getRestingOrder(id);
			}
		},
		//初始化支付项
		initPayItem: function () {
			let html = ''
			$.each(sysArgument.PaymentConfig, function (index, item) {
				html += '<li data-code="' + item.code + '" id="pay_item_' + item.code + '" class="pay_item"><a style="background: url(../../../Theme/images/pay/' + item.icon + ') no-repeat center 10px;" href="#">' + item.name + '</a></li>'
			});
			$("#pay").html(html)
			$(".pay_item").bind("click", function () {
				let code = $(this).attr('data-code')
				if (oPayCompose.chooseMember.Id == undefined && (code == '002' || code == '003' || code == '999')) {
					$.luck.error('会员才可用 积分、余额、优惠券 支付')
					return false
				}

				if (oPayCompose.payMaxCount(code, 3)) {
					$.luck.error('最多只能选择3中支付方式')
					return false
				}

				let result = oPayCompose.selectPay(code)
				//重新渲染 -> cashier-num

				if (!result) {
					$.luck.error(code)
				}
			});
		},
		initClick: function () {
			var _this = this;
			//切换无图模式
			$('.graph').on("click", function () {
				if (graph) {
					$(this).html('关闭无图模式');
					graph = false;
				} else if (!graph) {
					$(this).html('开启无图模式');
					graph = true;
				}
				_this.countProductNum();
			})
			//产品翻页
			$(".page-prev").on("click", function () {
				if (_this.pageIndex == 1) {
					layer.msg("已经是第一页");
					return;
				} else {
					_this.pageIndex = _this.pageIndex - 1;
					_this.countProductNum();
				}
			})
			$(".page-next").on("click", function () {
				if (_this.pageIndex == proPageTotalNum) {
					layer.msg("已经是最后一页");
					return;
				} else {
					_this.pageIndex = _this.pageIndex + 1;
					_this.countProductNum();
				}
			})
			//套餐商品,计次项目,返回产品列表
			$(".change-product-nav").on("click", function () {
				var type = $(this).attr("data-type");

				_this.pageIndex = 1;
				if (type == "normal") {
					_this.searchType = 1;
					$(".classify-nav-box").show();
					$(".back-product").hide();
				} else {
					if (type == "setmeal") {
						_this.searchType = 2;
					} else {
						_this.searchType = 3;
					}
					$(".classify-nav-box").hide();
					$(".back-product").show();
				}
				_this.countProductNum();
			})
			//搜索产品
			$(".search-product").on("click", function () {
				var val = $("#searchVal").val();
				//if (!val.match(/^\s*$/)) {
				_this.key = val;
				_this.getGoodsListPageList();
				//}
			})

			/*清除获取的会员*/
			$("body").on("click", '.vip-delete img', function (e) {
				console.log('PayCompose.billCode',oPayCompose.billCode)
				if(oPayCompose.billCode != ''){
					oPayCompose.clearShoppingCar()
				}
				pageMethod.removeChooseMember()
				// shopMemberActAry = [];
				// member = null;
				// http.cashierEnd.delMembers('.lomo-mian-left .vipInfo', 'member');
				// //$(".check-box-list .birthday").remove();
				// $(".timescount").hide();
				// $(".lomo-order").css({ "top": "0", "margin-top": "0" });
				// //pageMethod.checkSystemActivity();//重新选择系统优惠活动
				// oPayCompose.changeMember({})
				// memId = ''
				// pageMethod.getShopActivity()
				// //_this.rendShopCarAgain();//重新渲染购物车
			})
			$('.shop-type-button').click(function () {
				$('.shop-type').toggleClass('type-distance')
			});
			/*新增会员 */
			$(".lomo-shopBar .add-bt").on("click", function () {
				$(this).blur();
				layer.open({
					type: 2,
					id: "addhMemCard",
					title: '新增会员',
					closeBtn: 1,
					shadeClose: true,
					shade: 0.3,
					maxmin: false,//禁用最大化，最小化按钮
					resize: false,//禁用调整大小
					move: false,//禁止拖拽
					area: ['940px', '740px'],
					skin: "lomo-ordinary",
					btnAlign: "r",
					content: '../../../Areas/Model/Home/addMember.html',
					success: function (layero, index) {
						this.enterEsc = function (event) {
							if (event.keyCode === 27) {
								layer.close(index);
								return false;
							}
						};
						$('body').on('keydown', this.enterEsc);    //监听键盘事件，关闭层
					}
				})
			})

			$("body").on("click",".submit-bt-clear", function () {
                var box = $(this).parents('.fadeIn');
                cashier.close(box, 'fadeIn', 'fadeOut', '.lomo-mask-left');
            });
		},
		//计算每屏显示产品个数
		countProductNum: function () {
			if (!graph) {
				Y = Math.floor(proboxHeight / 120)
			} else {
				Y = Math.floor(proboxHeight / 226)
			}
			if (proboxWidth >= 1352) {
				X = 6;
			} else if (proboxWidth < 1352 && proboxWidth >= 1230) {
				X = 5;
			} else if (proboxWidth < 1230 && proboxWidth >= 984) {
				X = 4;
			} else if (proboxWidth < 984 && proboxWidth >= 738) {
				X = 3;
			} else if (proboxWidth < 738 && proboxWidth >= 492) {
				X = 2;
			} else if (proboxWidth < 492 && proboxWidth >= 246) {
				X = 1;
			}
			this.pageSize = X * Y;
			this.getGoodsListPageList(proboxWidth, X);
		},
		//获取所有产品分类菜单
		getGoodsClassList: function () {
			var _this = this;
			$.http.post(LuckVipsoft.api.GetGoodsClassList, {}, user.token, function (res) {
				var html = '';
				var length = 0
				html += `<a class="active" data-classId="0" href="javascript:void(0);">全部</a>`;
				if (res.data && res.data.length > 0) {
					$.each(res.data, function (index, item) {
						if (item.ParentID == '0') {
							_this.parent.push(item)
							html += `<a data-classId="${item.Id}" onclick="" href="javascript:void(0);" class="lomo-classList">${item.ClassName}</a>`
						} else {
							_this.children.push(item)
						}
					});
					$.each(_this.parent, function (index, item) {
						_this.parent[index].children = []
						$.each(_this.children, function (index2, item2) {
							if (item2.ParentID == item.Id) {
								_this.parent[index].children.push(item2)
							};
						});
					});
				}
				$(".classify-nav").html(html);
				$(".classify-nav a").on("click", function () {
					var Id = $(this).attr("data-classId");
					var curCls = $(this).attr("class");
					var top = $(this).position().top;
					var left = $(this).position().left;
					var i = $(this).index();
					if (Id == 0) {
						$(".leaveltwo-nav-box").hide();
						_this.classId = '';
						_this.pageIndex = 1;
						_this.getGoodsListPageList();
					} else {
						_this.getGoodsClassTwo(Id, curCls, i, {
							top: top,
							left: left
						});
					}
					$(this).addClass("active").siblings().removeClass("active");
				})
				$(".classify-nav .lomo-classList").each(function () { //计算菜单长度
					length += parseFloat($(this).css("width").split('px')[0]) + 30;
				});
				if (length > 450) {
					$(".classify-nav-box .scroll-view").addClass('lomo-scroll-view')
				} else {
					$(".classify-nav-box .scroll-view").css({ "width": length })
				};
				$(".classify-nav").css({ "width": length + "px" });
			})
		},
		//获取二级菜单
		getGoodsClassTwo: function (parentId, curCls, index, offset) {
			var _this = this;
			// var param = {
			// 	ParentID: parentId
			// }
			// $.http.post(LuckVipsoft.api.GetGoodsClassList, param, user.token, function (res) {
			var html = '';
			var length = 0
			html += `<a class="active" data-classId="${parentId}" href="javascript:void(0);">全部</a>`;
			if (_this.parent[index - 1].children.length > 0) {
				$(".scroll-view-two").css({ "width": 9999 }); //初始化长度
				$.each(_this.parent[index - 1].children, function (index, item) {
					html += `<a data-classId="${item.Id}" href="javascript:void(0);" class="lomo-classListTwo">${item.ClassName}</a>`
				})
				$(".scroll-view-two").empty();
				html = '<div class="type classify-nav-two">' + html + '</div>'
				$(".scroll-view-two").html(html);

				if (curCls.indexOf('active') != -1) {
					$(".leaveltwo-nav-box").toggle();
				} else {
					$(".leaveltwo-nav-box").show();
				}
				$(".classify-nav-two a").each(function () { //计算菜单长度
					length += parseFloat($(this).css("width").split('px')[0]) + 30;
				});
				if (length > 450) {
					$(".scroll-view-two").css({ "width": 450 });
				} else {
					$(".scroll-view-two").css({ "width": length }); //如果菜单长度小于450px，则让视口长度为菜单长度
				};
			} else {
				$(".leaveltwo-nav-box").hide();
				_this.classId = parentId;
				_this.getGoodsListPageList();
			}
			$(".classify-nav-two").css({ "width": length + "px" });
			var width = parseFloat($(".scroll-view-two").css("width").split("px")[0]);
			$(".leaveltwo-nav-box").css({ 'top': offset.top + 30, 'left': offset.left - width / 2 });
			$(".classify-nav-two a").on("click", function () {
				_this.classId = $(this).attr("data-classId");
				_this.pageIndex = 1;
				_this.getGoodsListPageList();
				$(".leaveltwo-nav-box").hide();
			})
			// })
		},
		//一级菜单滑动
		classSlide: function () {
			var _x = 85;//每次滑动的距离
			var move = 0;
			$(".classify-nav-box .triangle_border_right").on("click", cashier.throttle(function () {
				var x = parseFloat($(".classify-nav").css("marginLeft").split('px')[0]);//当前位置
				var width = parseFloat($(".classify-nav").css("width").split("px")[0]);//总长度
				var viewport = parseFloat($(".classify-nav-box .scroll-view").css("width").split('px')[0]);//可视窗口宽度
				if (width < viewport) { //当菜单长度小于可视宽度时，禁止向右移动
					return false;
				} else {
					if (x - _x - viewport < -width) {
						move = -(width - viewport - 40);
					} else {
						move = x - _x;
					};
					$(".classify-nav").css({ "marginLeft": move });
				};
			}, 150, 200));
			$(".classify-nav-box .triangle_border_left").on("click", function () {
				var x = parseFloat($(".classify-nav").css("marginLeft").split('px')[0]);//当前位置
				if (x + _x > 0) {
					move = 0;
				} else {
					move = x + _x;
				}
				$(".classify-nav").css({ "marginLeft": move })
			});
		},
		//二级菜单滑动
		classTwoSlide: function () {
			var _x = 85;//每次滑动的距离
			var move = 0;
			$(".leaveltwo-nav-box .triangle_border_right").on("click", cashier.throttle(function () {
				var x = parseFloat($(".classify-nav-two").css("marginLeft").split('px')[0]);//当前位置
				var width = parseFloat($(".classify-nav-two").css("width").split("px")[0]);//总长度
				console.log($(".scroll-view-two").css("width"))
				var viewport = parseFloat($(".scroll-view-two").css("width").split('px')[0]);//可视窗口宽度
				if (width < viewport) { //当菜单长度小于可视宽度时，禁止向右移动
					return false;
				} else {
					if (x - _x - viewport < -width) {
						move = -(width - viewport);
					} else {
						move = x - _x;
					};
					$(".classify-nav-two").css({ "marginLeft": move });
				};
			}, 150, 200));
			$(".leaveltwo-nav-box .triangle_border_left").on("click", function () {
				var x = parseFloat($(".classify-nav-two").css("marginLeft").split('px')[0]);//当前位置
				if (x + _x > 0) {
					move = 0;
				} else {
					move = x + _x;
				}
				$(".classify-nav-two").css({ "marginLeft": move })
			});
		},
		//获取产品列表
		getGoodsListPageList: function () {
			var _this = this;
			var param = {
				Page: _this.pageIndex,
				Rows: _this.pageSize,
				MemID: memId,
				Key: _this.key,//扫码时商品条码
				Type: _this.searchType,//1产品 2套餐 3计次 4扫码
				ClassID: _this.classId
			}
			$.http.post(LuckVipsoft.api.GetCashierGoodsListPage, param, user.token, function (res) {
				proPageTotalNum = Math.ceil(accDiv(res.data.total, _this.pageSize));
				var html = '';
				if (res.data.list && res.data.list.length > 0) {
					$.each(res.data.list, function (index, item) {
						var imagesUrl = '', oldPrice = null, data = JSON.stringify(item);
						if (!item.Images) {//不存在产品图时，使用默认图
							imagesUrl = '../../../Theme/images/goodsPic.png'
						} else {
							imagesUrl = user.information.ImageServerPath + item.Images;
						}
						html += `<div class="goods-info" data-obj='${data}' data-stocknum="${item.StockNum}">`
						html += `<div class="goods-info-img"><img src="${imagesUrl}" /></div>`
						if (item.GoodsType == 1) {//普通产品
							html += `<h1>${item.GoodsName}</h1>`
							html += `<span><i class="colorIcon blue">库</i><b>${item.StockNum}</b><del>${oldPrice ? oldPrice : ''}</del><small>¥${item.Price}</small></span>`
						} else if (item.GoodsType == 2) {//服务
							html += `<h1>${item.GoodsName}</h1>`
							html += `<span><i class="colorIcon green">服</i><del>${oldPrice ? oldPrice : ''}</del><small>¥${item.Price}</small></span>`
						} else if (item.GoodsType == 5) {//套餐
							html += `<h1 class="pointer">${item.GoodsName}</h1>`
							html += `<span><i class="colorIcon red">套</i><del>${oldPrice ? oldPrice : ''}</del><small>¥${item.Price}</small></span>`
							html += `<div class="goods-info-box hide"><dl><dt></dt><dd>`
							html += `<table width="100%" class="dataTable">`
							html += `<tr><th>产品编码</th><th>产品内容</th><th>产品单价</th></tr>`
							html += `<tr><td>${item.GoodsCode}</td><td>${backProductName(item.ComboDetail)}</td><td>${item.Price}</td></tr>`
							html += `</table>`
							html += `<div class="info-box-bt"><button type="button" class="submit-bt-clear hide">取消</button>`
							html += `<button type="button" class="submit-bt close-goodsinfo">确认</button></div></dd></dl></div>`
						} else {//计次
							html += `<h1 class="pointer">${item.GoodsName}</h1>`
							html += `<span><i class="colorIcon purple">次</i><del>${oldPrice ? oldPrice : ''}</del><small>¥${item.Price}</small></span>`
							html += `<div class="goods-info-box hide"><dl><dt></dt><dd>`
							html += `<table width="100%" class="dataTable">`
							html += `<tr><th width="20%">产品编码</th><th width="30%">产品名称</th><th width="15%">产品单价 </th><th width="15%">剩余次数</th><th width="20%">过期时间</th></tr>`
							html += `<tr><td>${item.GoodsCode}</td><td>${item.GoodsName}</td><td>${item.Price}</td><td>${item.Number}</td><td>${item.PassDate}</td></tr>`
							html += `</table>`
							html += `<div class="info-box-bt"><button type="button" class="submit-bt-clear hide">取消</button>`
							html += `<button type="button" class="submit-bt close-goodsinfo">确认</button></div></dd></dl></div>`
						}
						//html += `<em>234</em>`
						html += `</div>`;
					})
					$(".goods-list").html(html);
					$(".page-prev,.page-next").removeAttr("disabled");
					if (graph) { $(".goods-info-img").show() } else { $(".goods-info-img").hide() }
					$(".goods-info").css({ "width": proboxWidth / X - 46 + "px" });

					$(".close-goodsinfo").on("click", function () {
						$(".goods-info-box").hide();
					})
					$(".goods-info h1").on("click", function () {
						var childDom = $(this).siblings('.goods-info-box');
						var offsetLeft = $(this).parents(".goods-info").offset().left;
						var offsetTop = $(this).parents(".goods-info").offset().top;

						if (childDom) {
							$('.goods-info-box').hide();
							childDom.show();
						}
						if (offsetLeft >= proboxWidth) {
							$(".goods-info-box").css("right", "10px");
							$(".goods-info-box dl dt").css({ "left": "auto", "right": "20px" })
						} else {
							$(".goods-info-box").css("right", "auto");
							$(".goods-info-box dl dt").css({ "left": "20px", "right": "auto" })
						}
						if (proboxHeight - offsetTop <= 202) {
							$(".goods-info-box").css("bottom", "10px");
						} else {
							$(".goods-info-box").css("bottom", "auto");
						}
					})
				} else {
					$(".goods-list").html('');
					$(".page-prev,.page-next").attr({ "disabled": "disabled" });
				}
				$(".goods-page .numb").html(`${_this.pageIndex}/${proPageTotalNum}`)
			})
			function backProductName(obj) {
				var ary = [];
				$.each(obj, function (index, item) {
					ary.push(item.GoodsName)
				})
				return ary.join("+")
			}
		},
		//查询选择会员
		searchMemCard: function () {
			var _this = this;
			$("#search").on("click", function (e) {
				e.preventDefault()
				var value = $("#barCode").val();
				if (!value.match(/^\s*$/)) {
					var param = {
						SearchCriteria: value,
						Type: 0
					}
					$.http.post(LuckVipsoft.api.SearchMemCardList, param, user.token, function (res) {
						layer.msg(res.msg)
						if (res.status == 1) {
							if (res.data.length == 1) {
								http.cashierEnd.seleMembers(res.data[0], user.information.ImageServerPath, '.lomo-mian-left .vipInfo')
								member = res.data[0];
								memId = res.data[0].Id;
								oPayCompose.changeMember(member)
								pageMethod.getShopActivity()
								$(".timescount").show();
								$(".lomo-order").css({ "top": "84px", "margin-top": "11px" });
								var param = {
									Page:1,
									Rows:10000,
									MemID:member.Id,
									ConponCode:"",
									UseType:"2",
								}
								$.http.post(LuckVipsoft.api.GetMemConponList, param, user.token, function (res) {
									coupoonListAry = res.data;
								})
							} else {
								layer.open({
									type: 1,
									id: "searchMemCard",
									title: '会员搜索',
									closeBtn: 1,
									shadeClose: false,
									shade: 0.3,
									maxmin: false,//禁用最大化，最小化按钮
									resize: false,//禁用调整大小
									area: ['90%', '80%'],
									btn: ['确认', '清除'],
									skin: "lomo-ordinary",
									btnAlign: "r",
									content: $("#lomo-members-search"),
									yes: function (index, layero) {
										var $searchMem = $('.lomo-members-search');
										var $tr = $searchMem.find('#memList').find('tr');
										if ($tr.length > 0) {
											$tr.each(function () {
												if ($(this).hasClass('lomo-mem-list')) {
													var _index = $(this).index()
													http.cashierEnd.seleMembers(res.data[_index], user.information.ImageServerPath, '.lomo-mian-left .vipInfo')
													member = res.data[_index];
													memId = res.data[_index].Id;
													oPayCompose.changeMember(member)
													pageMethod.getShopActivity()
													$(".lomo-order").css({ "top": "84px", "margin-top": "11px" });

													var param = {
														Page:1,
														Rows:100,
														MemID:member.Id,
														ConponCode:"",
														UseType:"2",
													}
													$.http.post(LuckVipsoft.api.GetMemConponList, param, user.token, function (res) {
														coupoonListAry = res.data;
													})
												}
											});
											$(".timescount").show();
											layer.msg('操作成功')
											layer.close(index)
										} else {
											layer.msg(LuckVipsoft.lan.ER0022)
										}
									},
									btn2: function (index, layero) {
										var $searchMem = $('.lomo-members-search');
										$searchMem.find('#memList').html('');
										return false
									},
									success: function (layero, index) {
										var $searchMem = $('.lomo-members-search');
										var html = '';
										for (i = 0; i < res.data.length; i++) {
											if (i == 0) {
												html += '<tr class="lomo-mem-list">';
											} else {
												html += '<tr >';
											}
											html += '<td>' + res.data[i].CardID + '</td>';
											html += '<td>' + res.data[i].CardName + '</td>';
											html += '<td>' + res.data[i].Mobile + '</td>';
											html += '<td>' + res.data[i].LevelName + '</td>';
											html += '<td>' + res.data[i].Point + '</td>';
											html += '<td>¥' + res.data[i].RemainingCount + '</td>';
											html += '</tr>';
										};
										$searchMem.find('#memList').html(html);
										$searchMem.find('input').focus().val(value)
										/*搜索 */
										$('.lomo-members-search #search').on('click', function (e) {
											e.preventDefault();
											var _value = $(this).parent().prev().find('input').val()
											if (!value.match(verify.empty[0])) {
												var param = {
													Type: 1,
													SearchCriteria: _value
												}
												$.http.post(LuckVipsoft.api.SearchMemCardList, param, $.session.get('Cashier_Token'), function (res) {
													layer.msg(res.msg)
													if (res.status == 1) {
														var html = '';
														user.data = res.data
														for (i = 0; i < res.data.length; i++) {
															if (i == 0) {
																html += '<tr class="lomo-mem-list">';
															} else {
																html += '<tr >';
															}
															html += '<td>' + res.data[i].CardID + '</td>';
															html += '<td>' + res.data[i].CardName + '</td>';
															html += '<td>' + res.data[i].Mobile + '</td>';
															html += '<td>' + res.data[i].LevelName + '</td>';
															html += '<td>' + res.data[i].Point + '</td>';
															html += '<td>¥' + res.data[i].RemainingCount + '</td>';
															html += '</tr>';
														};
														$searchMem.find('#memList').html(html);
													}
												})
											} else {
												layer.msg(LuckVipsoft.lan.ER0021)
											}
										});

										$('.lomo-members-search #memList').on('click', 'td', function () {
											$(this).parent().addClass('lomo-mem-list').siblings().removeClass('lomo-mem-list')
										});
									},
									end: function () {
										//销毁事件
										$('.lomo-members-search #memList').unbind();
										$('.lomo-members-search #search').unbind();
									}
								})
							}
						}
					})
				}
			});
		},
		//获取店铺优惠活动 (有会员时会返回会员可用)
		getShopActivity: function () {
			var _this = this;
			var param = {
				ActType: 1,	//1-消费返利、2-充值有礼
				MemID: memId,
			}
			$.http.post(LuckVipsoft.api.getActivityList, param, user.token, function (res) {
				if(res.status ==1)
				{
					if (res.data.length > 0) {
						hasShopAcivity = true;
						$(".order-select").html("请选择优惠活动").next().removeClass("gray")
						let html = template("activityTmp", res.data);
						$('.check-box-list').html(html)
						$(".activity-list").hide();

						//选择优惠活动
						$(".order-select").unbind().bind('click', function () {
							//快速收银
							if($(this).hasClass("rechargeActivity")){ 							
								if (hasShopAcivity) {
									$(".rechargeActList").toggle();
								}
								return false
							}
							
							//普通商品消费
							if (hasShopAcivity) {
								$(".activity-list").toggle();
							}
						})

						//选择项
						$(".check-box-list li").unbind().bind('click', function () {					
							var act = $(this).attr("data-obj");
							//快速收银选项处理						
							if($(this).parent().attr("class").indexOf("rechargeCheckItem")>-1){ 
								console.log('rechargeCheckItem')
								if(oPayCompose.selectChargeActivity(act)){
									$(this).addClass("checked");					
									pageMethod.chargeActivity();
									$(this).parents(".activity-list").hide();
								}		
								else{
									$.luck.error("未达到活动规则")
								}					
								return false
							}

							//商品消费
							let result = oPayCompose.selectActivity(act)  // .chooseActivity(act)
							if (result) {
								$(this).parents(".activity-list").hide();
							}
							else {
								$.luck.error("未达到活动规则")
							}
						})
					} else {
						hasShopAcivity = false;
						$(".order-select").html("暂无优惠活动")
						$(".activity-list").hide();
					}
				}
				else{
					hasShopAcivity = false
					$.luck.error('优惠券获取异常')
				}

			})
		},

		//获取员工分类
		GetStaffClassList: function (resolve, reject) {
			let that = this
			//员工分类
			$.http.post(LuckVipsoft.api.getStaffClassList, {}, user.token, function (res) {
				if (res.status == 1) {
					that.StaffClassList = res.data;
					resolve();
				}
			});
		},
		//获取提成员工
		GetStaffList: function (resolve, reject) {
			let that = this
			//提成员工 StaffType必填0-售卡提成1-快速消费提成2-商品消费提成3-充值充次提成
			$.http.post(LuckVipsoft.api.getStaffList, { StaffType: 2, StaffName: "" }, user.token, function (res) {
				if (res.status == 1) {
					that.StaffList = res.data;
					resolve();
				}
			});
		},

		//选择提成员工
		chooseMembergetCommission: function () {
            var _this = this;
			var html = '';
			let chooseStaff =[]
            //员工树形列表
            if (_this.StaffClassList.length > 0) {
                $.each(_this.StaffClassList, function (index, item) {
                    html += '<div class="layui-collapse">'
                    html += '<div class="layui-colla-item">'
                    html += '<h2 class="layui-colla-title">' + item.ClassName + '</h2>'
                    html += '<div class="layui-colla-content layui-show"><ul class="staff-list">'
                    if (_this.StaffList.length > 0) {
                        $.each(_this.StaffList, function (n, items) {
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

			//单品提成
            $("body").on("click", ".choose-member", function () {
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
                        $(".lomo-tcyg .nameTitle").after(html);
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

		//左侧购物车产品相关弹层
		editShopcarProduct: function () {
			var _this =this
			//左侧菜单详细列表
			$("body").on("click", ".lomo-order .order-list>dl>dd", function () {
				let uuid = $(this).attr('data-uuid')
				let dataMode = $(this).attr('data-mode')
			

				var _left = $(this).offset().left;
				var _top = $(this).offset().top;
				var winHeight = $(window).height();
				var showHeight = $(".lomo-tcyg").height();

				$(".left-arrow-white").css({ "left": `${410}px`, "top": `${_top - 50}px` })
				if (winHeight - _top <= showHeight) {
					$(".lomo-tcyg").css({ "left": `${_left + 400}px`, "bottom": `0`, "top": "auto" })
				} else {
					$(".lomo-tcyg").css({ "left": `${_left + 400}px`, "top": `${_top - 50}px`, "bottom": "auto" })
				}
				$(".left-arrow-white").show();

				let result =oPayCompose.goodsStaffs(uuid)
				console.log(result)
				goodsStaffs	= Object.assign({},result)
				_this.choosedStaffAry = Object.assign([],goodsStaffs.staffs)
			    goodsStaffs.images = (goodsStaffs.images == '' || goodsStaffs.images == undefined) ? '../../../Theme/images/goodsPic.png' : user.information.ImageServerPath + goodsStaffs.images;

				 var html = template('goodsStaffsTmp', goodsStaffs);
				 $('#goodsStaffs').html(html)

				cashier.open(".lomo-tcyg", 'fadeIn', 'fadeOut', ".lomo-mask-left")
			})
		    //确认提成员工选择
		    $("body").on("click", ".staffSubmit", function () {
				var uuid = $(this).parent().attr("data-uuid");
				let customPrice = $(this).parent().parent().find(".change-price").html();
				customPrice = parseFloat(customPrice).toFixed(2)			
				var goodsMode = $(this).parent().attr("data-mode");	
				 if(oPayCompose.changeGoodsStaff(uuid,_this.choosedStaffAry)){
					oPayCompose.changePrice(uuid,customPrice)
				 }
				var box = $(this).parents('.fadeIn');
				cashier.close(box, 'fadeIn', 'fadeOut', '.lomo-mask-left');
			})
			//赠送商品
			$("body").on("click", ".giveGoods", function () {
				var that = $(this);
				var uuid = $(this).parent().attr("data-uuid");
				var goodsMode = $(this).parent().attr("data-mode");
		
				if(goodsMode==4){
					$.luck.error('当前商品不允许赠送')
					return false
				}
				
				$.luck.confirm("是否确认赠送该商品？", function () {
					oPayCompose.changePrice(uuid,'0.00')
					var box = that.parents('.fadeIn');
					cashier.close(box, 'fadeIn', 'fadeOut', '.lomo-mask-left');
				});
			});
			//删除商品
			$("body").on("click", ".deleteGoods", function () {
				var that = $(this);
				var uuid = $(this).parent().attr("data-uuid");
				$.luck.confirm("是否确认删除该商品？", function () {
					oPayCompose.changeItemNum(uuid,0)
					var box = that.parents('.fadeIn');
					cashier.close(box, 'fadeIn', 'fadeOut', '.lomo-mask-left');
				});
			})
			//修改购物车商品价格
			$("body").on("click", ".change-price", function () {
				var dome = $(this);
				var goodsMode = $(this).attr("data-mode");
				if(goodsMode==4)
				{
					$.luck.error('当前商品不允许赠送')
					return false
				}
				luckKeyboard.showSmallkeyboard(dome, function (res) {
					if (!/(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/.test(res)) {
						$.luck.error('金额只能是2位小数')
						return false
					}
					dome.html(res)
				})
			})
		},
		//选择产品到购物车,编辑购物车产品
		checkProductIntoCar: function () {
			var _this = this;
			//加入购物车
			$("body").on("click", ".goods-info", function () {
				var stocknum = $(this).attr("data-stocknum");//库存
				//var oldPrice = '';//产品原价，有会员价时使用
				var chooseData = JSON.parse($(this).attr("data-obj"));
				var res = oPayCompose.selectItem(chooseData)
				if (!res) {
					$.luck.error("产品库存不足")
				}
			});
			$("body").on("input", ".order-change-num", function () {
				var dl = $(this).parent().parent().parent();
				var uuid = $(dl).attr("data-uuid");
				var goodId = $(dl).attr("data-id");
				var stocknum = $(dl).attr("data-stocknum");
				var mode = $(dl).attr("data-mode");

				var num = $(dl).attr("data-num");
				var val = $(this).val();
				if (!/^[0-9]*[1-9][0-9]*$/.test(val)) {
					$(this).val("1");
					val = 1;
				}
				if (stocknum != 0 && Number(val) > stocknum) {
					$(this).val(stocknum);
					val = stocknum;
				}
				let res =oPayCompose.changeItemNum(uuid,val)
				if (!res) {
					$.luck.error("产品库存不足")
				}
			})
			//编辑购物车--增加
			$("body").on("click", ".order-add", function () {
				var dl = $(this).parent().parent();
				var uuid = $(dl).attr("data-uuid");
				var goodId = $(dl).attr("data-id");
				var stocknum = $(dl).attr("data-stocknum");
				var mode = $(dl).attr("data-mode");
				var num = $(dl).attr("data-num");
				console.log(uuid)
				let res = oPayCompose.changeItemNum(uuid,  parseInt(num) + 1)
				if (!res) {
					$.luck.error("产品库存不足")
				}
			});
			//编辑购物车--减少
			$("body").on("click", ".order-reduce", function (){
				var dl = $(this).parent().parent();
				var uuid = $(dl).attr("data-uuid");
				var goodId = $(dl).attr("data-id");
				var stocknum = $(dl).attr("data-stocknum");
				var mode = $(dl).attr("data-mode");
				var num = $(dl).attr("data-num");
				console.log(uuid)
				let res = oPayCompose.changeItemNum(uuid, parseInt(num) - 1)
				if (!res) {
					$.luck.error("产品库存不足")
				}
			});
			//清空购物车
			$("#btnClearCar").on("click", function () {
				oPayCompose.clearShoppingCar()
			});
		},
		//挑起支付页面会员
		goPayCallBack:function()
		{
			let mdata = {}
			$('.pay_item').removeClass('border-red')	
			//会员信息
			if (oPayCompose.chooseMember.Id == undefined) {
				mdata.mid = 0
				//散客默认支付方式
				//oPayCompose.selectPay(sysArgument.SankeDefaultPayment)
				//$('#pay_item_'+sysArgument.SankeDefaultPayment).addClass('border-red');
			}
			else {
				//会员默认支付方式
				//oPayCompose.selectPay(sysArgument.MemberDefaultPayment)
				//$('#pay_item_'+sysArgument.MemberDefaultPayment).addClass('border-red');
				//会员信息
				mdata.mid = oPayCompose.chooseMember.Id
				mdata.cardname = oPayCompose.chooseMember.CardName
				mdata.mobile = oPayCompose.chooseMember.Mobile
				mdata.levelname = oPayCompose.chooseMember.LevelName
				mdata.point = oPayCompose.chooseMember.Point
				mdata.money = oPayCompose.chooseMember.Money
				if (oPayCompose.chooseMember.Avatar == '' || oPayCompose.chooseMember.Avatar == undefined) {
					mdata.avatar = '../../../Theme/images/morentouxiang.svg'
				}
				else {
					mdata.avatar = user.information.ImageServerPath + oPayCompose.chooseMember.Avatar
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
			})
			$("body").find(".cashier-num-b[class='active'] input").focus();
		},
		//挂单，取单，结账，清空
		orderManage: function () {
			var _this = this;
			$("#btnGoPay").on('click', function (e) {
				if(oPayCompose.result.mode==1) //快速消费
				{
					oPayCompose.goChargePay(function(){
						pageMethod.goPayCallBack()
					})
				}
				else //商品消费
				{
					if (oPayCompose.result.goodsNum > 0) {
						oPayCompose.goPay(function () {
							pageMethod.goPayCallBack()
						})
					}
					else {
						$.luck.error('当前购物车没有商品')
					}
				}
			})

			//取单
			$("#btnGetOrder").on('click', function (e) {
				var orderId = null;
				layer.open({
					type: 1,
					id: "getOrder",
					title: '取单',
					closeBtn: 1,
					shadeClose: false,
					shade: 0.3,
					maxmin: false,//禁用最大化，最小化按钮
					resize: false,//禁用调整大小
					area: ['90%', '80%'],
					btn: ['确认', '取消'],
					skin: "lomo-ordinary",
					content: $(".lomo-qd"),
					success: function () {
						postData = {
							"Page":"1",
							"Rows":"10",
							"FilterKey":"",
						}
						$.http.post(LuckVipsoft.api.GetRestingOrderList,postData, user.token, function (res) {
							var html = '';
							if(res.status == 1){
								if(res.data.list.length>0){
									$.each(res.data.list,function(index,item){
										html += '<tr data-id="'+item.Id+'"><td>'+item.BillCode+'</td><td>'+cashier.dateFormat(item.CreateTime)+'</td><td>'+item.CardName+'</td><td>'+item.HandCode+'</td><td>'+item.Remark+'</td></tr>'
									})
									$(".collectOrder tbody").html(html);
									laypage.render({
									    elem: 'collectOrderPage', //容器名称
									    limit: 10,  //每页条数
									    count: res.data.total, //总页数
									    theme: "#41c060",//颜色
									    jump: function (obj, first) {
									        if (!first) {
									            postData.Page = obj.curr;
									            $.http.post(LuckVipsoft.api.GetRestingOrderList, postData, user.token, function (resquest) {
													var html = '';
													$.each(resquest.data.list,function(index,item){
														html += '<tr data-id="'+item.Id+'"><td>'+item.BillCode+'</td><td>'+cashier.dateFormat(item.CreateTime)+'</td><td>'+item.CardName+'</td><td>'+item.HandCode+'</td><td>'+item.Remark+'</td></tr>'
													})
									                $(".collectOrder tbody").html(html);
									            });
									        }
									    },
									});
								}
							}else{
								layer.alert(res.msg, { icon: 2, closeBtn: 0 }, function (index) {
									layer.close(index)
								});
							}
						})
						$("body").on("click",".collectOrder tbody tr",function(){
							orderId = $(this).attr("data-id");
							$(this).addClass("lomo-mem-list").siblings().removeClass("lomo-mem-list");
						})
                    },
                    yes: function (index) {
						//取单
						pageMethod.getRestingOrder(orderId)					
					},
				})
			})

			//挂单
			$("#btnTempOrder").on('click', function (e) {
				if (oPayCompose.result.goodsNum > 0) {
					console.log('oPayCompose.billCode',oPayCompose.billCode)
					if(oPayCompose.billCode==''){
						$("#resting_handCode").val('')
						$("#resting_remark").val('')
						$("#resting_handCode").attr("readonly",false)
					}
					layer.open({
						type: 1,
						id: "makeListOn",
						title: '挂单',
						closeBtn: 1,
						shadeClose: false,
						shade: 0.3,
						maxmin: false,//禁用最大化，最小化按钮
						resize: false,//禁用调整大小
						area: ['500px', 'auto'],
						btn: ['确认', '取消'],
						skin: "lomo-ordinary",
						content: $(".lomo-gd2"),
						yes: function (index) {

							let handCode = $("#resting_handCode").val()
							let remark = $("#resting_remark").val()
							if (!/^[a-zA-Z0-9]{1,20}$/.test(handCode)) {
								$.luck.error('手牌号必须是数字或字母')
								return false
							}
							let postData = oPayCompose.postRestingConsumeData(handCode,remark,oPayCompose.billCode)

							$.http.post(LuckVipsoft.api.RestingConsume,postData, user.token, function (res) {
								if(res.status ==1){
									layer.alert('挂单完成', { icon: 1, closeBtn: 0 }, function (index) {
										//重置页面
										pageMethod.resetPage()
										//打印小票
										//TicketPrint(res2.data, 2);
										layer.closeAll()
									});
								}
								else{
									layer.alert(res.msg, { icon: 2, closeBtn: 0 }, function (index) {
										layer.close(index)
									});
								}
							})
						}
					})
				}
				else {
					$.luck.error('当前购物车没有商品')
				}
			})
		},
		//收银结账相关弹层
		payPopArea: function () {
			var _this = this;
			var curEditMoneyDom = null;
			//整单优惠
			$(".cashier-way .way7").on("click", function () {
				//应收 ，最大金额
				let maxMoney = (oPayCompose.result.amountDiscountMoney - oPayCompose.result.amountActivityMoney).toFixed(2)
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
						let diffVal = $('#single_discount_money').val()
						let val = $('#single_discount_val').val()
						let mode = $('#single_discount_mode').val()
						let dis = math.chain(oPayCompose.result.amountDiscountMoney).subtract(oPayCompose.result.amountActivityMoney).subtract(parseFloat(diffVal)).done().toFixed(2)

						let info = { val: val, mode: mode, money: diffVal }
						oPayCompose.settingModify(dis, info)
						layer.close(index)
					},
					btn2: function () {
					}
				})
			})
			//整单金额输入框
			$("#single_discount_val").on('change', function () {
				let val = $(this).val()
				if (!/(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/.test(val)) {
					$.luck.error('只能输入数字，小数点后只能保留两位');
					$(this).val('');
					return false
				}
				let maxMoney = (oPayCompose.result.amountDiscountMoney - oPayCompose.result.amountActivityMoney).toFixed(2)
				val = parseFloat(val)

				let mode = $('#single_discount_mode').val()
				console.log('mode', mode)

				if (mode == 2) {
					if (val > maxMoney) {
						$('#single_discount_val').val(maxMoney)
						$('#single_discount_money').val('0.00')
						return false
					}
					else {
						let newVal = (maxMoney - val).toFixed(2)
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
					let newVal = (maxMoney * (val / 10)).toFixed(2)
					$('#single_discount_money').val(newVal)
				}
			})

			//取消整单优惠
			$("#single_cancel").on('click', function () {
				$('#single_discount_val').val('0.00')
				$('#single_discount_money').val('0.00')
				oPayCompose.cancelModify()
			})

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
						chooseStaff  = Object.assign([],oPayCompose.result.staffs)
                        $("body").find('.staff-list li').removeAttr("class");
                        $.each( chooseStaff, function (index, item) {
                            $("body").find('.staff-list li[data-id="' + item.StaffId + '"]').toggleClass("active");
                        })
                        tab_staff.reload({
                            data: chooseStaff
						});

						//初始
						var html = '';
						$(".staffname").remove();
						_this.choosedStaffAry = Object.assign([],chooseStaff)
                        $.each(chooseStaff, function (index, item) {
                            html += '<span class="name staffname" data-id="' + item.StaffId + '">' + item.StaffName + '<i class="deletStaff">x</i></span>'
                        })
						$(".lomo-tcyg-add .nameTitle").after(html);

                        element.render();
                    },
					yes: function (index) {
						oPayCompose.settingOrderStaffs(_this.choosedStaffAry)
						console.log('_this.choosedStaffAry',_this.choosedStaffAry)
						layer.close(index)
					},
					btn2: function () {

					}
				})
			})
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
						let remark = $("#pay_remark").val()
						oPayCompose.remark = remark
						layer.close(index)
					},
					btn2: function () {
					}
				})
			})
			$("body").on("click", ".paySelectCoupon", function () {//重新选择优惠券
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
									{type:'checkbox'},
									{ field: 'Title', title: '名称', align: 'center' },
									{ field: 'ConponCode', title: '券号',  align: 'center' },
									{ field: 'ValidType', title: '券类型',  align: 'center' },
									{ field: 'Quota', title: '优惠金额',  align: 'center' },
									{ field: 'WithUseAmount', title: '最低消费',  align: 'center' },
								]
							]
						});
					},
					yes: function (index, layero) {
						console.log('chooseAry',oPayCompose.pageChooseConpon)
						if(oPayCompose.pageChooseConpon.length>0){
							let postData = oPayCompose.postCouponData() //获取优惠券提交数据
							console.log('postData',JSON.stringify(postData))
							$.http.post(LuckVipsoft.api.CalculateConponAmount, postData, user.token, function (res) {
								if(res.status ==1){
								 	if(oPayCompose.settingCoupon(res.data)){
										layer.close(index)
									}
									else{
										$.luck.error('优惠卷计算错误')
									}
								}
								else{
									$.luck.error(res.msg)
								}
							})
						}
						return false
					}
				})
				//var chooseAry = [];
				table.on('checkbox(coupoonList)', function (obj) {
					let paidMoney = parseFloat(oPayCompose.paidMoney())

					var checkStatus = table.checkStatus('coupoonList');
					if (obj.type=="one") {
						if (obj.checked == true) {
							if(obj.data.WithUseAmount >	paidMoney){
								$.luck.error('当前优惠券不满足使用条件');
								$(this).prop("checked",false);
								form.render('checkbox')
								return false
							}else{
								oPayCompose.pageChooseConpon.push(obj.data);
							}
						}else {
							$.each(oPayCompose.pageChooseConpon, function (index, item) {
								if (item.Id == obj.data.Id) {
									oPayCompose.pageChooseConpon.splice(index, 1)
									return
								}
							})
						}
						console.log(oPayCompose.pageChooseConpon)
					}else { // 表示全选
						if (obj.checked == true) {
							var data = checkStatus.data;
							layer.alert(JSON.stringify(data));
						}else {

						}
					}

				})
			})

			//点击结算：微信或支付宝付款时用
			$("body").on("click", "#finishPayBtn", function () {
				if(oPayCompose.validPayMoney()<0){
					console.log('oPayCompose.validPayMoney()',oPayCompose.validPayMoney())
					$.luck.error('付款金额不足,无法完成支付')
					return false
				}

			
				let pwd = $("#pay_pwd").val()
				// let item = Enumerable.From(oPayCompose.payItem).Where(x=>x.code == '003' || x.code == '002' ).FirstOrDefault();	
				// if(pwd==''){
					
				// }
				
				let postUrl =''
				let postData = {}
				let mode = 2			
				if(oPayCompose.result.mode == 1){
					postData = oPayCompose.postChargeData(pwd)
					postUrl = LuckVipsoft.api.QuickConsume
					mode = oPayCompose.result.mode
				}
				else if(oPayCompose.result.mode == 2){			
					postData = oPayCompose.postPayData(pwd)	
					postUrl =LuckVipsoft.api.GoodsConsume
					mode = oPayCompose.result.mode
				}
		
				let item = Enumerable.From(oPayCompose.payItem).Where(x=>x.code == '020' || x.code == '010' ).FirstOrDefault();				
				if(item!=undefined && item.amount >0){							
					//订单安全验证 ->验证密码 或 订单验证	
				
					//支付处理
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
						success: function(layero, index){
							$('#paymentCode').val('')
							$('#onlinePayMoney').html(item.amount)
							if(item.code == '020'){
								$("#onlinePayTitle").html('<img src="../../../Theme/images/tool013.png" /> 支付宝支付')	
							}
							else if(item.code == '010'){
								$("#onlinePayTitle").html('<img src="../../../Theme/images/tool012.png" /> 微信支付')	
							}
							else{
								$("#onlinePayTitle").html('未知支付方式')	
							}
						},
						yes: function (index, layero) {
							if($('#paymentCode').val()==''){
								$.luck.error('请输入付款码')
								return false
							}
							else{
								let payCode= $('#paymentCode').val()								
								let result = onlinePay(item.amount, item.code ,payCode ,user.token).then(
									function(res){
										console.log('res->then',res)
										if(res.status ==1){
											$.http.post2(postUrl, postData , user.token ,function (res2) {
												if(res2.status ==1){
													layer.alert('支付完成', { icon: 1, closeBtn: 0 }, function (index) {										
														//重置页面
														pageMethod.resetPage()
														//打印小票
														//TicketPrint(res2.data, mode);
														layer.closeAll()
													});
												}
												else{
													layer.alert(res2.msg, { icon: 2, closeBtn: 0 }, function (index) {
														layer.close(index)
													});
												}
											})
										}
										else if(res.status == 3){
											//let queryResult = setTimeout(queryPay(outTradeNo,payType,token), 2000);
										}
										else{
											layer.alert(res.return_msg, { icon: 2, closeBtn: 0 }, function (index) {
												layer.close(index)
											});
										}
									}
								)
							}
						},
						btn2: function (index, layero) {
							layer.close(index);
							return false;
						}
					})
				}
				else{				
					$.http.post(postUrl, postData , user.token ,function (res) {
						if(res.status ==1){
							layer.alert('支付完成', { icon: 1, closeBtn: 0 }, function (index) {
								//数据重置
								pageMethod.resetPage()								
								//打印小票
								//TicketPrint(res2.data, mode);
								layer.closeAll()
							});
						}
						else{
							layer.alert(res.msg, { icon: 2, closeBtn: 0 }, function (index) {
								layer.close(index)
							});
						}
					})
					
				}
			})

			//输入框选中
			$("body").on("click", ".cashier-num-b li", function () {
				curEditMoneyDom = $(this);
				curPayCode = $(this).attr('data-code') //选中的支付输入框
				var result = oPayCompose.selectPayInput(curPayCode)
			})

			//金额输入框
			$("body").on("input", ".moneyInput", function (event) {
				
				let val = $(this).val()
				let oldVal = $(this).attr('data-old')

				if (val == '') {
					val = 0
					$(this).val(0)
				}

				if (isNaN(val)) {
					val = 0
					$(this).val(0)
				}
				console.log('val', val)
				if (val.length!= undefined) {
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
			})

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

				let oldVal = $("#pay_input_" + oPayCompose.curPayItem).val()
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
			})

			//快速收银
			$(".wcpsy").on("click", function () {
				layer.open({
					type: 1,
					id: "payBox",
					title: '快速收银',
					closeBtn: 1,
					shadeClose: false,
					shade: 0.3,
					maxmin: false,//禁用最大化，最小化按钮
					resize: false,//禁用调整大小
					area: ['600px', '360px'],
					btn: ['确认', '取消'],
					skin: "lomo-ordinary inherit",
					content: $(".lomo-wcpsy"),
					success: function () {
						$('.activity-list').hide()
						oPayCompose.clearActivity()
						oPayCompose.clearChargeInfo()
						$("#chargeDiscountMoney").val('0.00') 
						$("#chargeMoney").val('0.00') 	
						$("#chargePoint").val('0.00') 								
					},
					yes:function(){
					   let chargeMoney = $("#chargeMoney").val() 	
					   chargeMoney = parseFloat(chargeMoney).toFixed(2)

					   	if (oPayCompose.chargeInfo.amount > 0) {
							oPayCompose.goChargePay(function () {
								let mdata = {}
								$('.pay_item').removeClass('border-red')
		
								//会员信息
								if (oPayCompose.chooseMember.Id == undefined) {
									mdata.mid = 0
									//散客默认支付方式
									//oPayCompose.selectPay(sysArgument.SankeDefaultPayment)
									//$('#pay_item_'+sysArgument.SankeDefaultPayment).addClass('border-red');
								}
								else {
									//会员默认支付方式
									//oPayCompose.selectPay(sysArgument.MemberDefaultPayment)
									//$('#pay_item_'+sysArgument.MemberDefaultPayment).addClass('border-red');
									//会员信息
									mdata.mid = oPayCompose.chooseMember.Id
									mdata.cardname = oPayCompose.chooseMember.CardName
									mdata.mobile = oPayCompose.chooseMember.Mobile
									mdata.levelname = oPayCompose.chooseMember.LevelName
									mdata.point = oPayCompose.chooseMember.Point
									mdata.money = oPayCompose.chooseMember.Money
									if (oPayCompose.chooseMember.Avatar == '' || oPayCompose.chooseMember.Avatar == undefined) {
										mdata.avatar = '../../../Theme/images/morentouxiang.svg'
									}
									else {
										mdata.avatar = user.information.ImageServerPath + oPayCompose.chooseMember.Avatar
									}
								}
		
								let html = template('memberTmp', mdata);
								$('#pb_vipInfo').html(html)
		
								layer.open({
									type: 1,
									id: "orderPay",
									title: '快速收银',
									closeBtn: 1,
									shadeClose: false,
									shade: 0.3,
									maxmin: false,//禁用最大化，最小化按钮
									resize: false,//禁用调整大小
									area: ['90%', '80%'],
									skin: "lomo-ordinary",
									content: $(".lomo-cashier"),
								})
								$("body").find(".cashier-num-b[class='active'] input").focus();
							})
						}
						else {
							$.luck.error('请填写消费金额')
						}
					},
					btn2:function(){
						$('.activity-list').hide()
						oPayCompose.clearActivity()		
					},
					cancel:function(){
						$('.activity-list').hide()
						oPayCompose.clearActivity()		
					}
				})
			})

			//整单金额输入框
			$("#chargeMoney").on('change', function () {
				let val = $(this).val()
				if (!/(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/.test(val)) {
					$.luck.error('只能输入数字，小数点后只能保留两位');
					$(this).val('');
					return false
				}			
				val = parseFloat(val)
				
			   if(oPayCompose.settingChargeMoney(val))
			   {
					$("#chargeDiscountMoney").val(oPayCompose.chargeInfo.discountAmount) 
					$("#chargeMoney").val(oPayCompose.chargeInfo.amount) 
					$("#chargePoint").val(oPayCompose.chargeInfo.point) 
					//活动判断
					pageMethod.chargeActivity()					
			   }
			})
		},
	}
	pageMethod.init();


	//打开员工列表
	$("body").on("click", ".lomo-xztcyg-left .second-title", function () {
		if ($(this).children("ul").hasClass("title-icon")) {
			$(this).children("ul").css({ "height": "0" }).removeClass("title-icon")
			$(this).find(".second-title img").attr('src', "../../../Theme/images/icon09.png");
		} else {
			$(this).children("ul").css({ "height": "auto" }).addClass("title-icon")
			$(this).find(".second-title img").attr('src', "../../../images/icon20.png");
		}
	})


	//计次产品详情
	$(".goods-list h1").click(function (e) {
		let box = $(this).nextAll(".goods-info-box");
		let html = "";
		html += '<tr>'
		html += ' <th width="20%">产品编码</th>'
		html += '<th width="30%">产品名称</th>'
		html += '<th width="15%">产品单价 </th>'
		html += '<th width="15%">剩余次数</th>'
		html += '<th width="20%">过期时间</th>'
		html += '</tr>'
		html += '<tr>'
		html += '<td>465126456151</td>'
		html += '<td>洗发+烫发吹+剪发+美容+养颜套餐</td>'
		html += '<td>2442.00</td>'
		html += '<td>9</td>'
		html += '<td>2018-09-09</td>'
		html += '</tr>'
		box.find("table").html(html)
		cashier.open(box, 'fadeIn', 'fadeOut', maskBody);
	});
	$(".goods-list  .submit-bt-clear").on("click", function () {
		let box = $(this).parents(".goods-info-box")
		cashier.close(box, 'fadeIn', 'fadeOut', maskBody);
	});
	//ESC关闭页面
	$(document).keydown(function (e) {
		if (e.keyCode == 27 && overall) {
			cashier.close(".lomo-esc", 'fadeIn', 'fadeOut', maskBody);
			overall = false;
		}
	});
	//上传头像
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
		if (!verify.uploadimg.test($(this).val())) {
			layer.msg(LuckVipsoft.lan.ER0019);
			return false;
		}
		reader.onload = function () {
			// 通过 reader.result 来访问生成的 DataURL
			var url = reader.result;
			var html = ''
			html += '<div class="lomo-upload-ava">'
			html += '<div class="lomo-upload-ava-title">'
			html += ' <span>上传头像</span>'
			html += '</div>'
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
				title: false,
				closeBtn: 0,
				shadeClose: false,
				shade: 0.3,
				maxmin: false,//禁用最大化，最小化按钮
				resize: false,//禁用调整大小
				area: ['800px', '550px'],
				btn: ['确认', '取消'],
				skin: "lomo-ordinary",
				btnAlign: "c",
				anim: 5,
				content: html,
				yes: function (index, layero) {
					var cas = $('#preview').cropper('getCroppedCanvas');// 获取被裁剪后的canvas
					var base64 = cas.toDataURL('image/jpeg');//转为base64
					var param = {
						Type: 2,
						FileName: file.name,
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
				},
				btn2: function (index, layero) {
					layer.close(index);
					return false;
				}
			})
			$("#preview").attr("src", url);
			$('#preview').cropper({
				aspectRatio: 1 / 1,// 默认比例
				preview: '.lomo-upload-ava-preview',// 预览视图
				guides: true, // 裁剪框的虚线(九宫格)
				autoCropArea: 0.5, // 0-1之间的数值，定义自动剪裁区域的大小，默认0.8
				movable: false, // 是否允许移动图片
				dragMode: false, // 是否允许移除当前的剪裁框，并通过拖动来新建一个剪裁框区域
				movable: true, // 是否允许移动剪裁框
				resizable: true, // 是否允许改变裁剪框的大小
				zoomable: false, // 是否允许缩放图片大小
				mouseWheelZoom: false, // 是否允许通过鼠标滚轮来缩放图片
				touchDragZoom: true, // 是否允许通过触摸移动来缩放图片
				rotatable: true, // 是否允许旋转图片
				background: true, //是否在容器上显示网格背景。
				modal: true, //是否在剪裁框上显示黑色的模态窗口
				rotatable: false,//是否允许旋转图片
				highlight: true,//在裁剪框上方显示白色模态
				crop: function (e) {
					// 输出结果数据裁剪图像。
				}
			});

		};
		reader.readAsDataURL(file);
	})
})


