/*
======================【程序信息及版权宣告】======================
《浩海 O'ceanX播放器》2.0          ( HH Online Player )
==================================================================
程序作者：海浪
海浪信箱：xuhotao@163.com
后期修改：浩良
制作日期：2011年12月24日---2012年月日
我们主页：http://kongjianzhan.126.com
==================================================================
版权声明：
  请尊重我们的劳动结果！！无论您对本程序作任何修改、美化、翻译等工
  作完成后，请您 *必须* 保留此段版权宣告的内容，包括程序原作者的名
  字和网站连结。
  如果您想要以本程序为基础，翻译成其它语言版本，或在因特网上公开发
  表您所修改过的版本时，请您尽量以传送电子邮件的方式，让我们知道！
  （这对于我们是否再继续制作新版本是有非常重要的意义！！）
  请不要将程序原作者的名字改成您自己的名字，然后以另外一个程序名称
  重新命名后在网络上公开发表及散播本程序，因为这是严重的侵权行为。
  另外，假如因为您在使用本程序而令您蒙受数据遗失或损毁，本程序原作
  者均不对其负任何责任。
==================================================================


=====================【目录】=====================
 * 通用的函数
 * 变量定义
 * ----- Class -----
   * 拖拽Class(抽象)
   * 窗口拖拽移动Class
   * 窗口拖拽改变尺寸Class
   * 窗口总控制Class
   * 播放器系统事件Class
   * 滑动条Class
   * 主菜单Class
   * 电子屏Class
   * 播放时间框Class
   * 列表Class
   * 按钮Class
   * 皮肤Class
 * 对话框对象
 * 媒体选单对象
 * 播放对象
 * 播放列表对象
 * 播放器主对象
 * jQuery API
==================================================

================【播放器系统事件】================

系统事件

loadWord		文字JSON加载完成，可用于修改主菜单数据源
loadSkin		皮肤加载完成
unload			离开页面时
windowsInitial	窗口初始化时
playState		播放状态改变时
playStart		播放开始
playEnd			播放结束
reList			播放列表更新
loopState
accessKey
reverseTime
mute

窗口事件

restate			改变窗口状态
posState		改变定位方式
dragStart		拖拽开始
dragEnd			拖拽结束

==================================================
*/



