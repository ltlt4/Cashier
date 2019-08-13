
var childPage = layui.use(['layer', 'element', 'jquery', "form", 'table'], function () {
	var layer = layui.layer, element = layui.element, $ = layui.$, form = layui.form, table = layui.table;
    var user = {
        token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
        information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
        staffClass: $.session.get("staffClass") ? $.session.get("staffClass") : null,
        staffInf: $.session.get("staffInf") ? $.session.get("staffInf") : null,
    	sysArgument: $.session.get("sysArgument") ? $.session.get("sysArgument") : null,
	}
	
	var sysArgument = $.session.get('Cashier_User').SysArguments
	var oPayCompose = new payCompose(sysArgument)

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
	var proPageTotalNum = 1;
	var maskBody = ".lomo-mask-body";
	var graph = true;          //判断是否开启无图模式
	var keySwitch = true;    //小、全键盘
	var overall = false; //需要esc关闭的界面是否打开
	var hasShopAcivity = false;//是否有店铺活动
	var maskCashier = ".lomo-mask-cashier";
	var memId = '';//会员ID
	var proboxHeight = $(".lomo-mian-right").height();
	var proboxWidth = $(".lomo-mian-right").width();
	var X = '', Y = Math.floor(proboxHeight / 226);
	var BirthdayValidRule = 3;//1-生日优先、2-系统活动优先、3-系统活动上叠加
	var totleMoney = 0;//当前消费总金额--折前
	var shopActivityAry = [];//当前店铺优惠券活动
	var shopMemberActAry = [];//会员所有店铺优惠
	
	window.pageMethod={
		pageIndex: 1,
		pageSize: 10,
		key: '',//商品条码
		searchType: 1,//1产品 2套餐 3计次 4扫码
		classId: '',//产品类目Id(一级，二级)
		detailsList:[],//购物车内产品列表
		parent: [],//一级菜单
		children: [],//二级菜单		
		choosedStaffAry: [],//商品提成员工信息
		resetPage:function(){
			pageMethod.getGoodsListPageList()
			pageMethod.removeChooseMember()
			oPayCompose.clearShoppingCar()
		},
		//选会员
		changeMember:function(member){		
			if(member.Id!=undefined){
				http.cashierEnd.RechargeSetMembers(member, user.information.ImageServerPath, '.lomo-mian-left .vipInfo')		
				memId = member.Id;
				oPayCompose.changeMember(member)
				pageMethod.getShopActivity()
				$(".timescount").show();
				$(".lomo-order").css({"top":"110px","margin-top":"11px"});			
			}
			else{
				oPayCompose.changeMember({})
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
		init:function () {
			var _this=this;
			_this.initClick();
			_this.getShopActivity();//获取店铺优惠活动
			_this.getGoodsClassList();//产品分类
			_this.classSlide();//一级菜单滑动
			_this.classTwoSlide();//二级菜单滑动
			_this.countProductNum();//一屏显示产品
			_this.storageCardRecharge();//储值卡充值
			$("#search").on("click", function (e) {
				_this.searchMemCard();//查询会员
			})
			_this.editShopcarProduct();//编辑购物车产品
			_this.checkProductIntoCar();//向购物车添加产品
			//_this.chooseMembergetCommission();//提成员工

			//获取提成员工
			new Promise(_this.GetStaffClassList.bind(_this)).then(function (res) {
				return new Promise(_this.GetStaffList.bind(_this))
			}).then(function (res) {
				_this.chooseMembergetCommission()
			});
		},
		//点击事件
		initClick:function () {
			var _this=this;	
			//缩略菜单
			$('.shop-type-button').click(function(){
				$('.shop-type').toggleClass('type-distance')
			});
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
			});
			 //产品翻页 上一页
			$(".page-prev").on("click",function(){
			    if(_this.pageIndex==1){
			        layer.msg("已经是第一页");
			        return;
			    }else{
			        _this.pageIndex = _this.pageIndex-1;
			        _this.countProductNum();
			    }
			});
			//产品翻页 下一页
			$(".page-next").on("click",function(){
			    if(_this.pageIndex==proPageTotalNum){
			        layer.msg("已经是最后一页");
			        return;
			    }else{
			        _this.pageIndex = _this.pageIndex+1;
			        _this.countProductNum();
			    }
			});
			//搜索产品
			$(".search-product").on("click",function(e){
				e.preventDefault()
				var val = $("#searchVal").val();
				_this.key = val;
				_this.GetRechargeCountGoodsListPage();
			})
			//套餐商品,计次项目,返回产品列表
			$(".change-product-nav").on("click", function () {
				var type = $(this).attr("data-type");

				_this.pageIndex = 1;
				if (type == "normal") {//返回产品列表
					_this.searchType = 1;
					$(".classify-nav-box").show();
					$(".back-product").hide();
				} else {
					if (type == "setmeal") {//套餐商品
						_this.searchType = 2;
					} else if(type=="timescount") {//已有计次项目
						if(member==null){
							$.luck.error("请先刷会员卡");
							return false;
						}
						_this.searchType = 3;
					}
					$(".classify-nav-box").hide();
					$(".back-product").show();
				}
				_this.countProductNum();
			})
			//选择优惠活动
			$("body").on("click", ".order-select", function () {
				if (hasShopAcivity) {
					$(this).parents(".order-page").find(".activity-list").toggle();
				}
				if (BirthdayValidRule == 3) {//可叠加
					$("body").on("click", ".check-box-list li.other", function () {
						var state = $(this).attr("class");
						$(".check-box-list li.other").removeClass("checked");
						if (state.indexOf("checked") >= 0) {
							$(".order-select").find("i.shopAct").remove();
							if ($(".order-select").html() == '') {
								$(".order-select").html("请选择优惠活动")
							}
						} else {
							$(this).addClass("checked");
							if ($(".order-select").html().indexOf("请选择优惠活动") >= 0) {
								$(".order-select").html("")
							}
							if ($(".order-select .shopAct").length > 0) {
								$(".order-select .shopAct").html($(this).find('h3').text());
							} else {
								$(".order-select").append("<i class='shopAct'>" + $(this).find('h3').text() + "</i>");
							}
						}
					})
					$("body").on("click", ".check-box-list li.birthday", function () {
						var state = $(this).attr("class");
						$(".check-box-list li.birthday").removeClass("checked");
						if (state.indexOf("checked") >= 0) {
							$(".order-select").find("i.birthAct").remove();
							if ($(".order-select").html() == '') {
								$(".order-select").html("请选择优惠活动")
							}
						} else {
							$(this).addClass("checked");
							if ($(".order-select").html().indexOf("请选择优惠活动") >= 0) {
								$(".order-select").html("")
							}
							if ($(".order-select .birthAct").length > 0) {
								$(".order-select .birthAct").html($(this).find('h3').text());
							} else {
								$(".order-select").append("<i class='birthAct'>" + $(this).find('h3').text() + "</i>");
							}
						}
					})
				} else {//单选
					$("body").on("click", ".check-box-list li", function () {
						$(this).toggleClass("checked").siblings().removeClass("checked");
						var state = $(this).attr("class");
						if (state.indexOf("checked") >= 0) {
							$(".order-select").html('<i>' + $(this).find('h3').text() + '</i>');
						} else {
							$(".order-select").html("请选择优惠活动");
						}
					})
				}
			})
			/*清除获取的会员*/
			$("body").on("click", '.vip-delete img', function (e) {			
				oPayCompose.clearShoppingCar()				
				pageMethod.removeChooseMember()
			})
			$('.shop-type-button').click(function(){
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
		countProductNum:function(){
			var _this=this;
		    if(!graph){
		        Y = Math.floor(proboxHeight/120)
		    }else{
		        Y = Math.floor(proboxHeight/226)
		    }
		    if(proboxWidth>=1352){
		        X=6;
		    }else if(proboxWidth<1352&&proboxWidth>=1230){
		        X=5;
		    }else if(proboxWidth<1230&&proboxWidth>=984){
		        X=4;
		    }else if(proboxWidth<984&&proboxWidth>=738){
		        X=3;
		    }else if(proboxWidth<738&&proboxWidth>=492){
		        X=2;
		    }else if(proboxWidth<492&&proboxWidth>=246){
		        X=1;
		    }
		    _this.pageSize = X*Y;
			if(_this.searchType==1){//产品列表
				_this.GetRechargeCountGoodsListPage(0);
			}else if(_this.searchType==2){//套餐商品
				_this.GetRechargeCountGoodsListPage(1);
			}else if(_this.searchType==3){//已有计次项目
				_this.GetCashierGoodsListPage();
			}
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
						_this.GetRechargeCountGoodsListPage(0);
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
		getGoodsClassTwo: function (parentId, curCls,index, offset) {
			var _this = this;
			var html = '';
			var length = 0
			html += `<a class="active" data-classId="${parentId}" href="javascript:void(0);">全部</a>`;
			if (_this.parent[index - 1].children.length  > 0) {
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
				_this.GetRechargeCountGoodsListPage(0);
			}
			$(".classify-nav-two").css({ "width": length + "px" });
			var width = parseFloat($(".scroll-view-two").css("width").split("px")[0]);
			$(".leaveltwo-nav-box").css({ 'top': offset.top + 30, 'left': offset.left  - width/2 });
			$(".classify-nav-two a").on("click", function () {
				_this.classId = $(this).attr("data-classId");
				_this.pageIndex = 1;
				_this.GetRechargeCountGoodsListPage(0);
				$(".leaveltwo-nav-box").hide();
			})
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
		classTwoSlide:function(){
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
						move = -(width - viewport );
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
		//获取充次商品分页数据
		GetRechargeCountGoodsListPage:function (IsCombo) {
			var _this = this;
			var param = {
				Page: _this.pageIndex,
				Rows: _this.pageSize,
				Key: _this.key,//扫码时商品条码/简码/名称
				ClassID: _this.classId,
				IsCombo:IsCombo//IsCombo 是否为套餐 1是 0 否
			}
			$.http.post(LuckVipsoft.api.GetRechargeCountGoodsListPage, param, user.token,function(res){
				if(res.status==1){
					proPageTotalNum = Math.ceil(accDiv(res.data.total,_this.pageSize));
					var html = '';
					if(res.data.list&&res.data.list.length>0){
						$.each(res.data.list,function(index,item){
							var data=JSON.stringify(item);
							html += `<div class="goods-info" data-obj='${data}' data-combo='${IsCombo}'>`
							if(item.Images==null||item.Images==""){
								html += `<div class="goods-info-img"><img src="../../../Theme/images/goodsPic.png" /></div>`
							}else{
								html += `<div class="goods-info-img"><img src="${user.information.ImageServerPath}${item.Images}" /></div>`
							}
							html += `<h1>${item.GoodsName}</h1>`
							if(IsCombo==1){
								html += `<span><i class="colorIcon red">套</i><small>¥${item.Price}</small></span>`
							}else{
								html += `<span><i class="colorIcon green">服</i><small>¥${item.Price}</small></span>`
							}
							html += `</div>`;
						})
						$(".goods-list").html(html);
						$(".page-prev,.page-next").removeAttr("disabled");
						if (graph) { $(".goods-info-img").show() } else { $(".goods-info-img").hide() }
						$(".goods-info").css({"width":proboxWidth/X-46+"px"});
					}else{
						$(".goods-list").html('');
						$(".page-prev,.page-next").attr({"disabled":"disabled"});
					}
					$(".goods-page .numb").html(`${_this.pageIndex}/${proPageTotalNum}`)
				}else{
					$(".goods-list").html('');
					$(".page-prev,.page-next").attr({"disabled":"disabled"});
				}
				
			})
		},
		//获取会员已有计次项目
		GetCashierGoodsListPage:function () {
			var _this = this;
			var param = {
				Page: _this.pageIndex,
				Rows: _this.pageSize,
				Key: _this.key,//扫码时商品条码/简码/名称
				ClassID: "",
				Type:3,// 3计次（MemID 必传）
				MemID:member.Id
			}
			$.http.post(LuckVipsoft.api.GetCashierGoodsListPage, param, user.token,function(res){
				proPageTotalNum = Math.ceil(accDiv(res.data.total,_this.pageSize));
				var html = '';
				if(res.data.list&&res.data.list.length>0){
					$.each(res.data.list,function(index,item){
						var data=JSON.stringify(item);
						html += `<div class="goods-info" data-obj='${data}'>`
						if(item.Images==null||item.Images==""){
							html += `<div class="goods-info-img"><img src="../../../Theme/images/goodsPic.png" /></div>`
						}else{
							html += `<div class="goods-info-img"><img src="${user.information.ImageServerPath}${item.Images}" /></div>`
						}
						html += `<h1>${item.GoodsName}</h1>`
						var PassDate=cashier.dateFormat(item.PassDate);
						html += `<span><i class="colorIcon purple">次</i><b>${item.StockNum}</b><small>${PassDate==""?"永久有效":PassDate}</small></span>`
						html += `</div>`;
					})
					$(".goods-list").html(html);
					$(".page-prev,.page-next").removeAttr("disabled");
					if (graph) { $(".goods-info-img").show() } else { $(".goods-info-img").hide() }
					$(".goods-info").css({"width":proboxWidth/X-46+"px"});
				}else{
					$(".goods-list").html('');
					$(".page-prev,.page-next").attr({"disabled":"disabled"});
				}
				$(".goods-page .numb").html(`${_this.pageIndex}/${proPageTotalNum}`)
			})
		},
		//查询会员信息
		searchMemCard:function(parameter){
			var value = '';
			if(parameter){
				value = parameter;
				$("#barCode").val(parameter);
			}else{
				value = $("#barCode").val();
			}
			if (!value.match(/^\s*$/)) {
				var param = {
					SearchCriteria: value,
					Type: 1
				}
				$.http.post(LuckVipsoft.api.SearchMemCardList, param, user.token, function (res) {
					if (res.status == 1) {
						if (res.data.length == 1) {
							member = res.data[0];						
							pageMethod.changeMember(member)
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
												member = res.data[_index];
												pageMethod.changeMember(member)											
												return false
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
									return false; 
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
											$.http.post(LuckVipsoft.api.SearchMemCardList, param,user.token, function (res) {
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
											$.luck.error(LuckVipsoft.lan.ER0021)
										}
									});
		
									$('.lomo-members-search #memList').on('click', 'td', function () {
										$(this).parent().addClass('lomo-mem-list').siblings().removeClass('lomo-mem-list')
									});
								},
								end:function(){
									//销毁事件
									$('.lomo-members-search #memList').unbind();
									$('.lomo-members-search #search').unbind();
								}
							})
						}
					}
				})
			}
		},		
		//储值卡充值
		storageCardRecharge:function(){
			var _this = this;
			$("body").on("click","#rechargeCard",function(){
				layer.open({
				    type: 1,
				    id: "cardRecharge",
				    title: '储值卡充值',
				    closeBtn: 1,
				    shadeClose: false,
				    shade: 0.3,
				    maxmin: false,//禁用最大化，最小化按钮
				    resize: false,//禁用调整大小
				    area: ['600px', '400px'],
				    btn: ['结账', '取消'],
				    skin: "lomo-ordinary",
				    content:$(".lomo-wcpsy2"),
					success:function(){
						
					},
					yes:function(){
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
					},
				})
				
			})
			
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
							var curActlist = $(this).parents(".order-page").find(".activity-list");
							curActlist.toggle()
							console.log(curActlist)
							//普通商品消费
							if (hasShopAcivity) {
								console.log('res.data',hasShopAcivity,res.data)			
								$(".activity-list").toggle();
							}
						})

						//选择项
						$(".check-box-list li").unbind().bind('click', function () {					
							var act = $(this).attr("data-obj");



							//快速收银选项处理						
							// if($(this).parent().attr("class").indexOf("rechargeCheckItem")>-1){ 
							// 	console.log('rechargeCheckItem')
							// 	if(oPayCompose.selectChargeActivity(act)){
							// 		$(this).addClass("checked");					
							// 		pageMethod.chargeActivity();
							// 		$(this).parents(".activity-list").hide();
							// 	}		
							// 	else{
							// 		$.luck.error("未达到活动规则")
							// 	}					
							// 	return false
							// }

							//商品消费
							let result = oPayCompose.selectActivity(act)  // .chooseActivity(act)

							console.log('result',result)
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

		//系统默认选中的优惠活动
		checkSystemActivity: function () {
			
		},

		//获取员工分类
		GetStaffClassList: function (resolve, reject) {
			let that = this
			//员工分类
			$.http.post(LuckVipsoft.api.getStaffClassList, {}, user.token, function (res) {
				if (res.status == 1) {
					that.StaffClassList = res.data;
					return resolve();
				}
			});
		},
		//获取提成员工
		GetStaffList: function (resolve, reject) {
			let that = this
			//提成员工 StaffType必填0-售卡提成1-快速消费提成2-商品消费提成3-充值充次提成
			$.http.post(LuckVipsoft.api.getStaffList, { StaffType: 3, StaffName: "" }, user.token, function (res) {
				if (res.status == 1) {
					that.StaffList = res.data;
					return resolve();
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
				console.log('123')
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
		checkProductIntoCar:function(){
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
	}
	pageMethod.init();


	//支付
    var pay = {
        init:function(){
            var _this=this;
            _this.payPopArea();
            _this.initPayItem();
            //立即结账
            $("body").on("click", "#goPay", function () {
				if (oPayCompose.result.goodsNum > 0) {
					oPayCompose.goPayRechargeCount(function () {
						pageMethod.goPayCallBack()
					})
				}
				else {
					$.luck.error('当前购物车没有商品')
				}
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
				title: '充值冲次',
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
        //初始化支付项
        initPayItem: function () {
            var html = ''
            $.each(user.sysArgument.PaymentConfig, function (index, item) {
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
                            var postData = oPayCompose.postCouponData() //获取优惠券提交数据
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
                    var paidMoney = parseFloat(oPayCompose.paidMoney())		
					
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
            });

            //点击结算：微信或支付宝付款时用
            $("body").on("click", "#finishPayBtn", function () {
                if (oPayCompose.validPayMoney() < 0) {
                    console.log('oPayCompose.validPayMoney()', oPayCompose.validPayMoney())
                    $.luck.error('付款金额不足,无法完成支付')
                    return false
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
                        yes: function (index, layero) {
                            if ($('#paymentCode').val() == '') {
                                $.luck.error('请输入付款码')
                                return false
                            }
                            else {
                                var payCode = $('#paymentCode').val()
                                var result = onlinePay(item.amount, item.code, payCode, user.token).then(
									function (res) {
									    console.log('res->then', res)
									    if (res.status == 1) {
									        var postData = oPayCompose.postPayData(pwd, '')
									        $.http.post2(LuckVipsoft.api.VenueConsume, postData, user.token, function (res2) {
									            if (res2.status == 1) {
									                //打印小票
									                TicketPrint(JSON.stringify(res.data), 5);
									                layer.alert('支付完成', { icon: 1, closeBtn: 0 }, function (index) {
									                    venue.countProductNum(1);
									                    venue.clearData();
									                });
									            }
									            else {
									                layer.alert(res2.msg, { icon: 2, closeBtn: 0 }, function (index) {
									                    layer.close(index)
									                });
									            }
									        })
									    }
									    else if (res.status == 3) {
									        //let queryResult = setTimeout(queryPay(outTradeNo,payType,token), 2000); 																		 
									    }
									    else {
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
                else {
                    //格式化代码
                    var postData = oPayCompose.postVenueData(pwd, venue.MainID)
                    debugger
                    $.http.post(LuckVipsoft.api.VenueConsume, postData, user.token, function (res) {
                        if (res.status == 1) {
                            //打印小票
                            TicketPrint(JSON.stringify(res.data), 5);
                            layer.alert('支付完成', { icon: 1, closeBtn: 0 }, function (index) {
                                venue.countProductNum(1);
                                venue.clearData();
                            });
                        }
                        else {
                            layer.alert(res.msg, { icon: 2, closeBtn: 0 }, function (index) {
                                layer.close(index)
                            });
                        }
                    })
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
	}
	
	pay.init();//支付
	
});
//刷卡获取卡号后续处理
function getIccardNumber(parameter){
	pageMethod.searchMemCard(parameter)
}
//客显
function backGuestShowMoney(money,type){
	ShowCustomerDisplay(money,type)
}
