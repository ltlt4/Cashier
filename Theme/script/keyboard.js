var luckKeyboard = {
		smallKeyBoard:`<div class="small-keyboard index-keyboard minor-keyboard"><dl class="small-keyboard-form"><dd><input style="width:185px" name="" type="text" placeholder="请输入内容" class="input" />
		<a href="javascript:void(0);" class="card-num-up" style="display:none;"></a><button type="button" class="bt key-switch change-big">全键盘</button><span class="keyboard closekeyboard"></span></dd></dl>
		<ul class="small-keyboard-num"><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li><li>8</li><li>9</li><li>0</li><li>00</li><li>.</li><li data-type="back">←</li>
		<li class="keyboard-remove" data-type="clear">清除</li><li class="keyboard-confirm" data-type="confirm">确认</li></ul><em class="topSjx"></em></div>`,
		bigKeyBoard:`<div class="small-keyboard index-keyboard big-keyboard"><dl class="small-keyboard-form"><dd><input name="" type="text" placeholder="请输入内容" class="input" />
		<a href="#" class="card-num-up"></a><button type="button" class="bt key-switch change-small">小键盘</button><span class="keyboard closekeyboard"></span></dd></dl>
		<ul class="small-keyboard-num small-keyboard-l"><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li><li>8</li><li>9</li><li>0</li>
		<li class="l">q</li><li class="l">w</li><li class="l">e</li><li class="l">r</li><li class="l">t</li><li class="l">y</li><li class="l">u</li><li class="l">i</li><li class="l">o</li><li class="l">p</li>
		<li class="small-kb">大写</li><li class="l">a</li><li class="l">s</li><li class="l">d</li><li class="l">f</li><li class="l">g</li><li class="l">h</li><li class="l">j</li><li class="l">k</li><li class="l">l</li>
		<li class="small-kb change-small">小键盘</li><li class="l">z</li><li class="l">x</li><li class="l">c</li><li class="l">v</li><li class="l">b</li><li class="l">n</li><li class="l">m</li><li>.</li><li class="small-kb" data-type="empty">空格</li></ul>
		<ul class="small-keyboard-num small-keyboard-r"><li data-type="back">←</li><li class="keyboard-remove" data-type="clear">清除</li><li class="keyboard-confirm keyboard-confirm-big" data-type="confirm">确认</li></ul><em class="topSjx"></em></div>`,
		showSmallkeyboard:function(e){
			var _this = $(e);
			var X = _this.offset().left;
			var Y = _this.offset().top; 
			var isUppercase = false;
			
			$('.minor-keyboard,.big-keyboard').remove();
			_this.after(luckKeyboard.smallKeyBoard);
			luckKeyboard.keyBoardPosition(X,Y);
			$('body').on("click",".closekeyboard",function(){
				$('.index-keyboard').remove();
			})
			$("body").on("click",".change-big",function(){
				$('.minor-keyboard,.big-keyboard').remove();
				_this.after(luckKeyboard.bigKeyBoard);
				luckKeyboard.keyBoardPosition(X,Y,'big');
				luckKeyboard.clickKeyBoardVal(isUppercase);
			})
			$("body").on("click",".change-small",function(){
				$('.minor-keyboard,.big-keyboard').remove();
				_this.after(luckKeyboard.smallKeyBoard);
				luckKeyboard.keyBoardPosition(X,Y);
				luckKeyboard.clickKeyBoardVal(isUppercase);
			})
			luckKeyboard.clickKeyBoardVal(isUppercase);
		},
		keyBoardPosition:function(X,Y,type){
			var winHeight = window.innerHeight;
			var winWidth = window.innerWidth;
			
			if(winWidth-X<365){
				$(".index-keyboard").css({"right":"0","left":"inherit"});
				$(".topSjx").css({"left":"80%"});
			}
			if(type=="big"&&winWidth-X<=800){
				$(".big-keyboard").css({"left":"50%","margin-left":"-400px"});
				$(".topSjx").css({"left":"50%"});
				if(winWidth-X<=400){
					$(".index-keyboard").css({"right":"0","left":"inherit"});
					$(".topSjx").css({"left":"80%"});
				}
			}
		},
		clickKeyBoardVal:function(isUppercase){
			$(".small-keyboard-num li").on("click",function(){
				var val = $(this).text();
				var setValInput = $(this).parents(".small-keyboard").find(".small-keyboard-form input");
				var hasVal = setValInput.val();
				var type = $(this).attr("data-type");
				if(type=="back"){//后退
					if(hasVal){
						var newVal = hasVal.substring(0,hasVal.length-1);
						setValInput.val(newVal)
					}
				}else if(type=="clear"){//清空
					setValInput.val('');
				}else if(type=="confirm"){//确认
					$(this).parents(".small-keyboard").siblings("input").val(hasVal).focus();
					$('.minor-keyboard,.big-keyboard').remove();
				}else{
					if(val=="大写"){
						isUppercase = true;
						$(".l").each(function(){
							var _this = $(this),val = _this.html();
							_this.html(val.toUpperCase())
						})
						$(this).text("小写");
						return
					}else if(val=="小写"){
						isUppercase = false;
						$(".l").each(function(){
							var _this = $(this),val = _this.html();
							_this.html(val.toLowerCase())
						})
						$(this).text("大写");
						return
					}
					if(type=="empty"){ val = ' ' }
					if(hasVal){ setValInput.val(hasVal+val)
					}else{ setValInput.val(val) }
				}
			})
		}
}