(function (oxConf,$){
	var path = $("script").eq(-1).attr("src").replace(/[^\/]+$/,"");	//用户页面与播放器目录的相对路径

	function loadStyle(href)			//加载css
	{
		$("head")[0].appendChild($("<link />", {
			href: href,
			rel: "stylesheet",
			type: "text/css",
			charset: "utf-8"
		})[0]);
		//奇怪。用jquery的append方法加载link在ie中无效，FF可以，bug?
		//$("head").append($("<link />", { href: path+"style.css", rel: "stylesheet", type: "text/css", charset: "utf-8" }));
	}
	loadStyle(path+"style.css");

	var plugins = {};
	window.$oxplayer = {};		//程序对外的唯一接口
	window.$oxplayer.plugin = function (po)
	{
		po.path = ($("script").eq(-1).attr("src")||"").replace(/[^\/]+$/,"");	//用户页面与插件目录的相对路径
		if(po.style)
			loadStyle(po.path+po.style);
		plugins[po.name] = po;
	};

	window.$oxplayer.options = {
		// 插件的defaults参数
		path: path,
		config: "userdata/config.txt",
		language: "language/{name}.txt",
		data: "userdata/data.txt",
		skin: "skin/{name}/{file}"
	};

	//加载外部 js
	$.getScript(path+"plugins/playerplugins.js",function (){
		$(function (){
			delete window.$oxplayer.plugin;
			oxConf($,$("div.oxplayer:first"),window.$oxplayer.options,plugins);
		});
	});

	path = undefined;
})(function($,oxDiv,options,plugins){
//播放器的代码 开始



/*==================================================*\
					通用的函数
\*==================================================*/

var $f = (function(f)
{
	f.browser = {};		//当前浏览器的类别和版本

	f.Class = function (fu,nd)
	{
		if($.type(nd.extend)==="function")		//Class的继承
		{
			var Bs = new Function();
			Bs.prototype = nd.extend.prototype;
			fu.prototype = new Bs();
			Bs = undefined;
			fu.prototype.Super = nd.extend;
			fu.prototype.constructor = fu;
			delete nd.extend;
		}
		for(var name in nd)						//为Class添置方法
		{
			var t = name.indexOf("static_")==0;
			var obj = t?fu:fu.prototype;
			obj[t?name.replace("static_",""):name] = nd[name];
		}
		return fu;
	};

	f.each = function (t,thisObj,fuu)		//厉遍方法
	{
		if(!fuu)
		{
			fuu = thisObj;
			thisObj = window;
		}
		for(var ii=0, length=t.length; ii<length; ii++)
		{
			var reval = fuu.call(thisObj,t[ii],ii);
			if(reval!==undefined)
				t[ii] = reval;
		}
	};

	f.eachre = function (t,thisObj,fuu)		//厉遍方法(倒着)
	{
		if(!fuu)
		{
			fuu = thisObj;
			thisObj = window;
		}
		for(var ii=t.length-1; ii>=0; ii--)
		{
			var reval = fuu.call(thisObj,t[ii],ii);
			if(reval!==undefined)
				t[ii] = reval;
		}
	};

	f.strReVal = function(str,o)			//将{中的}替换成对像属性的值
	{
		return str.replace(/\{(\w+)\}/g,function (a,b){
			return b in o?o[b]:a;
		});
	};

	f.HTMLEncode = function(str)			//HTML编码
	{
		var eq = {
			"&amp;": /\x26/g ,
			"&lt;": /\x3C/g ,
			"&gt;": /\x3E/g ,
			"&nbsp;": /\x20/g ,
			"<br />": /\n/g
		};
		for (var n in eq)
			str = str.replace(eq[n],n);
		return str;
	};

	f.HTMLEncode2 = function(str)			//HTML编码
	{
		return $("<span></span>").text(str).html();
	};

	f.extension = function(str)			//取url扩展名
	{
		var s = /.+[\.\|](\w+)($|\?)/.exec(str);
		return (s!=null)?s[1]:"~";
	};

	f.protocol = function(str)			//取url协议
	{
		var s = /^([a-z]+)\:\/\//i.exec(str);
		return (s!=null)?s[1]:"~";
	};

	f.naturalNumber = function(s,e)			//自然数数组
	{
		var arr = [];
		for(var i=s; i<=e; ++i)
			arr.push(i);
		return arr;
	};

	f.timeToString = function(z)			//时间显示
	{
		var min = Math.floor(z/60);
		var sec = Math.floor(z%60);
		if(isNaN(min) || z<0)
			return "0:00";
		return min+":"+(sec>9?"":"0")+sec;
	};

	f.getAbsolutePath = function (u)	//转换为绝对URL
	{
		if(/^[a-z]+:\//i.test(u))
			return u;
		var dt = location.href.split("?")[0].split("/");
		dt.length--;
		while(u.indexOf("../")==0)
		{
			u = u.slice(3);
			dt.length--;
		}
		return unescape(dt.join("/")+"/"+u);
	}

	f.JSON = window.JSON ||	{		//JSON
		stringify: function (obj)
		{
			switch(typeof(obj)) {
			  case "number":
			  case "boolean":
				return obj.toString();
			  case "string":
				return '"' + obj.replace(/(\\|\")/g,"\\$1").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/\t/g,"\\t") + '"';
			  case "object":
				if(obj===null)
					return 'null';
				var recursion = arguments.callee;
				if(obj.constructor==Array)
				{
					var era = [];
					for(var i=0, l = obj.length; i < l; ++i)
					{
						var r = recursion(obj[i]);
						if(r!==undefined)
							era.push(r);
					}
					return '['+era.join(",")+']';
				}
				else
				{
					var era = [];
					for(var i in obj)
					{
						var r = recursion(obj[i]);
						if(r!==undefined)
							era.push(recursion(i)+":"+r);
					}
					return '{'+era.join(",")+'}';
				}
			}
		} ,

		parse:	function (str)
		{
			return $.parseJSON(str);
		}
	};

	return f;
})({});


/*==================================================*\
                     变量定义
\*==================================================*/

var windows;			//播放器所用窗口
var config;				//播放器设定JSON数据
var word;				//文字JSON数据


/*==================================================*\
                   拖拽Class(抽象)
\*==================================================*/

var DrawingClass = $f.Class(function(cid,skip)		// **拖拽Class**
{
	this.cid = cid;					//触发事件的对象
	this.docu = this.cid[0].setCapture?this.cid:$(document);			//mousemovem,nmouseup事件绑定的对象
	this.moveing = false;				//是否正在拖动
	this.d = null;						//纪录拖动中的各种数据
	this.passometer = 0;				//计步器
	this.skip = skip || 0;				//跳过事件次数,为了避免只是点一下鼠标就执行了拖动操作
	this.tag = /^(abbr|a|input|button|select|textarea)$/i;			//当鼠标点击的是这些元素则不做拖动操作
	this.cid.mousedown($.proxy(this,"downEvent"));
},{
	downEvent: function (event)
	{
		if(this.moveing)
		{
			this.upEvent(event);
			return;
		}
		if(this.tag.test(event.target.tagName) || event.which!=1 || this.down(event.pageX, event.pageY))
			return;
		event.stopPropagation();
		this.moveing = true;
		this.docu[0].setCapture && this.docu[0].setCapture();
		this.docu.mousemove($.proxy(this,"moveEvent")).mouseup($.proxy(this,"upEvent"));
//		$(document).on("selectstart.ox_noselect", false);
		this.passometer = 0;
		return false;
	} ,

	upEvent: function (event)
	{
		if(!this.moveing) return;
		event.stopPropagation();
//		$(document).off("selectstart.ox_noselect", false);
		this.docu.unbind("mousemove", this.moveEvent).unbind("mouseup", this.upEvent);
		this.docu[0].setCapture && this.docu[0].releaseCapture();
		if(this.passometer>=this.skip)
			this.up(event.pageX, event.pageY);
		this.moveing = false;
		this.d = null;
	} ,

	moveEvent: function (event)
	{
		if(!this.moveing) return;
		event.stopPropagation();
	    this.passometer++;
		if(this.passometer==this.skip)
			this.moveStart();
		if(this.passometer>=this.skip)
			if(this.move(event.pageX, event.pageY))
				this.upEvent(event);
	},

	down: function (){} ,			//抽象方法，要求子类对其重载
	up: function (){} ,				//抽象方法，要求子类对其重载
	move: function (){} ,			//抽象方法，要求子类对其重载
	moveStart: function (){}		//抽象方法，要求子类对其重载
});



/*==================================================*\
                   窗口拖拽移动Class
\*==================================================*/

var DrawingMoveClass = $f.Class(function(t,cid)		// **窗口拖拽移动Class**
{
	this.win = t;
	this.Super(cid,6);		//调用父类的构造函数
},{
	extend: DrawingClass ,

	down: function (x,y)
	{
	    if(this.win.state!=1)
			return true;
		var of = this.win.box.offset();
		var du = $(document);
		this.d = {
			ofx: x - of.left ,
			ofy: y - of.top ,
			minw: du.scrollLeft() ,
			minh: du.scrollTop() ,
			maxw: $(document.body).outerWidth(true) - this.win.box.outerWidth() + du.scrollLeft() ,
			maxh: $(document.body).outerHeight() - this.win.box.outerHeight() + du.scrollTop()
	    };
	} ,

	move: function (x,y)
	{
	    if(this.win.state!=1)
			return true;
	    x -= this.d.ofx;
	    y -= this.d.ofy;
	    x = x<this.d.minw?this.d.minw:(x>this.d.maxw?this.d.maxw:x);
	    y = y<this.d.minh?this.d.minh:(y>this.d.maxh?this.d.maxh:y);
		this.win.box.offset({ left: x, top: y });
	} ,

	up: function ()
	{
		this.win.event.run("dragEnd");
	} ,

	moveStart: function ()
	{
		this.win.event.run("dragStart");
		if(this.win.posState=="relative")
			this.win.rePosState("absolute");
	}
});


/*==================================================*\
                 窗口拖拽改变尺寸Class
\*==================================================*/

var DrawingResizeClass = $f.Class(function(t,cid,minMax)
{
	this.win = t;
	this.Super(cid,6);			//调用父类的构造函数
	this.minMax = minMax;		//拖拽的最小和最大尺寸
},{
	extend: DrawingClass ,

	down: function (x,y)
	{
	    if(this.win.state!=1)
			return true;
		this.d = {
			ofx: this.win.box.width()-x ,
			ofy: this.win.box.height()-y ,
			minw: 100,
			minh: 100,
			maxw: $(document.body).outerWidth(true),
			maxh: $(document.body).outerHeight()
	    };
		$.extend(this.d, this.minMax);
	} ,

	move: function (x,y)
	{
	    if(this.win.state!=1)
			return true;
	    if(this.d.maxw!=0)
		{
			x += this.d.ofx;
			x = x<this.d.minw?this.d.minw:(x>this.d.maxw?this.d.maxw:x);
			this.win.box.css("width",x);
		}
	    if(this.d.maxh!=0)
		{
			y += this.d.ofy;
			y = y<this.d.minh?this.d.minh:(y>this.d.maxh?this.d.maxh:y);
			this.win.box.css("height",y);
		}
	} ,

	up: function ()
	{
		this.win.event.run("dragEnd");
	} ,

	moveStart: function ()
	{
		this.win.event.run("dragStart");
		//if(this.win.posState=="relative")
		//	this.win.rePosState("absolute");
	}
});



/*==================================================*\
                   窗口总控制Class
\*==================================================*/

var WindowClass = $f.Class(function(box)	// **窗口总控制Class**
{
	this.box = box;
	this.co = {};
	this.state = -1;				//0：最小化，1：正常，2：最大化
	this.posState = "";				//定位方式
	this.drag = false;				//是否可以拖拽
	this.initDisplay = false;		//初始显示
	this.initialCss = {};			//窗口的初始设置
	this.maxData = {};				//窗口的最大化前设置
	this.event = new SystemEventClass();
	this.setCo();
},{
	setInitial: function (ini,uo)	//初始设置
	{
		if(ini)
		{
			if(ini.drag)
				uo.drag = /true/.test(ini.drag);
			if(ini.display)
				uo.display = /true|block/.test(ini.display);
			if(ini.style)
			{
				$.extend(uo.css, {position:"relative",left:"auto",top:"auto",right:"auto",bottom:"auto"});
				if(/position\s*\:\s*(absolute|fixed|relative)/.test(ini.style))
					uo.css.position = RegExp.$1;
				ini.style.replace(/(margin(?:-left|-top|-right|-bottom)?|float|left|top|right|bottom|width|height)\s*\:\s*([^,;]+)/ig,function(_,n,v){
					uo.css[n] = $.trim(v);
				});
			}
		}
		this.initialCss = uo.css;
		this.drag = uo.drag;
		this.initDisplay = uo.display;
	} ,

	initial: function ()	//窗口初始化
	{
		this.minKg(this.initDisplay);
		this.reset();
	} ,

	reset: function ()				//窗口恢复原位
	{
		this.reMax();
		this.setPosState(this.initialCss.position);
		this.box.css(this.initialCss);
	} ,

	setPosState: function (g)		//定位方式
	{
		if(g)
		{
			if(this.posState==g) return;
			this.posState = g;
		}
		else
			this.posState = this.posState=="fixed"?"absolute":"fixed";
		this.box.css("position",this.posState);
		this.event.run("posState",this.posState=="fixed");
	} ,

	rePosState: function (g)			//转换定位坐标
	{
		if(!this.drag)
			return word.nounseal;
		this.reMax();
		var z = this.box.offset();
		this.setPosState(g);
		this.box.css({right:"auto",bottom:"auto"});
		this.box.offset(z);
	} ,

	reState: function (g)			//改变窗口状态
	{
		this.state = g;
		this.event.run("restate",g);
	} ,

	max: function ()				//最大化窗口
	{
		if(!this.drag || this.state==2)
			return;
	    var os = this.box[0].style;
	    this.maxData = {
			position:	os.position,
			zIndex:	os.zIndex,
			left:	os.left,
			top:	os.top,
			right:	os.right,
			bottom:	os.bottom,
			width:	os.width,
			height: os.height
		};
		this.box.css({
			position:	"fixed",
			zIndex:	"999",
			left:	"0px",
			top:	"0px",
			right:	"0px",
			bottom:	"0px",
			width:	"100%",
			height: "100%"
		});
		this.reState(2);
	} ,

	reMax: function ()				//从最大化窗口回到正常窗口
	{
		if(this.state!=2)
			return;
		this.box.css(this.maxData);
		this.reState(1);
	} ,

	maxKg: function (g)				//最大化窗口与正常窗口切换
	{
		if(!this.drag)
			return word.nounseal;
		if(g===undefined && this.state==2 || g)
			this.reMax();
		else
			this.max();
	} ,

	min: function ()				//最小化窗口
	{
		if(this.state==0) return;
		this.reMax();
		this.box.hide();
		this.reState(0);
	} ,

	reMin: function ()				//从最小化窗口回到正常窗口
	{
		if(this.state==1) return;
		this.box.show();
		this.reState(1);
	} ,

	minKg: function (g)				//最小化窗口与正常窗口切换
	{
		if(g===undefined && this.state==0 || g)
			this.reMin();
		else
			this.min();
	} ,

	setMove: function (cid)			//设置拖拽移动
	{
		if(this.drag)
			new DrawingMoveClass(this, cid || this.box);
	} ,

	setResize: function (cid,minMax)		//设置拖拽改变大小
	{
		if(this.drag)
			new DrawingResizeClass(this, cid || this.co.resize ,minMax);
	} ,

	setCo: function ()		//设置Co
	{
		var tt = this;
		$("[class*='_wo_']",this.box).each(function (){		//对class查找一次
			var t = $(this);
			tt.co[t.attr("class").match(/_wo_(\w+)/)[1]] = t;
		});
	} ,


	setButton: function ()			//设置窗口控制按钮
	{
		var t = this;
		if(t.co.close)
			t.co.close.data({com:"min",options:this});
		if(t.co.max)
		{
			t.co.max.data({com:"max",options:this});
			this.event.attach("restate",function (v){
				t.co.max.toggleClass("-ox-state2",v==2);
			});
		}
		if(t.co.reset)
			t.co.reset.data({com:"reset",options:this});
		if(t.co.lock)
		{
			t.co.lock.data({com:"lock",options:this});
			this.event.attach("posState",function (v){
				t.co.lock.toggleClass("-ox-state2",v);
			});
		}
	} ,

	toMinSize: function ()			//界面尺寸小于最小尺寸就设置成最小尺寸
	{
	}
});





/*==================================================*\
                 播放器系统事件Class
\*==================================================*/

var SystemEventClass = $f.Class(function()	// **播放器系统事件Class**
{
	this.eveobj = {};
},{
	attach: function (eve,fun)
	{
		if(!this.eveobj[eve])
			this.eveobj[eve] = [];
		this.eveobj[eve].push(fun);
	} ,

	remove: function (eve,fun)
	{
		var o = this.eveobj[eve];
		if(!o)
			return;
		$f.eachre(o,function(ai,ii){
			if(ai==fun)
				o.splice(ii,1);
		});
	} ,

	removeAll: function (eve)
	{
		delete this.eveobj[eve];
	} ,

	run: function (e)		//执行
	{
		var vs = Array.prototype.slice.call(arguments,1);
		var o = this.eveobj[e];
		if(!o)
			return;
		$f.each(o,function(ai){
			ai.apply(null,vs);
		});
	}
});





/*==================================================*\
                     滑动条Class
\*==================================================*/

var SliderClass = $f.Class(function(cid,mf)		// **滑动条Class**
{
	this.Super(cid);		//调用父类的构造函数
	this.jgdiv = cid.children().eq(0);
	this.sbdiv = this.jgdiv.children().eq(0);
	this.mf = mf || {};		//类操作
	this.position = 0;		//滑块位置
},{
	extend: DrawingClass ,

	down: function (x,y)
	{
	    if(this.mf.start && this.mf.start()===false) return true;
		this.move(x,y);
	} ,

	move: function (x,y)
	{
		var d = (x - this.sbdiv.width()/2 - this.cid.offset().left)/this.cid.width();
		this.gotoPosition(d);
		this.mf.move && this.mf.move(this.getPosition());
	} ,

	up: function ()
	{
		this.mf.end && this.mf.end(this.getPosition());
	} ,

	gotoPosition: function (x)
	{
	    this.position = x<0?0:(x>1?1:x);
		this.jgdiv.css("width",Math.round(this.position*10000)/100+"%");
	} ,

	getPosition: function ()		//取滑块位置
	{
		return this.position;
	} ,

	setPosition: function (s)		//设置滑块位置
	{
		if(this.moveing)
			return;
		this.gotoPosition(s);
	}
});






/*==================================================*\
                    主菜单Class
\*==================================================*/


var MenuClass = $f.Class(function(mword,idp)//*********** 主菜单Class
{
	this.idj = idp;					//主菜单对像
	this.hibutt = null;				//看不见的button，用于控制菜单隐藏
	this.hbj = $();					//看不见的button，用于快捷键
	this.tOnt = null;				//子菜单显示Timeout
	this.menudown = false;			//
	this.accessKeyState = true;		//快捷键State
	this.accessKeyList = "";		//快捷键说明列表
	this.accessKeyAlt = ($f.browser.ie || $f.browser.chrome || $f.browser.safari)?"Alt+":$f.browser.firefox?"Shift+Alt+":"";		//快捷键的组合键
	this.idj.html(this.menuHtml(mword));
	this.setopenChilMenu();
	this.setHiddenMenu();
	this.co = this.getmico();
},{
	menuHtml: function (oo)				//处理数据，生成菜单的html
	{
		var html = '<ul>';
		$f.each(oo,this,function (vv,ii)
		{
			if(vv==null)
				html += '<hr />';
			else if(vv.da)
				html += '<li><span class="-ox-h">&#8227;</span><span class="-ox-ds">&#10003;</span>'+vv.na+this.menuHtml(vv.da)+'</li>';
			else
			{
				html += '<li class="_ox_Mi_'+vv.com+'" data-com="'+vv.com+'" data-options="'+vv.options+'"><span class="-ox-ds">&#10003;</span><span>'+vv.na +'</span></li>';

				word.buttonTitle[vv.com] = vv.na.replace("...","") + (vv.key?" ("+this.accessKeyAlt+vv.key+")":"");
				if(vv.key)
				{
					this.accessKeyList += word.buttonTitle[vv.com] + "\n";
					this.hbj=this.hbj.add('<input type="button" data-com="'+vv.com+'" data-options="'+vv.options+'" accesskey="'+vv.key+'" onFocus="this.blur()" />');
				}
			}
		});
		html += '</ul>';
		return html;
	} ,

	getmico: function ()		//对class查找一次
	{
		var co = {};
		$("li[class^='_ox_Mi_']",this.idj).each(function (){		//只对class查找一次，以后就不用查找了
			var t = $(this);
			var n = t.attr("class").match(/_ox_Mi_(\w+)/)[1];
			co[n] = co[n] ? co[n].add(t) : t;
		});
		return co;
	} ,

	setHiddenMenu: function ()
	{
		var t = this;			//闭包中需要的变量
		this.hibutt = $('<input />',{type:"button"}).blur(function (){
			setTimeout(function (){
				if(t.menudown)
				{
					t.menudown = false;
					t.hibutt.focus();
				}
				else
					t.idj.stop(true, true).hide();
			},50);
		}).appendTo(ox.co.hiddeDiv);
		this.idj.mousedown(function(){
			t.menudown = true;
		});
	} ,

	setOpenEventTo: function (idp)
	{
		var t = this;				//闭包中需要的变量
		idp.bind("contextmenu", function (event){
			t.openMenu(event);
			return false;
		});
		idp = undefined;		//清除闭包中不需要的变量
	} ,

	openMenu: function (e)		//打开主菜单
	{
		var w, h, sl, st, dw, dh, x, y, bw, bh;
		w = this.idj.outerWidth();
		h = this.idj.outerHeight();
		sl = $(document).scrollLeft();
		st = $(document).scrollTop();
		dw = $(document.body).outerWidth(true);
		dh = $(document.body).outerHeight();
		if(e instanceof $)
		{
			var of = e.offset();
			x = of.left-sl;
			y = of.top-st;
			bw = e.outerWidth();
			bh = e.outerHeight();
		}
		else
		{
			x = e.pageX-sl;
			y = e.pageY-st;
			bw = 0;
			bh = 0;
		}
		var o = { left:"auto", top:"auto", right:"auto", bottom:"auto"};
		if(x+w < dw)
			o.left = x + "px";
		else if(x-w-w > 0)
			o.right = dw-x-bw + "px";
		else
			o.left = 0 + "px";
		if(y+bh+h < dh)
			o.top = y+bh + "px";
		else if(y-h > 0)
			o.bottom = dh-y + "px";
		else
			o.top = 0 + "px";
		this.idj.find(".-ox-display").removeClass("-ox-display");
		this.idj.css(o).show(200);
		this.menudown = false;
		this.hibutt.focus();
	} ,

	setopenChilMenu: function ()		//设置打开子菜单的事件
	{
		var t = this;
		this.idj.find("li").mouseenter(function (){
			var tt = this;
			clearTimeout(t.tOnt);
			t.tOnt = setTimeout(function (){
				t.openChilMenu($(tt));
			},200);
		}).click(function(){
			clearTimeout(t.tOnt);
			t.openChilMenu($(this));
		});
	} ,

	openChilMenu: function (li)			//打开子菜单
	{
		if(li.hasClass("-ox-display")) return;
		li.parent().find(".-ox-display").removeClass("-ox-display");
		var hul = li.children('ul');
		if(hul.length==0) return;
		var sl = $(document).scrollLeft();
		var dw = $(document.body).outerWidth(true);
		var w = li.outerWidth();
		var w2 = hul.outerWidth();
		var of = li.offset();
		hul.toggleClass("-ox-right",of.left+w+w2>sl+dw);
		this.animate(hul);
		li.addClass("-ox-display");
	} ,

	animate: function (ul)			//打开子菜单animate
	{
		ul.stop(true, true).show(200, function (){ul.css('display', '');});
	} ,

	setRunFun: function (fun)			//设置执行菜单命令的事件
	{
		var t = this;
		function f(){
			if($box.display) return;
			var et = $(this);
			fun(et.data("com"), et.data("options"));
			t.menudown = false;
			t.hibutt.blur();
		}
		this.idj.find("li[data-com]").click(f);
		this.hbj.click(f);
	} ,

	accessKey: function (s)				//设置是否允许播放器使用快捷键
	{
		this.accessKeyState = s!==undefined ? s : !this.accessKeyState;
		if(this.accessKeyState)
			this.hbj.appendTo(ox.co.hiddeButton);
		else
			this.hbj.detach();
		ox.event.run("accessKey",this.accessKeyState);
	} ,

	itemState: function (id,cv)			//设置菜单项目状态
	{
		if(this.co[id].length>1)
			this.co[id].each(function (){
				var t = $(this);
				t.toggleClass("-ox-d",t.data("options")==cv);
			});
		else
			this.co[id].toggleClass("-ox-d",cv);
	}
});





/*==================================================*\
                     电子屏Class
\*==================================================*/

var ScreenClass = $f.Class(function(idp)	// **电子屏Class**
{
	this.idj = idp;
	this.spanj = $("<span></span>").appendTo(this.idj);
	this.textobj = {fn:"",tm:"",oi:"-",ol:"-"};		//电子屏中的显示文本
	this.width = 0;					//显示文本width
	this.offset = 0;				//字幕滚动offset
	setInterval($.proxy(this,"scroll"),120);
},{
	text: function (o)				//显示文本
	{
		$.extend(this.textobj,o);
		var as = $f.strReVal("{fn} {tm} [{oi}/{ol}] ",this.textobj);
		this.spanj.text(as+as+as);
	} ,

	scroll: function ()				//字幕滚动
	{
		this.width = -Math.round(this.spanj.width()/3);
		if(this.offset<this.width)
			this.offset -= this.width;
		this.spanj.css("left",this.offset-=3);
	} ,

	clue: function (text)
	{
		ox.co.infoClue.text(text);
		this.idj.finish().slideUp(200).delay(1000).slideDown(200);
	}
});




/*==================================================*\
                    播放时间框Class
\*==================================================*/

var TimeBoxClass = $f.Class(function(idp)	// ** 播放时间框Class **
{
	this.idj = idp;
	this.reverseTime = false;
	this.idj.click(this.clickEvent);
},{
	reverse: function (s)						//
	{
		this.reverseTime = s!==undefined ? s : !this.reverseTime;
		ox.event.run("reverseTime", this.reverseTime);
		return this.reverseTime?word.reTime1:word.reTime2;
	} ,

	text: function (tm,tl)							//
	{
		if(this.reverseTime)
			tm = tl - tm;
		this.idj.text($f.timeToString(tm));
	} ,

	clickEvent: function ()
	{
		ox.com("reverseTime");
	}
});



/*==================================================*\
                       列表Class
\*==================================================*/

var ListClass = $f.Class(function(idp)	// **列表Class**
{
	this.idj = idp;									//列表层jQuery对像
	this.ol = null;									//列表jQuery对像
	this.lis = null;								//列表项目jQuery对像
	this.indexStr = ".";							//索引
	this.lastPlayItem = false;						//上次播放的项目
	this.createSelect();
},{
	createSelect: function ()						//创建列表html元素
	{
		this.idj.mousedown(false);
		this.ol = $("<ol>").appendTo(this.idj);
	} ,

	update: function (arr,n)						//更新列表数据
	{
		arr = arr || [];
		this.lis = $();
		this.ol.empty();
		$f.each(arr,this,function(vv,ii)
		{
			this.lis = this.lis.add($("<li>").text(ii+1+this.indexStr+(n?vv[n]:vv)).data("value",ii).appendTo(this.ol));
		});
		this.playItem(this.lastPlayItem);
	} ,

	playItem: function (n)						//更新当前播放的项目
	{
		if(this.lastPlayItem!==false)
			this.lis.eq(this.lastPlayItem).removeClass("-ox-playing");
		if(n!==false)
			this.lis.eq(n).addClass("-ox-playing");
		this.lastPlayItem = n;
	} ,

	setRunFun: function (fun)
	{
		var timeout;
		var chg = null;		//<span>text:"X"
		function out()
		{
			clearTimeout(timeout);
			if(chg)
			{
				chg.remove();
				chg = null;
			}
		}
		this.ol.on({
			mouseup:function()
			{
				if(chg)
				{
					out();
					fun.pin($(this).data("value"));
				}
				else
				{
					out();
					fun.click($(this).data("value"));
				}
			},
			mousedown:function()
			{
				var t = $(this);
				chg = null;
				timeout = setTimeout(function(){
					chg = $("<span>",{html:"&#10006"}).prependTo(t);
				},1000);
				t.one("mouseleave", out);
			}
		},"li");
	}
});


/*==================================================*\
                       按钮Class
\*==================================================*/

var ButtonClass = $f.Class(function()	// **按钮Class**
{
	this.abbr = null;			//创建的按钮
	this.rhm = /.+\/(.+?)\./;
},{
	found: function ()			//创建按钮
	{
		this.abbr && this.abbr.remove();
		this.abbr = $();
		this.fo(ox.co.consoleA);
		this.fo(ox.co.consoleB);
	} ,

	fo: function (o)
	{
		var i=1, abbr, com;
		while(true)
		{
			abbr = $("<abbr />",{"class": "-ox-button"+(i++)}).appendTo(o);
			if(!this.rhm.test(abbr.css("backgroundImage")))
				break;
			com = RegExp.$1;
			abbr.attr("title",word.buttonTitle[com]).data("com",com);
			this.abbr=this.abbr.add(abbr);
		}
		abbr.remove();
	} ,

	setTitle: function ()		//设置按钮Title
	{
		oxDiv.find("abbr").attr("title",function (){
			return word.buttonTitle[$(this).data("com")];
		});
	} ,

	delegate: function ()		//委派
	{
		ox.co.relativeDivBox.delegate("abbr","click",function ()
		{
			var t = $(this);
			var d = t.data("com");
			if(d)
				ox.com(d,t.data("options"));
		});
	}
});



/*==================================================*\
                     皮肤Class
\*==================================================*/

var SkinClass = $f.Class(function()		// **皮肤Class**
{
	this.link = null;			//加载皮肤的link
	this.name = "";				//加载皮肤的name
	this.div = null;			//创建的装饰图片
},{
	load: function (name)			//加载样式
	{
		if(this.name==name)
			return;
		this.name = name;
		this.loadCSS();
		this.loadStyleEnd();
	} ,

	loadCSS: function ()		//加载样式表
	{
		this.link && this.link.remove();
		this.link = $("<link />", {
			href: options.path+$f.strReVal(options.skin,{name:this.name,file:"skin.css"}),
			rel: "stylesheet",
			type: "text/css",
			charset: "utf-8"
		});
		//.load(function(event){alert(123);});  link的load事件Safari不支持，，，弃用之
		$("head")[0].appendChild(this.link[0]);
	} ,

	loadStyleEnd: function ()		//样式表加载完成
	{
		if(ox.co.consoleA.width()!=0)
		{
			ox.button.found();
			this.ornament();
			ox.event.run("loadSkin",this.name);
		}
		else
			setTimeout($.proxy(this,"loadStyleEnd"),100);
	} ,

	ornament: function ()		//创建装饰图片
	{
		this.div && this.div.remove();
		this.div = $();
		var t = this;
		t.fo(ox.co.consoleA);
		t.fo(ox.co.consoleB);
		$.each(windows, function (n){
			t.fo(this.box);
		});
	} ,

	fo: function (o)
	{
		var i=1;
		var div;
		do {
			div = $("<div />",{"class": "-ox-ornament"+(i++)}).appendTo(o);
		} while(div.width()!=0 && (this.div=this.div.add(div)));
		div.remove();
	} ,


	about: function ()
	{
		$box.dialog({ text: '<p class="-ox-about1"></p><p class="-ox-about2"></p><p class="-ox-about3"></p><p class="-ox-about4"></p><p class="-ox-about5"></p><p class="-ox-about6"></p><p class="-ox-about7"></p>' , width: 210 , title: word.buttonTitle.skinAbout});
	}
});




/*==================================================*\
                     对话框对象
\*==================================================*/

var $box = (function (o)		// **************对话框对象
{
	var dbox,backdiv;			//dialogBox, dialogBoxBack
	var diaarr = [];			//对话框窗口，数据保存的堆栈
	var data;					//当前对话框窗口，数据
	o.display = false;

	o.alert = function (v1,v2,v3,v4,v5)
	{
		o.dialog({ text: $f.HTMLEncode(v1) , width: v2 , title: v3 , icon: v4 , fun: v5 });
	}
	o.confirm = function (v1,v2,v3,v4,v5)
	{
		o.dialog({ text: $f.HTMLEncode(v1) , width: v2 , title: v3 , icon: v4 , fun: v5 , bs: word.dialogBs2 });
	}
	o.confirm2 = function (v1,v2,v3,v4,v5)
	{
		o.dialog({ text: $f.HTMLEncode(v1) , width: v2 , title: v3 , icon: v4 , fun: v5 , bs: word.dialogBs2x });
	}
	o.confirm3 = function (v1,v2,v3,v4,v5)
	{
		o.dialog({ text: $f.HTMLEncode(v1) , width: v2 , title: v3 , icon: v4 , fun: v5 , bs: word.dialogBs3 });
	}
	o.prompt = function (v1,vv,v2,v3,v4,v5)
	{
		var html = $f.HTMLEncode(v1)+'<br /><input type="text" name="data" value="'+vv+'" style="width:90%" />';
		o.dialog({ text: html , width: v2 , title: v3 , icon: v4 , fun: v5 , bs: word.dialogBs2 });
	}
	o.password = function (v1,vv,v2,v3,v4,v5)
	{
		var html = $f.HTMLEncode(v1)+'<br /><input type="password" name="data" value="'+vv+'" style="width:90%" />';
		o.dialog({ text: html , width: v2 , title: v3 , icon: v4 , fun: v5 , bs: word.dialogBs2 });
	}
	o.textarea = function (v1,vv,v2,v3,v4,v5)
	{
		var html = $f.HTMLEncode2(v1)+'<br /><textarea name="data" style="width:90%; height:100px">'+vv+'</textarea>';
		o.dialog({ text: html , width: v2 , title: v3 , icon: v4 , fun: v5 , bs: word.dialogBs2 });
	}
	o.radio = function (v1,vv,v2,v3,v4,v5)
	{
		var html = $f.HTMLEncode(v1);
		$.each(vv,function(i,v){
			html += '<br /><input type="radio" name="data" value="'+v+'" id="UUid'+i+'" '+(i==0?'checked="checked"':'')+' /><label for="UUid'+i+'">'+v+'</label>';
		});
		o.dialog({ text: html , width: v2 , title: v3 , icon: v4 , fun: v5 , bs: word.dialogBs2 });
	}
	o.checkbo = function (v1,vv,v2,v3,v4,v5)
	{
		var html = $f.HTMLEncode(v1);
		$.each(vv,function(i,v){
			html += '<br /><input type="checkbox" name="'+i+'" value="'+v+'" id="UUid'+i+'" '+(i==0?'checked="checked"':'')+' /><label for="UUid'+i+'">'+v+'</label>';
		});
		o.dialog({ text: html , width: v2 , title: v3 , icon: v4 , fun: v5 , bs: word.dialogBs2 });
	}

	o.dialog = function (d)
	{
		if(!dbox)
			return alert("对话框还没有初始化!");
		if($.isFunction(d.icon)){ d.fun=d.icon; delete d.icon; }
		if($.isFunction(d.title)){ d.fun=d.title; delete d.title; }
		if($.isFunction(d.width)){ d.fun=d.width; delete d.width; }
		if(/^\D/.test(d.width)){ d.title=d.width; delete d.width; }
		d.icon = d.icon || "";
		d.text = d.text || "";
		d.width = d.width || 150;
		d.title = d.title || word.dialogDefaultTitle;
		d.bs = d.bs || word.dialogBs1;
		open(d);
	}

	o.setInitial = function (d,b)
	{
		dbox = d;
		backdiv = b;
		dbox.delegate("form","submit",submit);
		dbox.delegate(".-ox-b>input","click",click);
	}

	function open(d)
	{
		if(data)
			diaarr.push(data);
		else
		{
			dbox.show();
			o.display = true;
		}
		var title = $("<div></div>",{"class":"-ox-t",text:d.title});
		var form = $("<form></form>",{"class":"-ox-"+d.icon});
		var bottom = $("<div></div>",{"class":"-ox-b"});
		var dia = $("<div></div>",{"class":"-ox-dialog"})
			.appendTo(dbox)
			.append($("<div></div>",{"class":"-ox-c"}))
			.append(title)
			.append(form)
			.append(bottom);
		$.each(d.bs,function(k,v){
			$("<input />",{type:"button",val:k}).appendTo(bottom).data("value",v);
		});
		form.append(d.text);

		backdiv.css("zIndex",diaarr.length*3);
		var win = new WindowClass(dia);
		win.setInitial(null,{drag:true,display:true,css:{position:"fixed",left: "50%",top: "50%",width: d.width,	height: "auto", zIndex:diaarr.length*3+1}});
		win.setMove(title);
		win.initial();

		data = { dialog:dia, form:form, fun:d.fun };

		d.height = dia.height()+bottom.height();
		dia.css({
			width: 0,
			height: 60,
			marginLeft: -1,
			marginTop: -31
		}).animate({
			width: d.width,
			marginLeft: -Math.round(d.width/2)-1
		}, 300).animate({
			height: d.height,
			marginTop: -Math.round(d.height/2)-1
		}, 300, focus);
	}

	function focus()
	{
		if(data.form[0].elements.length>0)
			data.form[0].elements[0].focus();
		else
			data.form.next().children()[0].focus();
	}

	function submit()
	{
		data.form.next().children()[0].click();
		return false;
	}

	function click(event)
	{
		var val = $(event.target).data("value");
		if(data.fun && val!==null)
			if(data.fun(val, data.form.serializeArray(), data.form)===false)
				return;
		delete data.fun;
		data.dialog.animate({
			width: 2,
			height: 2,
			marginLeft: -1,
			marginTop: -1
		},200, close);
	}

	function close()
	{
		data.dialog.empty();
		data.dialog.remove();
		delete data.dialog;
		delete data.form;
		data = undefined;
		if(diaarr.length>0)
		{
			data = diaarr.pop();
			backdiv.css("zIndex",diaarr.length*3);
		}
		else
		{
			dbox.hide();
			o.display = false;
		}
	}


	return o;
})({});





/*==================================================*\
                     媒体选单对象
\*==================================================*/

var mediamenu = (function (mm)		// **************媒体选单对象
{
	var data = [];			//data数据
	var type = [];
	var list = [];

	var currentType = 0;

	mm.initial = function (d)		//初始化媒体选单
	{
		data = d;
		function df(da)		//生成分类标签
		{
			var ti = type.length;
			type.push(da);
			var html = '<dl>';
			html += '<dd data-ti="'+ti+'">'+ da.name +'</dd>';
//			html += '<dd data-ti="'+ti+'"><span data-ti="'+ti+'">++</span>'+ da.name +'</dd>';
			$f.each(da.type, function (v){
				if(v.type)
					html += df(v);
			});
			html += '</dl>';
			return html;
		}
		var html = df({name: word.all, type: data});
		ox.co.typeBox.html(html);
		delegate();
		openType(0,true);
	}

	function delegate()		//委派
	{
		ox.co.typeBox.mousedown(false);
		ox.co.listBox.mousedown(false);

		ox.co.allPlayButton.text(word.allPlay);
		ox.co.playSelectButton.text(word.playSelect);
		ox.co.addPlayButton.text(word.addPlay);
		ox.co.addSelectButton.text(word.addSelect);
		ox.co.allSelectButton.text(word.allSelect);
		ox.co.reSelectButton.text(word.reSelect);
		ox.co.noSelectButton.text(word.noSelect);
		ox.co.listSearch.val(word.search);

		ox.co.typeBox.delegate("dd","click",function ()
		{
			var d = $(this).data("ti")-0;
			openType(d,true);
			return false;
		});
		//ox.co.typeBox.delegate("span","click",function ()
		//{
			//var d = $(this).data("ti")-0;
			//openType(d,true);
			//return false;
		//});
		ox.co.listBox.delegate("span","click",function ()
		{
			var d = $(this).data("i")-0;
			playerList.add(list[d],true);
		});

		ox.co.allPlayButton.click(function(event)		//全部播放
		{
			playerList.update(list,true);
		});
		ox.co.playSelectButton.click(function(event)	//播放所选
		{
			var gl = getSelectList();
			gl && playerList.update(gl,true);
		});
		ox.co.addPlayButton.click(function(event)		//追加播放
		{
			var gl = getSelectList();
			gl && playerList.add(gl,true);
		});
		ox.co.addSelectButton.click(function(event)		//追加所选
		{
			var gl = getSelectList();
			gl && playerList.add(gl,false);
		});

		ox.co.allSelectButton.click(function(event)		//全选按钮
		{
			ox.co.listBox.find("input").prop("checked",true);
		});
		ox.co.reSelectButton.click(function(event)		//反选按钮
		{
			ox.co.listBox.find("input").prop("checked",function(i,v){return !v;});
		});
		ox.co.noSelectButton.click(function(event)		//全清按钮
		{
			ox.co.listBox.find("input").prop("checked",false);
		});

		ox.co.typePageUp.click(function(event)			//分类标签上翻页按钮
		{
			ox.co.typeBox.animate({scrollTop:ox.co.typeBox.scrollTop()-ox.co.typeBox.height()}, 600);
		});
		ox.co.typePageDown.click(function(event)		//分类标签下翻页按钮
		{
			ox.co.typeBox.animate({scrollTop:ox.co.typeBox.scrollTop()+ox.co.typeBox.height()}, 600);
		});

		ox.co.listSearch.blur(function(event){
			if(this.value=="")
				this.value = word.search;
			else
	  			search(this.value);
		}).focus(function(event){
			if(this.value==word.search)
				this.value = "";
		}).keydown(function(event){
			if(event.which==13)
				this.blur();
		});
	}


	function getSelectList()		//获取所选项目的列表
	{
		var arr = [];
		ox.co.listBox.find("input").each(function (i){
			if(this.checked)
			{
				arr.push(list[i]);
				this.checked = false;
			}
		});
		if(arr.length>0)
			return arr;
		$box.alert(word.qSelect,210,null,"logo");
	}

	function openType(n,f)			//打开分类
	{
		list = typeToList(type[n],f);
		listHtml();
		currentType = n;
		ox.co.typeBox.find("dd").removeClass("-ox-s").eq(n).addClass("-ox-s");
	}

	function typeToList(n,f,searf)	//获取分类下的媒体列表
	{
		var l = [];
		$f.each(n.type, function (v){
			if(!v.type)
			{
				if(!searf || searf(v))
					l = l.concat(v);
			}
			else if(f)
				l = l.concat(typeToList(v,true,searf));
		});
		return l;
	}

	function listHtml()			//输出媒体列表
	{
		if(list.length<=0)
		{
			ox.co.listBox.html(word.noResult);
			return;
		}
		var html = '<dl>';
		$f.each(list, function (v,i){
			html += '<dd><input type="checkbox" /><span data-i="'+i+'">'+(i+1)+'.'+ v.name +'</span></dd>';
		});
		html += '</dl>';
		ox.co.listBox.html(html);
	}

	function search(keyword)	//搜索
	{
		var s = keyword.replace(/([\(\)\[\]\{\}\^\$\+\-\.\"\'\|\/\\])/g,"\\$1");
		var tg = s.split(";");
		for(var ii=0; ii<tg.length; ii++)
		{
			tg[ii] = tg[ii].replace(/^\s+/,"").replace(/\s+$/,"");
			if(!/[\*\?]/.test(tg[ii]))
				tg[ii] = "*"+tg[ii]+"*";
		}
		s = tg.join("|");
		s = s.replace(/\*/g,".*");
		s = s.replace(/\?/g,".");
		var rep = new RegExp("^("+s+")$","i");

		list = typeToList(type[currentType],true,function (v){
			return rep.test(v.name);
		});
		listHtml();
	}

	return mm;
})({});



/*==================================================*\
                     播放对象
\*==================================================*/

var player = (function (p)		// **************播放对象
{
	p.plugins = {};				//插件合集
	var plugin;					//当前插件
	var data = {};				//当前播放的数据
	var volume = 0;				//音量
	var muteState = false;		//静音状态
	var playSlider = null;		//播放滑动条
	var volumeSlider = null;	//音量滑动条
	var interval = null;		//播放计时器
	var timeout = null;			//播放计时器2
	var lengthData = 0;			//媒体总长度
	var errorNo = 0;			//错误重试次数


	p.setupSlider = function ()		//创建滑动条
	{
		playSlider = new SliderClass(ox.co.playSlider,{
			start: function ()
			{
				if(plugin && lengthData>0)
					ox.co.dialogTime.show();
				else
					return false;
			} ,
			move: function (v)
			{
				ox.co.dialogTime.css("marginLeft",Math.round(v*10000)/100+"%")
					.text($f.timeToString(v * lengthData));
			} ,
			end: function (v)
			{
				ox.co.dialogTime.hide();
				if(plugin && lengthData>0)
					p.go(v * lengthData);
			}
		});
		volumeSlider = new SliderClass(ox.co.volumeSlider,{
			start: function ()
			{
				if(muteState)
					p.mute();
			} ,
			move: function (v)
			{
				volume = Math.round(v * 100);
				if(plugin)
					plugin.volume(volume);
			}
		});
	}


	function intervalFunc()			//计时器函数
	{
		if(!plugin) return;
		if(lengthData<=0)
		{
			lengthData = plugin.length() || 0;
			if(lengthData>0)
				ox.screen.text({tm:$f.timeToString(lengthData)});
		}
		time = p.pos();
		ox.time.text(time,lengthData);
		playSlider.setPosition(time/lengthData);
		plugin.simulateEvent && plugin.simulateEvent();
	}


	function urlObjToStr(urls)		//返回当前浏览器对应的url
	{
		if(typeof(urls)=="string")
			return urls;
		var rurl, rv=-1;
		$.each(urls, function (nf){
			var url = this;
			$.each(nf.split("|"), function (){
				var browser = (this.match(/[a-z]+/i)||[""])[0].toLowerCase();
				var version = parseFloat((this.match(/[\d\.]+/)||["0.0"])[0]);
				if(!rurl)
					rurl = url;
				if($f.browser[browser] && version<=parseFloat($f.browser[browser]) && version>rv)
				{
					rv = version;
					rurl = url;
				}
			});
		});
		return rurl;
	}


	p.start = function (dd)
	{
		closed();

		data = dd;
		data.url = urlObjToStr(data.url);
		data.url = data.url.replace(/\\/g,"/");
		data.extension = $f.extension(data.url);
		data.url = data.url.replace(/\|\w+$/,"");
		var extensionReg = RegExp("\\b"+data.extension+"\\b","i");
		var protocol = $f.protocol(data.url);
		var protocolReg = RegExp("\\b"+protocol+"\\b","i");
		for(var name in p.plugins)
		{
			var o = p.plugins[name];
			if(protocolReg.test(o.protocol))
				if(start2(o,name))
					return;
		}
		for(var name in p.plugins)
		{
			var o = p.plugins[name];
			if(extensionReg.test(o.extensionVideo+" "+o.extensionAudio))
				if(start2(o,name))
					return;
		}
		ox.screen.clue(data.extension+word.noPlay);
		timeout = setTimeout(playerList.autoNext2,2000);
	}

	function start2(o,name)
	{
		if(!o.initialOK)
			if(o.sustain())
			{
				o.objBox = $("<div></div>").appendTo(ox.co.videoObjDiv);
				o.initial();
				o.initialOK = true;
			}
			else
			{
				delete p.plugins[name];
				return false;
			}
		plugin = o;
		start3();
		return true;
	}

	function start3()
	{
		if(!plugin.initEnded())			//插件是否初始化完成
		{
			timeout = setTimeout(start3,500);
			return;
		}
		if(data.video===undefined)
		{
			var extensionReg = RegExp("\\b"+data.extension+"\\b","i");
			data.video = extensionReg.test(plugin.extensionVideo);
		}
		if(config.videoDisplay==1)
			windows.video.minKg(data.video);
		plugin.objBox.show();
		plugin.eventRun = eventRun;
		lengthData = 0;
		errorNo = 0;
		plugin.open(data);
		plugin.volume(volume);
		plugin.mute(muteState);
		ox.event.run("playStart",data);
		interval = setInterval(intervalFunc,500);
	}

	function closed()
	{
		clearTimeout(timeout);
		clearInterval(interval);
		if(!plugin) return;
		ox.event.run("playEnd");
		plugin.eventRun = null;
		plugin.closed();
		playSlider.setPosition(0);
		ox.co.timeText.text("0:00");
		plugin.objBox.hide();
		plugin = null;
	}


	function eventRun(eventName,value,u2)
	{
		switch(eventName) {
			case "state":
				u2 = u2 || "";
				ox.co.stateText.text(word.playState[value]+u2);
				ox.event.run("playState", plugin.isPlay());
				break;
			case "playEnd":
				timeout = setTimeout(playerList.autoNext,1000);
				break;
			case "error":
				if(++errorNo<=3)
				{
					ox.screen.clue(word.errorNo+"("+errorNo+")");
					timeout = setTimeout(plugin.reLoad,2000);
				}
				else
				{
					ox.screen.clue(word.autoNext);
					timeout = setTimeout(playerList.autoNext2,1000);
				}
				break;
		}
	}

	p.playPause = function ()	//播放 / 暂停
	{
		if(!plugin) return;
		plugin.isPlay() ? plugin.pause() : plugin.play();
	}
	p.play = function ()		//播放
	{
		if(!plugin) return;
		plugin.play();
	}
	p.pause = function ()		//暂停
	{
		if(!plugin) return;
		plugin.pause();
	}

	p.stop = function ()		//停止
	{
		if(!plugin) return word.clue;
		plugin.stop();
	}

	p.pos = function()			//当前位置
	{
		if(!plugin) return 0;
		return plugin.pos() || 0;
	}

	p.length = function()		//媒体总长度
	{
		return lengthData;
	}

	p.go = function(s)			//转到
	{
		if(!plugin) return word.clue;
		if(lengthData==0) return;
		s = lengthData-s<2?lengthData-2:s;
		s = s<0?0:s;
		plugin.go(s);
	}

	p.forth = function ()		//前进
	{
		if(!plugin) return word.clue;
		var v = p.pos() + 10;
			p.go(v);
	}

	p.back = function ()		//后退
	{
		if(!plugin) return word.clue;
		var v = p.pos() - 10;
		p.go(v);
	}

	p.mute = function ()		//静音
	{
		muteState = !muteState;
		ox.event.run("mute", muteState);
		if(plugin)
			plugin.mute(muteState);
	}

	p.fullScreen = function()	//全屏
	{
		if(!plugin) return word.clue;
		if(plugin.fullScreen()=="no")
			return word.clue;
	}

	p.setVolume = function(v)	//设置音量
	{
		if(v=="+")
			v = volume + 10;
		if(v=="-")
			v = volume - 10;
		volume = v<0?0:(v>100?100:v);
		volumeSlider.setPosition(volume/100);
		if(plugin)
			plugin.volume(volume);
		return word.volume+volume;
	}


	return p;
})({});



/*==================================================*\
                     播放列表对象
\*==================================================*/

var playerList = (function (p)		// ************播放列表对象
{
	var list = [];				//播放列表
	var rnd = [];				//随机播放过的项目
	var index = -1;				//正在播放的
	var loopState = 0;			//列表循环状态

	p.setLoopState = function (v)	//设置列表循环状态
	{
		v = v===undefined?(loopState+1)%4:v;
		loopState = v;
		ox.event.run("loopState",v);
		return word.loopTitle+word.loop[v];
	}

	p.getLoopState = function ()	//获取列表循环状态
	{
		return loopState;
	}

	p.getList = function ()		//获取正在播放的列表
	{
		return list.slice();
	}

	p.initial = function (data)		//生成初始播放列表
	{
		var lt = [];
		function sd(da,ini)
		{
			$f.each(da, function (v){
				var b = "init" in v?v.init!==false:ini;
				if(v.type)
					sd(v.type, b);
				else if(b)
					lt.push(v);
				delete v.init;
			});
		}
		sd(data,true);
		function openPlay(t)
		{
			p.update( lt,t==1);
			if(t==2)
				ox.co.playButton.one("click", clickStartPlay);
		}
		if(config.openPlay!=2)
			openPlay(config.openPlay==1?1:2);
		else
			$box.confirm2(word.dePlay,200,null,"logo",openPlay);
	}
	function clickStartPlay(event)
	{
		if(index>=0) return;
		event.stopImmediatePropagation();
		startPlay();
	}

	window.$oxplayer.update = p.update = function (lt,play)		//更新当前列表
	{
		if(!lt) return;
		if(!$.isArray(lt))
			lt = [lt];
		if(lt.length<=0) return;
		ox.event.run("reList",list,lt);
		list = $.extend(true,[],lt);
		rnd = [];
		ox.playlist.update(list,"name");
		ox.screen.text({ol:list.length});
		if(play!==false)
			startPlay();
		else
			ox.playlist.playItem(false);
	}

	window.$oxplayer.add = p.add = function (lt,play)		//追加当前列表
	{
		if(!lt) return;
		if(!$.isArray(lt))
			lt = [lt];
		if(lt.length<=0) return;
		var jl = list.length;
		list = list.concat($.extend(true,[],lt));
		rnd = rnd.concat($f.naturalNumber(jl,list.length-1));
		ox.playlist.update(list,"name");
		ox.screen.text({ol:list.length});
		if(play!==false)
			p.go(jl);
	}

	p.del = function (n)									//删除列表项目
	{
		if(list.length<=1){ $box.alert(word.listOneItem); return; }
		n = n<=0?0:n>=list.length?list.length-1:n;
		list.splice(n,1);
		ox.playlist.update(list,"name");
		rnd = [];
		var tindex = index;
		if(n<index)
			ox.playlist.playItem(--index);
		ox.screen.text({oi:index+1,ol:list.length});
		if(n==tindex)
			p.go(n);
	}

	function startPlay()	//开始播放
	{
		if(loopState!=3)
			p.go(0);
		else
			random();
	}


	var random = function ()	//随机播放
	{
		if(rnd.length==0)
			rnd = $f.naturalNumber(0,list.length-1);
		p.go(rnd.splice(Math.floor(Math.random()*rnd.length),1)[0]);
	}

	p.home = function ()	//播放第一曲
	{
		if(index<=0) return word.toUpNo;
		p.go(0);
	}
	p.prev = function ()	//播放上一曲
	{
		if(index<=0) return word.toUpNo;
		p.go(index-1);
	}
	p.next = function ()	//播放下一曲
	{
		if(index>=list.length-1) return word.toDownNo;
		p.go(index+1);
	}
	p.end = function ()		//播放最后一曲
	{
		if(index>=list.length-1) return word.toDownNo;
		p.go(list.length-1);
	}

	p.autoNext = function ()	//自动播放下一曲
	{
		switch(loopState) {
			case 0:
				p.next(); break;
			case 1:
				if(index>=list.length-1)
					p.go(0);
				else
					p.next();
				break;
			case 2:
				player.play(); break;
			case 3:
				random(); break;
		}
	}

	p.autoNext2 = function ()	//自动播放下一曲
	{
		switch(loopState) {
			case 0:
			case 2:
				p.next(); break;
			case 1:
				if(index>=list.length-1)
					p.go(0);
				else
					p.next();
				break;
			case 3:
				random(); break;
		}
	}

	p.go = function (n)		//播放当前列表
	{
		n = n<=0?0:n>=list.length?list.length-1:n;
		index = n;
		var item = list[n];
		ox.screen.text({fn:item.name,tm:"--:--",oi:index+1});
		ox.playlist.playItem(n);
		player.start(item);
	}


	return p;
})({});





/*==================================================*\
                    播放器主对象
\*==================================================*/

var ox = (function (ox)		// **播放器主对象**
{
	ox.toAuthor = function ()		//联系播放器作者
	{
		ox.co.mail[0].href = "mailto:"+word.toAuthor;
		ox.co.mail[0].click();
	}

	ox.openConsoleB = function ()		//显示控制台副界面
	{
		ox.co.consoleBox.toggleClass("-ox-Bshow");
		var ds = ox.co.consoleBox.hasClass("-ox-Bshow");
		if(ds)
		{
			ox.co.consoleBox.css("height",config.consoleBopenHeight.initial);
		}
		else
		{
			config.consoleBopenHeight.initial = ox.co.consoleBox.height();
			ox.co.consoleBox.css("height","");
		}
		ox.event.run("openConsoleB",ds);
	}

	ox.com = function (s,v)		//
	{
		var rv;
		switch(s)
		{
			case "play":			rv = player.playPause(); break;
			case "stop":			rv = player.stop(); break;
			case "forth":			rv = player.forth(); break;
			case "back":			rv = player.back(); break;
			case "volumeUp":		rv = player.setVolume("+"); break;
			case "volumeDown":		rv = player.setVolume("-"); break;
			case "mute":			rv = player.mute(); break;
			case "fullScreen":		rv = player.fullScreen(); break;

			case "loop":			rv = playerList.setLoopState(v); break;
			case "home":			rv = playerList.home(); break;
			case "prev":			rv = playerList.prev(); break;
			case "next":			rv = playerList.next(); break;
			case "end":				rv = playerList.end(); break;

			case "reverseTime":		rv = ox.time.reverse(); break;
			case "accessKey":		rv = ox.menu.accessKey(); break;

			case "menu":			ox.menu.openMenu(ox.co.menuButton); break;
			case "openMediamenu":	windows.mediamenu.minKg(); break;
			case "openConsoleB":	ox.openConsoleB(); break;
			case "openVideo":		windows.video.minKg(); break;
			case "lockConsole":		rv = windows.console.rePosState(); break;
			case "closeConsole":	windows.console.minKg(); break;
			case "resetConsole":	windows.console.reset(); break;
			case "resetAll":		$.each(windows,function(){this.reset()}); break;
			case "about":			$box.alert(word.about,240,word.buttonTitle.about,"logo"); break;
			case "help":			$box.alert(word.help,240,word.buttonTitle.help); break;
			case "accessKeyHelp":	$box.alert(ox.menu.accessKeyList,240,word.buttonTitle.accessKeyHelp); break;
			case "skinAbout":		ox.skin.about(); break;
			case "toAuthor":		ox.toAuthor(); break;
			case "loadSkin":		ox.skin.load(v); break;

			case "min":				v.min(); break;
			case "max":				rv = v.maxKg(); break;
			case "reset":			v.reset(); break;
			case "lock":			rv = v.rePosState(); break;
			default:				rv = ox.com[s]?ox.com[s]():s+"还没完成"; break;
		}
		rv && ox.screen.clue(rv);
	}


	ox.co = {};						//所有classs的集合
	ox.event = new SystemEventClass();
	ox.skin = new SkinClass();
	ox.button = new ButtonClass();
	ox.menu = null;
	ox.playlist = null;
	ox.screen = null;
	ox.time = null;

	var windowIni = {}			//各窗口初始化数据
	oxDiv.children().each(function(){
		var t = $(this);
		var s = t.data("model");
		if(s)
			windowIni[s] = {
				display: t.data("init-display"),
				drag: t.data("drag"),
				style: t.data("style")
			};
	});

	var wins =	{};				//窗口数据
	wins.console = {	//控制台
		html:
			'<div class="_ox_consoleA">' +				//控制台主界面
			'  <div class="_ox_infoTextBox">' +			//电子屏
			'    <div class="_ox_infoText"></div>' +	//电子屏中的文字
			'    <div class="_ox_infoClue"></div>' +	//电子屏中的提示框
			'  </div>' +
			'  <div class="_ox_timeText">0:00</div>' +		//当前播放时间信息
			'  <div class="_ox_stateText">- - - -</div>' +	//播放状态信息
			'  <div class="_ox_playSlider">' +				//播放进度滑动条
			'    <div class="-ox-sche"><div></div></div>' +
			'    <div class="_ox_dialogTime"></div>' +		//播放滑动条拖动预览时间
			'  </div>' +
			'  <div class="_ox_volumeSlider">' +		//音量滑动条
			'    <div class="-ox-sche"><div></div></div>' +
			'  </div>' +
			'  <abbr class="_ox_playButton" data-com="play"></abbr>' +		//播放按钮
			'  <abbr class="_ox_muteButton" data-com="mute"></abbr>' +		//静音按钮
			'  <abbr class="_ox_consoleBButton" data-com="openConsoleB"></abbr>' +		//打开副界面按钮
			'  <abbr class="_ox_menuButton" data-com="menu"></abbr>' +		//主菜单按钮
			'  <abbr class="_wo_lock -ox-lockConsoleButton"></abbr>' +		//锁定控制台按钮
			'</div>' +
			'<div class="_ox_consoleB">' +				//控制台副界面
			'  <abbr class="_ox_loopButton" data-com="loop"></abbr>' +		//循环按钮
			'  <div class="_ox_playList -ox-listBox"></div>' +				//当前播放列表
			'  <div class="-ox-listResize _wo_resize"></div>' +				//
			'</div>' +
			'' ,
		defaultValue: {
			drag:false,
			display:true,
			css:{
				position:"relative",
				left:"0px",
				top:"0px",
				right:"auto",
				bottom:"auto"
			}
		} ,
		setup: function (win)
		{
			win.setMove();
			win.setResize(null,{minh: config.consoleBopenHeight.min, maxw: 0, maxh: config.consoleBopenHeight.max});
		}
	}

	wins.video = {	//视频窗口
		html:
			'<div class="_ox_video -ox-videoCenter">' +
			'  <div class="_ox_videoObjDiv"></div>' +
			'</div>' +

			'<div class="-ox-videoA"></div>' +
			'<div class="-ox-videoB"></div>' +
			'<div class="-ox-videoC"></div>' +
			'<div class="-ox-videoD"></div>' +
			'<div class="-ox-videoE"></div>' +
			'<div class="-ox-videoF"></div>' +
			'<div class="-ox-videoG"></div>' +
			'<div class="_wo_resize -ox-videoH"></div>' +

			'<abbr class="_wo_close -ox-closeVideoButton"></abbr>' +	//关闭按钮
			'<abbr class="_wo_max -ox-maxVideoButton"></abbr>' +		//最大化按钮
			'<abbr class="_wo_reset -ox-resetVideoButton"></abbr>' +	//复位按钮
			'<abbr class="_wo_lock -ox-lockVideoButton"></abbr>' +		//锁定按钮
			'' ,
		defaultValue: {
			drag:false,
			display:false,
			css:{
				position:"relative",
				left:"0px",
				top:"0px",
				right:"auto",
				bottom:"auto",
				width:"170px",
				height:"140px"
			}
		} ,
		setup: function (win)
		{
			win.setMove();
			win.setResize(null,{minw: 160, minh: 150});
			win.event.attach("dragStart",function (){
				ox.co.videoObjDiv.hide();
			});
			win.event.attach("dragEnd",function (){
				ox.co.videoObjDiv.show();
			});
			win = undefined;
		}
	}

	wins.mediamenu = {	//媒体选单
		html:
			'<abbr class="_wo_close -ox-closeMediamenuButton"></abbr>' +	//关闭按钮
			'<abbr class="_wo_reset -ox-resetMediamenuButton"></abbr>' +	//复位按钮
			'<abbr class="_wo_lock -ox-lockMediamenuButton"></abbr>' +		//锁定按钮

			'<abbr class="_ox_allPlayButton"></abbr>' +		//全部播放按钮
			'<abbr class="_ox_playSelectButton"></abbr>' +	//播放所选按钮
			'<abbr class="_ox_addPlayButton"></abbr>' +		//追加播放按钮
			'<abbr class="_ox_addSelectButton"></abbr>' +	//追加所选按钮

			'<abbr class="_ox_allSelectButton"></abbr>' +	//全选按钮
			'<abbr class="_ox_reSelectButton"></abbr>' +	//反选按钮
			'<abbr class="_ox_noSelectButton"></abbr>' +	//全清按钮

			'<div class="_ox_typeBox"></div>' +
			'<div class="_ox_listBox"></div>' +

			'<abbr class="_ox_typePageUp"></abbr>' +		//分类标签上翻页按钮
			'<abbr class="_ox_typePageDown"></abbr>' +		//分类标签下翻页按钮

			'<input type="text" class="_ox_listSearch" />' +		//搜索框

			'' ,
		defaultValue: {
			drag:true,
			display:false,
			css:{
				position:"relative",
				left:"0px",
				top:"0px",
				right:"auto",
				bottom:"auto"
			}
		} ,
		setup: function (win)
		{
			win.setMove();
		}
	}


	var pluginsOs = {		//插件内用到的对像
		co:			ox.co ,		//所有classs的集合
		event:		ox.event ,	//播放器系统事件
		com:		ox.com ,	//执行菜单命令函数
		player:		player ,
		playerList:	playerList ,
		box:		$box ,
		$f:			$f ,		//通用的函数

		getObject:function (str)//用来获取主程序中没有提供给插件的对象
		{
			return eval(str);
		}
	};
	$.each(plugins, function (n){
		if(this.pluginWindow)
		{
			this.pluginWindow.html =
			'<div class="-ox-pluginA"></div>' +
			'<div class="-ox-pluginB"></div>' +
			'<div class="-ox-pluginC"></div>' +
			'<div class="-ox-pluginD"></div>' +
			'<div class="-ox-pluginE"></div>' +
			'<div class="-ox-pluginF"></div>' +
			'<div class="-ox-pluginG"></div>' +
			'<div class="_wo_resize -ox-pluginH"></div>' +
			'<div class="-ox-pluginCenter"></div>' +

			'<div class="_wo_title -ox-pluginTitle"></div>' +

			'<abbr class="_wo_close -ox-closePluginButton"></abbr>' +	//关闭按钮
			'<abbr class="_wo_reset -ox-resetPluginButton"></abbr>' +	//复位按钮
			'<abbr class="_wo_lock -ox-lockPluginButton"></abbr>' +		//锁定按钮

			'<div class="-ox-pluginBody">' +
			this.pluginWindow.html +
			'</div>' +
			'' ;
			this.pluginWindow.inPlugin = true;
			wins[n] = this.pluginWindow;
			delete this.pluginWindow;
		}
		this.pluginFunction($,this,pluginsOs);
		delete this.pluginFunction;
	});



	ox.event.attach("loadWord", function (mw){
		var da = mw[2].da;
		$.each(config.skinList, function (n,v){
			da.push({ na: v, com: "loadSkin", options: n });
		});
	});




	function setStateEvent()		//设置状态事件
	{
		windows.video.event.attach("restate",function (v){
			ox.menu.itemState("openVideo",v!=0);
		});
		windows.mediamenu.event.attach("restate",function (v){
			ox.menu.itemState("openMediamenu",v!=0);
		});
		windows.console.event.attach("restate",function (v){
			ox.menu.itemState("closeConsole",v==0);
		});
		windows.console.event.attach("posState",function (v){
			ox.menu.itemState("lockConsole",v);
		});
		ox.event.attach("playState",function (v){
			ox.menu.itemState("play",v);
			ox.co.playButton.toggleClass("-ox-state2",v);
		});
		ox.event.attach("loadSkin",function (v){
			ox.menu.itemState("loadSkin",v);
		});
		ox.event.attach("loopState",function (v){
			ox.menu.itemState("loop",v);
			ox.co.loopButton.attr("title",word.loop[v])
				.removeClass("-ox-state33 -ox-state66 -ox-state2")
				.addClass(["","-ox-state33","-ox-state66","-ox-state2"][v]);
		});
		ox.event.attach("mute",function (v){
			ox.menu.itemState("mute",v);
			ox.co.muteButton.toggleClass("-ox-state2",v);
		});
		ox.event.attach("openConsoleB",function (v){
			ox.menu.itemState("openConsoleB",v);
			ox.co.consoleBButton.toggleClass("-ox-state2",v);
		});
		ox.event.attach("reverseTime",function (v){
			ox.menu.itemState("reverseTime",v);
		});
		ox.event.attach("accessKey",function (v){
			ox.menu.itemState("accessKey",v);
		});
	}

	function oxJSON(url,text,func)			//加载json
	{
		oxDiv.text("Player Loading... ("+text+")");
		$.getJSON(url, func).error(function (e, xhr, settings, exception){
			alert("ajax出错: "+settings+"\n"+text);
		});
	}

	function loadJSON()			//加载数据
	{
		oxDiv.queue("oxJSON", function (){
			oxJSON(options.path+options.config, options.config, function (data){
				config = data;
				oxDiv.dequeue("oxJSON");
			});
		});

		$.each(plugins, function (n){
			var pt = this;
			if(!pt.language) return;
			oxDiv.queue("oxJSON", function (){
				var sz = $f.strReVal(pt.language,{name:config.language});
				oxJSON(pt.path+sz, sz, function (data){
					pt.word = data;
					oxDiv.dequeue("oxJSON");
				});
			});
		});

		oxDiv.queue("oxJSON", function (){
			var sz = $f.strReVal(options.language,{name:config.language});
			oxJSON(options.path+sz, sz, function (data){
				word = data;
				ox.event.run("loadWord",word.menuWord);
				ox.event.removeAll("loadWord");
				innerHTMLToDiv();
				ox.skin.load(config.skin);
				loadData();
				oxDiv.dequeue("oxJSON");
			});
		});

		oxDiv.dequeue("oxJSON");
	}


	function loadData()			//加载媒体数据json
	{
		$.getJSON(options.path+options.data, function (data){
			mediamenu.initial(data);
			playerList.initial(data);
		}).error(function (e, xhr, settings, exception){
			alert("ajax出错: "+settings+"\n"+options.data);
		});
	}

	function innerHTMLToDiv()		//往oxplayer div中写html
	{
		$.each(wins, function (n){
			this.html =	'<div class="_ox_'+n+'Box'+(this.inPlugin?' -ox-pluginsBox':'')+'">' + this.html + '</div>';
		});

		var winhtml = "";
		$.each(windowIni,function(n){
			if(wins[n])
			{
				winhtml += wins[n].html;
				wins[n].html = "";
			}
		});
		$.each(wins, function (){
			winhtml += this.html;
		});

		var str =
		'<div class="_ox_relativeDivBox">' +	//一个相对定位的框子，可以让各个窗口相对定位
		winhtml +
		'</div>' +

		'<div class="_ox_menu"></div>' +		//主菜单
		'<div class="_ox_hiddeDiv">' +			//隐藏的button层
		'  <a class="_ox_mail"></a>' +
		'  <div class="_ox_hiddeButton"></div>' +
		'</div>' +

		'<div class="_ox_dialogBox">' +			//对话框
		'  <div class="_ox_dialogBoxBack">&nbsp;</div>' +
		'</div>' +
		'';
		$.each(plugins, function (n){
			if(this.html)
				str += this.html;
		});

		oxDiv.html(str);
		oxDiv.bind("selectstart contextmenu dragstart", false);//.attr("unselectable","on");

		$("[class*='_ox_']",oxDiv).each(function (){		//只对class查找一次，以后就不用查找了
			var t = $(this);
			ox.co[t.attr("class").match(/_ox_(\w+)/)[1]] = t;
		});

		setupPlayer();
	}

	function setupPlayer()
	{
		windows = {};
		$.each(wins, function (n){
			windows[n] = new WindowClass(ox.co[n+"Box"]);
			windows[n].setButton();
			windows[n].setInitial(windowIni[n],this.defaultValue);
		});
		$.each(plugins, function (n){
			if(!windows[n])	return;
			this.win = windows[n];
			this.co = this.win.co;
		});
		//////////////////////////////
		ox.menu = new MenuClass(word.menuWord,ox.co.menu);
		ox.menu.setOpenEventTo(ox.co.relativeDivBox);
		ox.menu.setRunFun(ox.com);
		setStateEvent();
		ox.menu.accessKey(config.accessKey);

		$box.setInitial(ox.co.dialogBox, ox.co.dialogBoxBack);
		///////////////////////////////
		ox.event.run("windowsInitial");
		$.each(windows, function (n){
			if(wins[n].setup)
				wins[n].setup(this);
			this.initial();
		});
		//////////////////////////////
		ox.button.setTitle();
		ox.button.delegate();

		ox.screen = new ScreenClass(ox.co.infoText);
		ox.screen.text({fn:word.flieText});

		ox.time = new TimeBoxClass(ox.co.timeText);
		ox.time.reverse(config.reverseTime);

		ox.playlist = new ListClass(ox.co.playList);
		ox.playlist.setRunFun({click:playerList.go , pin:playerList.del});

		playerList.setLoopState(config.loop);

		player.setupSlider();
		player.setVolume(config.volume);

		if(config.openConsoleB)
			ox.openConsoleB();


		//ox.screen.clue(word.setupEnd);
	}

	ox.setup = function ()
	{
		loadJSON();
	}

	return ox;
})({});












$(window).bind("beforeunload", function() {
	ox.event.run("unload");
	//在离开页面时播放控件会先被系统回收。这时调用控件会出错，解决这些错误太麻烦了，直接屏蔽好了，反正要离开页面了 ^^
	window.onerror = function (){return true;};
});




ox.setup();


//播放器的代码 结束
},

/*==================================================*\
                    jQuery API
\*==================================================*/
//jQuery 开始

jQuery
//jQuery整合进来影响写代码时搜索关键字，等做好后再整合
//jQuery 结束
);
