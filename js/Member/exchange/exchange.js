layui.use(['layer', 'jquery', "form", 'table'], function () {
    var layer = layui.layer, $ = layui.$, form = layui.form, table = layui.table;
    var user = {
        token: $.session.get('Cashier_Token') ? $.session.get('Cashier_Token') : null,
        information: $.session.get("Cashier_User") ? $.session.get("Cashier_User") : null,
        staffClass: $.session.get("staffClass") ? $.session.get("staffClass") : null,
        staffInf: $.session.get("staffInf") ? $.session.get("staffInf") : null,
		sysArgument: $.session.get("sysArgument") ? $.session.get("sysArgument") : null,
    }
    var proPageTotalNum = 1;
    var graph = true;          //判断是否开启无图模式
    var member = null;//会员信息
    var proboxHeight = $(".lomo-mian-right").height();
    var proboxWidth = $(".lomo-mian-right").width();
    var X='',Y = Math.floor(proboxHeight/226);

    function initPage() {
        exchange.init();
    }

    var exchange = {
        pageIndex: 1,
        pageSize: 10,
        key: '',//商品条码
		parent: [],//一级菜单
		children: [],//二级菜单
        classId: '',//产品类目Id(一级，二级)
		detailsList:[],//商品详情
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
        init: function () {
            var _this = this;
            _this.initClick();//点击事件
			_this.getGoodsClassList();//产品分类：一级类目
			_this.classSlide();//一级菜单滑动
			_this.classTwoSlide();//二级菜单滑动
            _this.countProductNum();//一屏显示产品
			_this.searchMemCard();//查询会员
			
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
				_this.getGiftInfoPage();
			})
			//选择产品
			$("body").on("click",".goods-info",function(){
				var id=$(this).attr("data-id");//产品ID
				var name=$(this).attr("data-name");//产品名称
				var code=$(this).attr("data-code");//产品编号
				var type=$(this).attr("data-type");//产品类别 1普通产品  2服务
				var price=$(this).attr("data-point");//所需积分
				var stocknum=$(this).attr("data-stocknum");//库存
				
				var details={"GoodsID":id,"GoodsType":type,"GoodsCode":code,"GoodsName":name,"DiscountPrice":price,"Number":1,"TotalMoney":price};
				var flag=0;
				//判断是否存在
				if(_this.detailsList.length>0){
					$.each(_this.detailsList,function(index,item){
						if(item.GoodsID==details.GoodsID){
							flag=1;
							var num=accAdd(item.Number,1);
							if(num>stocknum&&item.GoodsType==1){
								$.luck.error("产品库存不足");
								return false;
							}
							item.Number=num;
							item.TotalMoney=accMul(item.DiscountPrice,num);
							_this.order.TotalMoney=accAdd(_this.order.TotalMoney,item.DiscountPrice);
						
							$("#bTotalPoint").html(_this.order.TotalMoney);
							$(".order-list [data-id='"+item.GoodsID+"']").find(".order-nub").text(num);
							$("#bTotalNum").html(Number($("#bTotalNum").text())+1);
							return false;
						}
					})
				}
				if(_this.detailsList.length==0||flag==0){
				    _this.detailsList.push(details);
				    _this.order.TotalMoney=accAdd(_this.order.TotalMoney,details.DiscountPrice);
				    $("#bTotalPoint").html(_this.order.TotalMoney);
				    var html='';
				    html +='<dl data-id="'+details.GoodsID+'" data-stocknum="'+stocknum+'">';
				    html +='<dt> <span class="order-reduce">-</span> <span class="order-nub">1</span> <span class="order-add">+</span> </dt>';
				    html +='<dd>';
				    if(details.GoodsType==1){
				        html +='<i class="colorIcon blue">库</i>';
				    }
				    if(details.GoodsType==2){
				        html +='<i class="colorIcon green">服</i>';
				    }
				    html +='<div class="order-name">';
				    html +='<h1>'+details.GoodsName+'</h1>';
				    html +='<span>积分: <i>'+details.DiscountPrice+'</i></span>';
				    html +='</div>';
				    html +='</dd>';
				    html +='</dl>';
				    $(".order-list").append(html);
					
				    $("#bTotalNum").html(Number($("#bTotalNum").text())+1);
				}
			});
			//购物车增加数量
			$("body").on("click",".order-add",function(){
				var dl=$(this).parent().parent();
				var goodId=$(dl).attr("data-id");
				var stocknum=$(dl).attr("data-stocknum");
				$.each(_this.detailsList,function(index,item){
					if(item.GoodsID==goodId){
						var num=accAdd(item.Number,1);
						if(num>stocknum&&item.GoodsType==1){
							$.luck.error("产品库存不足");
							return;
						}
						item.Number=num;
						item.TotalMoney=accMul(item.DiscountPrice,num);
						_this.order.TotalMoney=accAdd(_this.order.TotalMoney,item.DiscountPrice);
						
						$("#bTotalPoint").html(_this.order.TotalMoney);
						$(".order-list [data-id='"+item.GoodsID+"']").find(".order-nub").text(num);
						$("#bTotalNum").html(Number($("#bTotalNum").text())+1);
						return;
					}
				})
			});
			//购物车减少数量
			$("body").on("click",".order-reduce",function(){
				var dl=$(this).parent().parent();
				var goodId=$(dl).attr("data-id");
				$.each(_this.detailsList,function(index,item){
					if(item.GoodsID==goodId){
						var num=accSub(item.Number,1);
						
						_this.order.TotalMoney=accSub(_this.order.TotalMoney,item.DiscountPrice);
						$("#bTotalPoint").html(_this.order.TotalMoney);
						if(num==0){
							_this.detailsList.splice(index, 1); 
							$(".order-list dl[data-id=" + item.GoodsID + "]").remove();
							return false;
						}
						item.Number=num;
						item.TotalMoney=accMul(item.DiscountPrice,num);
						$(".order-list [data-id='"+item.GoodsID+"']").find(".order-nub").text(num);
						return false;
					}
				})
				$("#bTotalNum").html(Number($("#bTotalNum").text())-1);
			});
			//清空购物车
			$("#btnClear").on("click",function(){
				_this.detailsList=[];
				_this.order.TotalMoney=0;
				$("#bTotalPoint").html("0");
				$("#bTotalNum").html("0");
				$(".order-list").html("");
			});
			//确认兑换
			$("#btnExchange").on("click",function(){
				if(_this.detailsList==null||_this.detailsList.length<=0){
					$.luck.error("请先选择礼品");
					return false;
				}
				if (member==null) {
					$.luck.error("请先刷会员卡");
					return false;
				}
				if(parseFloat(_this.order.TotalMoney)>parseFloat(member.Point)){
					$.luck.error("该会员卡积分不足");
					return false;
				}
				//余额、积分支付是否启用安全密码
				if(user.sysArgument!=null&&user.sysArgument.IsEnableSecurityPwd==1){
					$.luck.password(function(index,val){
						if(val==""){
							$.luck.error("请输入密码！");
							return false;
						}
						_this.saveRedeemGift(val);
					})
				}else{
					_this.saveRedeemGift("");
				}
			})
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
					area: ['850px','700px'],//850px,700px
					skin: "lomo-ordinary",
					content: '../../../Areas/Model/Home/addMember.html',
					success: function (layero, index) {
						this.enterEsc = function (event) {
							if (event.keyCode === 27) {
								layer.closeAll();
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
            this.pageSize = X*Y;
            this.getGiftInfoPage();
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
						_this.getGiftInfoPage();
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
				_this.getGiftInfoPage();
			}
			$(".classify-nav-two").css({ "width": length + "px" });
			var width = parseFloat($(".scroll-view-two").css("width").split("px")[0]);
			$(".leaveltwo-nav-box").css({ 'top': offset.top + 30, 'left': offset.left  - width/2 });
			$(".classify-nav-two a").on("click", function () {
				_this.classId = $(this).attr("data-classId");
				_this.pageIndex = 1;
				_this.getGiftInfoPage();
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
		//获取礼品列表
        getGiftInfoPage:function () {
            var _this = this;
            var param = {
                Page: _this.pageIndex,
                Rows: _this.pageSize,
                Key: _this.key,//扫码时商品条码/简码/名称
                ClassID: _this.classId
            }
            $.http.post(LuckVipsoft.api.GetGiftInfoPage, param, user.token,function(res){
                proPageTotalNum = Math.ceil(accDiv(res.data.total,_this.pageSize));
                var html = '';
                if(res.data.list&&res.data.list.length>0){
                    $.each(res.data.list,function(index,item){
						
                        html += `<div class="goods-info" data-id="${item.Id}" data-name="${item.GoodsName}" data-code="${item.GoodsCode}" data-type="${item.GoodsType}" data-point="${item.ExchangePoint}" data-stocknum="${item.StockNum}">`
                        if(item.Images==null||item.Images==""){
                            html += `<div class="goods-info-img"><img src="../../../Theme/images/lipin.png" /></div>`
                        }else{
                            html += `<div class="goods-info-img"><img src="${user.information.ImageServerPath}${item.Images}" /></div>`
                        }
                        if(item.GoodsType==1){//普通产品
                            html += `<h1>${item.GoodsName}</h1>`
                            html += `<span><i class="colorIcon blue">库</i><b>${item.StockNum}</b><small>${item.ExchangePoint}</small></span>`
						}else if(item.GoodsType==2){//服务
							html += `<h1>${item.GoodsName}</h1>`
							html += `<span><i class="colorIcon green">服</i><small>${item.ExchangePoint}</small></span>`
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
			})
		},
		//查询选择会员
		searchMemCard:function(){
			$("#search").on("click", function (e) {
				e.preventDefault()
			    var value = $("#barCode").val();
			    if (!value.match(/^\s*$/)) {
			        var param = {
			            Key: value,
			            SearchCriteria: 0
			        }
			        $.http.post(LuckVipsoft.api.SearchMemCardList, param, user.token, function (res) {
			            if (res.status == 1) {
			                if (res.data.length == 1) {
			                    http.cashierEnd.seleMembers(res.data[0], user.information.ImageServerPath, '.lomo-mian-left .vipInfo')
								member=res.data[0];
			                    $(".timescount").show();
			                    $(".lomo-order").css({"top":"84px","margin-top":"11px"});
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
										            console.log(res.data[_index])
										            http.cashierEnd.seleMembers(res.data[_index], user.information.ImageServerPath, '.lomo-mian-left .vipInfo')
													
													member = res.data[_index];
													$(".lomo-order").css({"top":"84px","margin-top":"11px"});
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
			});
		},
		//积分兑换提交订单
		saveRedeemGift:function (password) {
			var _this=this;
			_this.order.MemID=member.Id;
			_this.order.MemberPwd=password;
			_this.order.DetailsJson=JSON.stringify(_this.detailsList);
			$.http.post(LuckVipsoft.api.RedeemGift, _this.order, user.token,function(res){
				 if(res.status==1){
					 console.log(res.data);//小票信息
					 $.luck.success(function(){
						layer.closeAll();
						location.reload();
					 });
				 }else{
					 $.luck.error(res.msg);
				 }
			})
		}
	}

    initPage();


})