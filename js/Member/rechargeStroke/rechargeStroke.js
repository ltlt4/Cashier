
var childPage = layui.use(['layer', 'element', 'jquery', "form", 'table'], function () {
	var layer = layui.layer, element = layui.element, $ = layui.$, form = layui.form, table = layui.table;
    var user = {
        token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
        information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
        staffClass: $.session.get("staffClass") ? $.session.get("staffClass") : null,
        staffInf: $.session.get("staffInf") ? $.session.get("staffInf") : null,
    	sysArgument: $.session.get("sysArgument") ? $.session.get("sysArgument") : null,
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
		order:{//订单信息
			OrderType:6,//订单类型
			MemberPwd:"",//会员密码
			MemID:"",//会员ID
			TotalMoney:0,//订单总金额
			Remark:"",//备注
			Source:6,//消费来源
			Status:4,//状态 
			LogisticsWay:1,//物流方式
			ConsigneeID:""//收货人ID
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
			_this.chooseMembergetCommission();//提成员工
		},
		//点击事件
		initClick:function () {
			var _this=this;
			/*清除获取的会员*/
			$("body").on("click",'.vip-delete img',function (e) {
				member=null;
			    http.cashierEnd.delMembers('.lomo-mian-left .vipInfo', 'member');
				$(".check-box-list .birthday").remove();
				$(".lomo-order").css({"top":"0","margin-top":"0"});
				$(".classify-nav-box").show();
				$(".timescount").hide();
				$(".back-product").hide();
				_this.pageIndex = 1;
				_this.searchType = 1;
				_this.countProductNum();
			})
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
				shopMemberActAry = [];
				member = null;
				http.cashierEnd.delMembers('.lomo-mian-left .vipInfo', 'member');
				$(".check-box-list .birthday").remove();
				$(".timescount").hide();
				$(".lomo-order").css({ "top": "0", "margin-top": "0" });
				pageMethod.checkSystemActivity();//重新选择系统优惠活动
				_this.rendShopCarAgain();//重新渲染购物车
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
					area: ['850px', '670px'],
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
							html += `<div class="goods-info" data-obj='${data}'>`
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
						html += `<span><i class="colorIcon purple">次</i><b>${item.Number}</b><small>${PassDate==""?"永久有效":PassDate}</small></span>`
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
							http.cashierEnd.RechargeSetMembers(res.data[0], user.information.ImageServerPath, '.lomo-mian-left .vipInfo')
							member=res.data[0];
							$(".timescount").show();
							$(".lomo-order").css({"top":"110px","margin-top":"11px"});
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
												console.log(res.data)
												http.cashierEnd.RechargeSetMembers(res.data[_index], user.information.ImageServerPath, '.lomo-mian-left .vipInfo')
												
												member = res.data[_index];
												$(".lomo-order").css({"top":"110px","margin-top":"11px"});
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
											$.http.post(LuckVipsoft.api.SearchMemCardList, param, $.session.get('Cashier_Token'), function (res) {
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
		//获取店铺优惠活动
		getShopActivity: function () {
			var _this = this;
			var param = {
				ActType: 1,//1-消费返利、2-充值有礼
				MemID: '',
			}
			$.http.post(LuckVipsoft.api.getActivityList, param, user.token, function (res) {
				var html = '';
				console.log(res)
				if (res.data.length > 0) {
					hasShopAcivity = true;
					shopActivityAry = res.data;
					$(".order-select").html("请选择优惠活动").next().removeClass("gray");
					$.each(res.data, function (index, item) {
						html += `<li class="other" data-actId="${item.Id}" data-limit="${item.LimitUsedAmount}"><h3>${item.ActName}</h3><p>${_this.activityRules(item)}</p></li>`
					})
					$(".check-box-list").html(html);
					_this.checkSystemActivity();
				} else {
					$(".activity-list").hide();
				}
			})
		},
		//获取当前会员店铺优惠活动
		getMemberShopActivity: function () {
			var _this = this;
			var param = {
				ActType: 1,//1-消费返利、2-充值有礼、3-新人有礼、4-推荐有礼
				MemID: memId,
			}
			$.http.post(LuckVipsoft.api.getActivityList, param, user.token, function (res) {
				//console.log(res)
				var html = '';
				if (res.data.length > 0) {
					hasShopAcivity = true;
					shopMemberActAry = res.data;
					$(".order-select").html("请选择优惠活动").next().removeClass("gray");
					$.each(res.data, function (index, item) {
						html += `<li class="birthday" data-actId="${item.Id}" data-limit="${item.LimitUsedAmount}"><h3>${item.ActName}</h3><p>${_this.activityRules(item)}</p></li>`
					})
					$(".check-box-list").prepend(html);
					_this.checkSystemActivity();
				}
			})
		},
		//优惠活动规则
		activityRules: function (res) {
			var text = '';
			text += `消费满${res.LimitUsedAmount}`
			if (res.IsReduceAmount == 1) {
				text += `减免${res.ReduceAmount}元`
			}
			if (res.IsGiveMoney == 1) {
				text += `赠送余额${res.GiveMoney}元`
			}
			if (res.IsGivePoint == 1) {
				text += `赠送积分${res.GivePoint}`
			}
			if (res.IsGiveConpon == 1) {//GiveConpon
				$.each(res.GiveConpon, function (index, item) {
					text += `赠送${item.Name}${item.Qty}张`
				})
			}
			return text
		},
		//系统默认选中的优惠活动
		checkSystemActivity: function () {
			var _this = this;
			var actList = $("body").find(".check-box-list li");
			var shopActList = $("body").find(".check-box-list li.other");
			var memActList = $("body").find(".check-box-list li.birthday");
			var memActlimitMoney = [], shopActlimitMoney = [];
		
			if (shopActivityAry == '' && shopMemberActAry == '') {
				hasShopAcivity = false;
				$(".order-select").html("暂无优惠活动").siblings("span").addClass("gray");
				return
			}
			//存在店铺优惠活动
			if (shopActivityAry.length > 0) {
				sortLimitAry(shopActivityAry, shopActlimitMoney);
			}
			//存在会员优惠活动
			if (shopMemberActAry.length > 0) {
				sortLimitAry(shopMemberActAry, memActlimitMoney);
			}
			if (BirthdayValidRule == 1) {//生日优惠活动优先
				bestActivityChoose(1, memActlimitMoney, shopActlimitMoney);
			} else if (BirthdayValidRule == 2) {//店铺系统优惠活动优先
				bestActivityChoose(2, shopActlimitMoney, memActlimitMoney);
			} else if (BirthdayValidRule == 3) {//生日，系统叠加
				//$(".order-select").html('');
				if (memActlimitMoney.length > 0) {
					$.each(memActlimitMoney, function (index, item) {
						if (totleMoney >= item) {
							memActList.removeClass("checked");
							var curCheckDom = $(".check-box-list li.birthday[data-limit=" + item + "]");
							var actName = curCheckDom.find("h3").text();
							curCheckDom.addClass("checked");
							$(".order-select").append('<i class="birthAct">' + actName + '</i>');
							return;
						}
					})
				}
				if (shopActlimitMoney.length > 0) {
					$.each(shopActlimitMoney, function (index, item) {
						if (totleMoney >= item) {
							shopActList.removeClass("checked");
							var curCheckDom = $(".check-box-list li.other[data-limit=" + item + "]");
							var actName = curCheckDom.find("h3").text();
							curCheckDom.addClass("checked");
							$(".order-select").append('<i class="shopAct">' + actName + '</i>');
							return;
						}
					})
				}
			}
			$(".activity-list").hide();
			//满减金额界限降序数组
			function sortLimitAry(ary1, ary2) {
				if (ary1.length > 0) {
					$.each(ary1, function (index, item) {
						ary2.push(item.LimitUsedAmount)
					})
					ary2.sort(function (x, y) {
						return y - x;
					});
				}
			}
			//根据优惠活动使用条件及支付总金额选择最优折扣---单选：生日或则系统
			function bestActivityChoose(type, arry1, arry2) {
				if (arry1.length > 0 && totleMoney >= arry1[arry1.length - 1]) {
					$.each(arry1, function (index, item) {
						if (totleMoney >= item) {
							actList.removeClass("checked");
							if (type == 1) {
								var curCheckDom = $(".check-box-list li.birthday[data-limit=" + item + "]");
							} else if (type == 2) {
								var curCheckDom = $(".check-box-list li.other[data-limit=" + item + "]");
							}
							var actName = curCheckDom.find("h3").text();
							curCheckDom.addClass("checked");
							$(".order-select").html('<i>' + actName + '</i>');
							return;
						}
					})
				} else {
					$.each(arry2, function (index, item) {
						if (totleMoney >= item) {
							actList.removeClass("checked");
							if (type == 1) {
								var curCheckDom = $(".check-box-list li.other[data-limit=" + item + "]");
							} else if (type == 2) {
								var curCheckDom = $(".check-box-list li.birthday[data-limit=" + item + "]");
							}
							var actName = curCheckDom.find("h3").text();
							curCheckDom.addClass("checked");
							$(".order-select").html('<i>' + actName + '</i>');
							return;
						}
					})
				}
			}
		},
		
		//选择提成员工
		chooseMembergetCommission: function () {
			var _this = this;
			var html = '';
			var choosedStaffAry = [];
			//员工树形列表
			if (user.staffClass && user.staffInf) {
				$.each(user.staffClass, function (index, item) {
					html += '<div class="layui-collapse">'
					html += '<div class="layui-colla-item">'
					html += '<h2 class="layui-colla-title">' + item.ClassName + '</h2>'
					html += '<div class="layui-colla-content layui-show"><ul class="staff-list">'
					$.each(user.staffInf, function (n, items) {
						var data=JSON.stringify(item);
						if (items.StaffClassId == item.Id) {
							html += '<li data-id="' + items.Id + '" data-name="' + items.StaffName + '">' + items.StaffName + '</li>'
						}
					})
					html += '</div>'
					html += '</div>'
					html += '</div>'
				})
			}
			$('.lomo-xztcyg .lomo-xztcyg-left').html(html);
			//已选择员工列表
			var grid_conpon = table.render({
				elem: '#List',
				data: choosedStaffAry,
				cellMinWidth: 95,
				cols: [
					[
						{ field: 'StaffName', title: '姓名', align: 'center' },
						{ field: 'CommissionMoney', title: '提成金额', edit: 'text', align: 'center' },
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
			table.on('tool(List)', function(obj){ 
				var layEvent = obj.event;
				if(layEvent=="delete"){
					//layer.confirm('真的删除行么', function(index){
						$.each(choosedStaffAry,function(index,item){
							if(item.StaffId == obj.data.StaffId){
								choosedStaffAry.splice(index, 1)
								return
							}
						})
						$("body").find('.staff-list li[data-id="'+obj.data.StaffId+'"]').removeAttr("class");
						obj.del();
						//layer.close(index);
					//});
				}
			})
			table.on('edit(List)', function(obj){
				$.each(choosedStaffAry,function(index,item){
					if(item.StaffId == obj.data.StaffId){
						choosedStaffAry.splice(index, 1,obj.data)
						return
					}
				})
			});
			$(".choose-member").on("click", function () {
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
				    content:$(".lomo-xztcyg"),
					success:function(){
						grid_conpon.reload();
						element.render();
					},
					yes:function(index){
						layer.close(index)
						console.log(choosedStaffAry)
					},
				})
			})
			$("body").on("click",".staff-list li",function(){
				var id= $(this).attr("data-id"),name=$(this).attr("data-name");
				var newData = {
					"StaffId": id,
					"StaffName": name,
					"CommissionMoney": '',
					"Remark": '',
				}
				$(this).toggleClass("active");
				if($(this).attr("class").indexOf("active")>=0){
					choosedStaffAry.push(newData);
				}else{
					$.each(choosedStaffAry,function(index,item){
						if(item.StaffId == id){
							choosedStaffAry.splice(index, 1)
							return
						}
					})
				}
				grid_conpon.reload({
					data:choosedStaffAry
				});
			})
		},	
		//左侧购物车产品相关弹层
		editShopcarProduct: function () {
			//左侧菜单详细列表
			$("body").on("click",".lomo-order .order-list>dl>dd", function () {
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
				cashier.open(".lomo-tcyg", 'fadeIn', 'fadeOut', ".lomo-mask-left")
			})
			$("body").on("click",".lomo-tcyg .submit-bt-clear", function () {
				$(".left-arrow-white").hide();
				cashier.close(".lomo-tcyg", 'fadeIn', 'fadeOut', ".lomo-mask-left")
			})
			//修改左侧菜单价格
			$("body").eq(1).on("click",".tcyg-goodsInfo-price ul b", function () {
				cashier.open(".lomo-tcyg .small-keyboard", 'fadeIn', 'fadeOut');
			});
		},
		//选择产品到购物车,编辑购物车产品
		checkProductIntoCar:function(){
			var _this = this;
			//加入购物车
			$("body").on("click",".goods-info",function(){
				var oldPrice = '';//产品原价，有会员价时使用
				var chooseData = JSON.parse($(this).attr("data-obj"));
					chooseData.Number = 1;
				if(member){//若已选择会员，重新计算产品价格
					oldPrice = chooseData.Price;
					var newData = _this.countMemberPrice(chooseData,member);
				}else{
					chooseData.curPrice = chooseData.Price;
				}
				var details=chooseData;
				var flag=0;
				//判断是否存在
				if(_this.detailsList.length>0){
					$.each(_this.detailsList,function(index,item){
						if(item.Id==details.Id){
							flag=1;
							var num=accAdd(item.Number,1);
							item.Number=num;
							item.TotalMoney=accMul(item.curPrice,num);
							_this.order.TotalMoney=accAdd(_this.order.TotalMoney,item.curPrice);
						
							$("#bTotalMoney,#actualPay").html(_this.order.TotalMoney);
							$(".order-list [data-id='"+item.Id+"']").find(".order-nub").text(num);
							return false;
						}
					})
				}
				if(_this.detailsList.length==0||flag==0){
					_this.detailsList.push(details);
					_this.order.TotalMoney=accAdd(_this.order.TotalMoney,details.curPrice);
					$("#bTotalMoney,#actualPay").html(_this.order.TotalMoney);
					var html='';
					html +='<dl data-id="'+details.Id+'">';
					html +='<dt> <span class="order-reduce">-</span> <span class="order-nub">1</span> <span class="order-add">+</span> </dt>';
					html +='<dd>';
					if(_this.searchType==2){
						html +='<i class="colorIcon red">套</i>';
					}else if(_this.searchType==1){
						html +='<i class="colorIcon green">服</i>';
					}else{
						html +='<i class="colorIcon purple">次</i>';
					}
					html +='<div class="order-name">';
					html +='<h1>'+details.GoodsName+'</h1>';
					html +='<span>单价: <i>'+details.curPrice+'</i><del>'
					html +=''+oldPrice?oldPrice:''+''
					html +='</del></span></div>';
					html +='</dd>';
					html +='</dl>';
					$(".order-list").append(html);
				}
				
				$("#bTotalNum").html(Number($("#bTotalNum").text())+1);
			});
			//编辑购物车--增加
			$("body").on("click",".order-add",function(){
				var dl=$(this).parent().parent();
				var goodId=$(dl).attr("data-id");
				$.each(_this.detailsList,function(index,item){
					if(item.Id==goodId){
						var num=accAdd(item.Number,1);
						item.Number=num;
						item.TotalMoney=accMul(item.curPrice,num);
						_this.order.TotalMoney=accAdd(_this.order.TotalMoney,item.curPrice);
						
						$("#bTotalMoney,#actualPay").html(_this.order.TotalMoney);
						$(".order-list [data-id='"+item.Id+"']").find(".order-nub").text(num);
						return false;
					}
				})
				$("#bTotalNum").html(Number($("#bTotalNum").text())+1);
			});
			//编辑购物车--减少
			$("body").on("click",".order-reduce",function(){
				var dl=$(this).parent().parent();
				var goodId=$(dl).attr("data-id");
				$.each(_this.detailsList,function(index,item){
					if(item.Id==goodId){
						var num=accSub(item.Number,1);
						
						_this.order.TotalMoney=accSub(_this.order.TotalMoney,item.curPrice);
						$("#bTotalMoney,#actualPay").html(_this.order.TotalMoney);
						if(num==0){
							_this.detailsList.splice(index, 1); 
							$(".order-list dl[data-id=" + item.Id + "]").remove();
							return false;
						}
						item.Number=num;
						item.TotalMoney=accMul(item.curPrice,num);
						$(".order-list [data-id='"+item.Id+"']").find(".order-nub").text(num);
						return false;
					}
				})
				$("#bTotalNum").html(Number($("#bTotalNum").text())-1);
			});
			//清空购物车
			$("#btnClearCar").on("click",function(){
				_this.detailsList=[];
				_this.order.TotalMoney=0;
				$("#bTotalMoney,#actualPay").html("0");
				$("#bTotalNum").html("0");
				$(".order-list").html("");
			});
		},
		//计算产品会员价
		countMemberPrice:function(proInfo,memInfo){
			var _this = this,classDiscount=null;			
			if(memInfo.ClassDiscountRulesList!=null){
				$.each(memInfo.ClassDiscountRulesList,function(index,item){
					if(proInfo.GoodsClass==item.GoodsClassId){//匹配该产品属于会员特殊折扣类别
						classDiscount = item.Discount;
					}
				})
			}
			if(proInfo.Specials==0){//无产品特价
				if(proInfo.IsDiscount==1){//有产品折扣
					if(proInfo.MinDiscount>0){//有产品最低折扣
						if(classDiscount!=null){//有会员特殊折扣
							if(proInfo.MinDiscount>classDiscount){//产品最低折扣与特殊折扣比取最高值
								proInfo.curPrice = proInfo.Price*proInfo.MinDiscount
							}else{
								proInfo.curPrice = proInfo.Price*classDiscount
							}
						}else{//无会员特殊折扣
							if(proInfo.MinDiscount>memInfo.DiscountPercent){//产品最低折扣与会员折扣比取最高值
								proInfo.curPrice = proInfo.Price*proInfo.MinDiscount
							}else{
								proInfo.curPrice = proInfo.Price*memInfo.DiscountPercent
							}
						}
					}else{//无产品最低折扣，直接用会员等级折扣
						proInfo.curPrice = proInfo.Price*memInfo.DiscountPercent
					}
				}else{//无产品折扣
					proInfo.curPrice = proInfo.Price
				}
			}else{//有产品特价
				proInfo.curPrice = proInfo.Specials
			}
			return proInfo;
		},
		//修改会员后，调整购物车内产品
		rendShopCarAgain:function(memInfo){
			var _this = this;
			
			if(_this.detailsList.length>0){
				if(memInfo){
					$.each(_this.detailsList,function(index,item){
						_this.countMemberPrice(item,memInfo)
					})
				}else{
					$.each(_this.detailsList,function(index,item){
						item.curPrice=item.Price;
					})
				}
				var html='',TotalMoney=0;
				$.each(_this.detailsList,function(index,item){
					html +='<dl data-id="'+item.Id+'">';
					html +='<dt> <span class="order-reduce">-</span> <span class="order-nub">1</span> <span class="order-add">+</span> </dt>';
					html +='<dd>';
					if(item.GoodsType==1){
						html +='<i class="colorIcon blue">库</i>';
					}
					if(item.GoodsType==2){
						html +='<i class="colorIcon green">服</i>';
					}
					html +='<div class="order-name">';
					html +='<h1>'+item.GoodsName+'</h1>';
					if(item.curPrice!=item.Price){
						html +='<span>单价: <i>'+item.curPrice+'</i><del>'+item.Price+'</del></span></div>';
					}else{
						html +='<span>单价: <i>'+item.curPrice+'</i></span></div>';
					}
					html +='</dd>';
					html +='</dl>';
					TotalMoney = accAdd(TotalMoney,item.curPrice);
				})
				_this.order.TotalMoney=TotalMoney;
				$("#bTotalMoney,#actualPay").html(TotalMoney);
				
				$(".order-list").html(html);
			}
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
