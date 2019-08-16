var pageMethod ={}
layui.use(['layer', 'element', 'jquery', "form", 'table'], function () {
	var layer = layui.layer, element = layui.element, $ = layui.$, form = layui.form, table = layui.table;
    var user = {
        token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
        information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
        staffClass: $.session.get("staffClass") ? $.session.get("staffClass") : null,
        staffInf: $.session.get("staffInf") ? $.session.get("staffInf") : null,
    	sysArgument: $.session.get("sysArgument") ? $.session.get("sysArgument") : null,
	}

	
	var sysArgument = $.session.get('Cashier_User').SysArguments
	var oShoppingCompose = new shoppingCompose(sysArgument)

	//计算完成后回调，页面执行渲染
	oShoppingCompose.processCallback = function () {
		//活动勾选状态
		$('.act_item').removeClass('checked')
		let actHtml = ''
		if (oShoppingCompose.chooseBirthdayActivity.Id != undefined) {
			actHtml += '<i class="shopAct">' + oShoppingCompose.chooseBirthdayActivity.ActName + '</i>'
			$('.act_' + oShoppingCompose.chooseBirthdayActivity.Id).addClass('checked')
		}

		if (oShoppingCompose.chooseActivity.Id != undefined) {		
			actHtml += '<i class="shopAct">' + oShoppingCompose.chooseActivity.ActName + '</i>'
			$('.act_' + oShoppingCompose.chooseActivity.Id).addClass('checked')
		}

		if (actHtml == '') {
			if (hasShopAcivity) {
				$(".consumeActivity").html('请选择优惠活动')
			}
			else {
				$(".consumeActivity").html('暂无优惠活动')
			}
		}
		else {
			$(".consumeActivity").html(actHtml)
		}

		//购物车
		let html = template('goodsTmp', oShoppingCompose.result.goods);
		$('.order-list').html(html)

		//金额面板
		let dataResult = {
			num: oShoppingCompose.result.goodsNum,
			point: (oShoppingCompose.result.amountPoint - 0).toFixed(2),
			cutPrice: (oShoppingCompose.result.amountDiscountMoney - 0).toFixed(2),
			price: (oShoppingCompose.result.amountMoney - 0).toFixed(2),
			activityPrice: (oShoppingCompose.result.amountActivityMoney).toFixed(2),
		}
		let html2 = template('goodsAmountTmp', dataResult);
		$('.order-Pay').html(html2)
	}


	var member = null;//选择的会员信息
	var proPageTotalNum = 1;
	var maskBody = ".lomo-mask-body";
	var graph = true;          //判断是否开启无图模式
	var keySwitch = true;    //小、全键盘
	var overall = false; //需要esc关闭的界面是否打开
	var hasShopAcivity = false;//是否有店铺活动
	var hasTopUpAcivity = false;//是否有充值有礼活动
	var maskCashier = ".lomo-mask-cashier";
	var memId = '';//会员ID
	var proboxHeight = $(".lomo-mian-right").height();
	var proboxWidth = $(".lomo-mian-right").width();
	var X = '', Y = Math.floor(proboxHeight / 226);
	
	var staffMode = 1 //购物车提成员工类型

	pageMethod={
		StaffClassList: [],//员工分类
		StaffList: [],//提成员工
		pageIndex: 1,
		pageSize: 10,
		key: '',//商品条码
		searchType: 1,//1产品 2套餐 3计次 4扫码
		classId: '',//产品类目Id(一级，二级)
		detailsList:[],//购物车内产品列表
		parent: [],//一级菜单
		children: [],//二级菜单		
		choosedStaffAry: [],//商品提成员工信息
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

			pageMethod.chooseMembergetCommission()
			return true
		},
		//选会员
		changeMember:function(member){		
			if(member.Id!=undefined){
				http.cashierEnd.RechargeSetMembers(member, user.information.ImageServerPath, '.lomo-mian-left .vipInfo')		
				memId = member.Id;		
				oShoppingCompose.changeMember(member)
				pageMethod.getShopActivity()
				$(".timescount").show();
				$(".lomo-order").css({"top":"110px","margin-top":"11px"});			
			}
			else{
				oShoppingCompose.changeMember({})
			}
		},
		//清除页面会员信息
		removeChooseMember: function (){
			shopMemberActAry = [];
			member = null;
			http.cashierEnd.delMembers('.lomo-mian-left .vipInfo', 'member');		
			$(".timescount").hide();
			$(".lomo-order").css({ "top": "0", "margin-top": "0" });
			oShoppingCompose.changeMember({},'')
			memId = ''
			pageMethod.getShopActivity()
		},
		resetPage:function(){
			//pageMethod.getGoodsListPageList()
			pageMethod.GetRechargeCountGoodsListPage(0);
			pageMethod.removeChooseMember()
			oShoppingCompose.clearShoppingCar()
		},
		//快速收银活动变化
		topUpActivity:function(){
			//活动判断
			$('.act_item').removeClass('checked')
			let actHtml = ''
			if (oPayCompose.chooseBirthdayActivity.Id != undefined) {
				actHtml += '<i class="shopAct">' + oPayCompose.chooseBirthdayActivity.ActName + '</i>'
				$('.act_' + oPayCompose.chooseBirthdayActivity.Id).addClass('checked')
			}

			if (oPayCompose.chooseActivity.Id != undefined) {			
				actHtml += '<i class="shopAct">' + oPayCompose.chooseActivity.ActName + '</i>'
				$('.act_' + oPayCompose.chooseActivity.Id).addClass('checked')
			}
			console.log('actHtml',actHtml ,oPayCompose.topUpInfo)

			if (actHtml == '') {
				if (hasTopUpAcivity) {
					$(".topUpActivity").html('请选择优惠活动')
				}
				else {
					$(".topUpActivity").html('暂无优惠活动')
				}
			}
			else {
				$(".topUpActivity").html(actHtml)
			}
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
			_this.initStaffList();	

			$("#goPay").on('click', function () {
				if (oShoppingCompose.result.goodsNum > 0) {
					if(oShoppingCompose.chooseMember.Id ==undefined){
						$.luck.error('请选择一个会员')
						return false
					}
					console.log('oPayCompose.result',oShoppingCompose.result ,oShoppingCompose.chooseMember)					
					//挑起父窗口支付页面		
					oShoppingCompose.result.mode = 12 	//订单类型
					oShoppingCompose.result.shopId = user.information.ShopID //店铺号
					oShoppingCompose.result.staffMode = 3	//3->充值充次
					window.parent.callPay(oShoppingCompose.chooseMember,oShoppingCompose.result)
				}
				else {
					$.luck.error('当前购物车没有商品')
				}
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
			/*清除获取的会员*/
			$("body").on("click", '.vip-delete img', function (e) {			
				//oShoppingCompose.clearShoppingCar()				
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
						//清除活动
						// oPayCompose.clearActivity()
						// //清除结构
						// oPayCompose.clearTopUpInfo()
						// //获取充值有礼
						// pageMethod.getTopUpActivity()
						oShoppingCompose.clearActivity()	

						$("#topUpGiftMoney").val('0.00') 
						$("#topUpMoney").val('0.00') 	
						$("#topUpPoint").val('0.00') 	
					},
					yes:function(){
						let chargeMoney = $("#chargeMoney").val()
						if(chargeMoney>0)
						{
							
						}
						oShoppingCompose.result.mode = 11
						window.parent.callPay(oShoppingCompose.chooseMember,oShoppingCompose.result,staffMode)
						// chargeMoney = parseFloat(chargeMoney).toFixed(2)
						// if (oPayCompose.chargeInfo.amount > 0) {
						// 	 oPayCompose.goPayTopUp(function () {
						// 		 pageMethod.goPayCallBack()
						// 	 })
						//  }
						//  else {
						// 	 $.luck.error('请填写消费金额')
						//  }
					},
					btn2:function(){						
						$('.activity-list').hide()
						oShoppingCompose.clearActivity()		
					},
					cancel:function(){					
						$('.activity-list').hide()
						oShoppingCompose.clearActivity()		
					}
				})				
			})
			//充值金额
			$("#topUpMoney").on('change', function () {	
				let val = $(this).val()
				console.log('val',val)				
				if (!/(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/.test(val)) {
					$.luck.error('只能输入数字，小数点后只能保留两位');
					$(this).val('');
					return false
				}			
		
				if(oPayCompose.settingTopUpMoney(val)){			
				console.log('oPayCompose.topUpInfo',oPayCompose.topUpInfo)		
					$("#topUpGiftMoney").val(oPayCompose.topUpInfo.giftamount) 
					$("#topUpMoney").val(oPayCompose.topUpInfo.amount) 	
					$("#topUpPoint").val(oPayCompose.topUpInfo.point) 
					//渲染
					pageMethod.topUpActivity()					
				}
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
						$(".consumeActivity").html("请选择优惠活动").next().removeClass("gray")
						let html = template("activityTmp", res.data);
						$('.consumeActList').html(html)
						$(".consumeActBox").hide();
					
						//选择优惠活动
						$(".consumeActivity").unbind().bind('click', function () {							
							var curActlist = $(this).parents(".order-page").find(".consumeActBox");						
							if (hasShopAcivity) {								
								curActlist.toggle();
							}
						})

						//选择项
						$(".consumeActList li").unbind().bind('click', function () {					
							var act = $(this).attr("data-obj");
							let result = oShoppingCompose.selectActivity(act)  // .chooseActivity(act)
							if (result) {
								$(this).parents(".consumeActBox").hide();
							}
							else {
								$.luck.error("未达到活动规则")
							}
						})
					} else {
						hasShopAcivity = false;
						$(".consumeActBox").html("暂无优惠活动")
						$(".activity-list").hide();
					}
				}
				else{
					hasShopAcivity = false
					$.luck.error('优惠券获取异常')
				}

			})
		},
		//获取充值活动
		getTopUpActivity:function()
		{
			// var _this = this;
			// var param = {
			// 	ActType: 2,	//1-消费返利、2-充值有礼
			// 	MemID: memId,
			// }
			// $.http.post(LuckVipsoft.api.getActivityList, param, user.token, function (res) {
			// 	if(res.status ==1)
			// 	{
			// 		if (res.data.length > 0) {					
			// 			hasTopUpAcivity = true;
			// 			$(".topUpActivity").html("请选择优惠活动").next().removeClass("gray")
			// 			let html = template("activityTmp", res.data);
			// 			$('.topUpActList').html(html)
			// 			$(".topUpActBox").hide();
					
			// 			//选择优惠活动
			// 			$(".topUpActivity").unbind().bind('click', function () {							
			// 				var curActlist = $(this).parents(".order-page").find(".activity-list");						
			// 				if (hasTopUpAcivity) {								
			// 					curActlist.toggle();
			// 				}
			// 			})

			// 			//选择项
			// 			$(".topUpActList li").unbind().bind('click', function () {					
			// 				var act = $(this).attr("data-obj");
			// 				let result = oPayCompose.selectTopUpActivity(act)  // .chooseActivity(act)
						
			// 				if (result) {				
			// 					//渲染							
			// 					pageMethod.topUpActivity();
			// 					$(this).parents(".topUpActBox").hide();
			// 				}
			// 				else {
			// 					$.luck.error("未达到活动规则")
			// 				}
			// 			})
			// 		} else {
			// 			hasTopUpAcivity = false;
			// 			$(".order-select").html("暂无优惠活动")
			// 			$(".activity-list").hide();
			// 		}
			// 	}
			// 	else{
			// 		hasTopUpAcivity = false
			// 		$.luck.error('优惠券获取异常')
			// 	}
			// })
		},

		//系统默认选中的优惠活动
		checkSystemActivity: function () {			
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

			console.log('staffList',staffList)

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
				let mode = oPayCompose.result.mode
				if(mode ==1){
					//快速消费1
					_this.StaffTree(1)
				}				
				else if(mode ==11 || mode == 12){
					//充值11冲次12
					_this.StaffTree(3)
				}
				else{
					//商品消费
					_this.StaffTree(2)
				}
			
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
				_this.StaffTree(staffMode)
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

				let result =oShoppingCompose.goodsStaffs(uuid)
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
				 if(oShoppingCompose.changeGoodsStaff(uuid,_this.choosedStaffAry)){
					oShoppingCompose.changePrice(uuid,customPrice)
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
				var chooseData = JSON.parse($(this).attr("data-obj"));
				var res = oShoppingCompose.selectItem(chooseData)
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
				let res =oShoppingCompose.changeItemNum(uuid,val)
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
				let res = oShoppingCompose.changeItemNum(uuid,  parseInt(num) + 1)
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
				let res = oShoppingCompose.changeItemNum(uuid, parseInt(num) - 1)
				if (!res) {
					$.luck.error("产品库存不足")
				}
			});
			//清空购物车
			$("#btnClearCar").on("click", function () {
				oShoppingCompose.clearShoppingCar()
			});
		},		
	}
	pageMethod.init();

});
//刷卡获取卡号后续处理
function getIccardNumber(parameter){
	pageMethod.searchMemCard(parameter)
}
//客显
function backGuestShowMoney(money,type){
	ShowCustomerDisplay(money,type)
}
