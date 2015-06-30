/*==================================================*\
        浩海 O'ceanX播放器 --- LRC歌词插件
  -------------------------------------------------
	window.$oxplayer是播放器程序对外的唯一接口
\*==================================================*/
window.$oxplayer.plugin({
	name:	"lrc",				//插件名称
	style:	"style.css",		//加载样式表，可用于加载插件用到的CSS文件
	language: "{name}.txt",		//加载文字JSON数据
	pluginWindow: {
		html:
			'<div class="_wo_lrctextBoxBox">' +
			'  <div class="-ox-lrc-yCenter">' +
			'    <div class="_wo_lrcTextBox">' +
			'       <div class="_wo_lrcText"></div>' +
			'       <div class="_wo_lrcCurrent -ox-plugin-color1"></div>' +
			'       <div class="_wo_lrcPast -ox-plugin-color1"></div>' +
			'    </div>' +
			'  </div>' +
			'</div>' +
			'<div class="_wo_lrcSrtTimeBox -ox-plugin-background2 -ox-plugin-border1">' +
			'  <div class="-ox-lrcSrtTime -ox-plugin-background1">' +
			'  <abbr class="_wo_lrcTimeButton1 -ox-plugin-button1">-</abbr>' +
			'  <span class="_wo_lrcTimetitle"></span>' +
			'  <span class="_wo_lrcTimetext"></span>' +
			'  <abbr class="_wo_lrcTimeButton2 -ox-plugin-button1">+</abbr>' +
			'  </div>' +
			'  <div class="_wo_lrcgsh"></div>' +
			'</div>' +
			'' ,
		defaultValue: {
			drag:true,
			display:false,
			css:{
				position:"fixed",
				left:"auto",
				top:"auto",
				right:"0px",
				bottom:"0px",
				width:"170px",
				height:"110px"
			}
		}
	},

	//html: '' ,

	pluginFunction: function ($,$p,$o){
/*=================================================================================*\
	$				是jQuery对象 方便插件内使用

	$p				插件对象
	$p.name			插件名称
	$p.path			用户页面与插件目录的相对路径
	$p.win			插件创建的窗口控制对像，windowsInitial事件触发后可用
	$p.win.co		窗口内所有_wo_开头classs的集合，windowsInitial事件触发后可用
	$p.co			等于$p.win.co
	$p.word			文字JSON数据，loadWord事件触发后可用

	$o				播放器对像
	$o.co			所有_ox_开头classs的集合
	$o.event		播放器系统事件
	$o.com			执行菜单命令函数
	$o.box			对话框对象，windowsInitial事件触发后可用
	$o.player		播放对象
	$o.playerList	播放列表对象
	$o.$f			通用的函数
	$o.getObject()	获取对象的函数，用来获取主程序中没有提供给插件的对象

\*=================================================================================*/

var $f = $o.$f;
var player = $o.player;


$o.event.attach("loadWord", function (mw){
	mw[3].da.push({ na: $p.word.menuWord, com: "openLrc" });
});
$o.com.openLrc = function ()
{
	$p.win.minKg();
}

$o.event.attach("windowsInitial", function (){
	$p.win.setMove();
	$p.win.setResize(null,{minw: 180, minh: 150, maxw: 600, maxh: 500});
	$p.co.title.text($p.word.title);
	$p.win.event.attach("restate", function (v){
		$o.getObject("ox.menu").itemState("openLrc",v!=0);
	});

	lrc.setDrawing();
	lrc.setTimeButton();
	$p.co.lrcTimetitle.text($p.word.timetitle);
});

$o.event.attach("playStart", function (data){
	var url = data.lrc;
	if(!url)
	{
		$p.win.min();
		return;
	}
	$.get(url,function (str){
		$p.win.reMin();
		lrc.setData(str);
		lrc.start();
	},"text").error(function (e, xhr, settings, exception){
		alert("ajax出错: "+settings+"\n"+url);
	});
});

$o.event.attach("playEnd", function (){
	if($p.co.lrcText.text()=="") return;
	lrc.end();
	$p.win.min();
});




var lrc = (function (o)
{
	var data = [];			//数据
	var lineObj;			//每个行的Span
	var offsetTime = 0;		//余补时间
	var lineHeight;			//行高
	var boxHeight;
	var	interval;

	var startTime;			//当前行显示的s
	var endTime;			//当前行显示的e
	var current;			//当前行
	var currData;			//当前行数据

	o.moveing = false;
	var dragCurrent;		//拖拽时的当前行

	o.setData = function(tt)
	{
		var gsh = $p.word.gsh;
		data = [];
		offsetTime = /\[offset\:(\-?\d+)\]/i.test(tt)?RegExp.$1/1000:0; //取offset余补时间
		//提取属性信息
		gsh = gsh.replace("~1~",(/\[ar:(.+?)\]/i.test(tt))?RegExp.$1:"----");
		gsh = gsh.replace("~2~",(/\[ti:(.+?)\]/i.test(tt))?RegExp.$1:"----");
		gsh = gsh.replace("~3~",(/\[al:(.+?)\]/i.test(tt))?RegExp.$1:"----");
		gsh = gsh.replace("~4~",(/\[by:(.+?)\]/i.test(tt))?RegExp.$1:"----");
		$p.co.lrcgsh.html($f.HTMLEncode(gsh));
		reOffsetTime();

		tt = tt.replace(/\[\:\][^\r\n]*/g,"");		//去掉注解

		//处理时间标签
		tt = tt.replace(/([\[<])(\d{1,})\:(\d{1,2}(?:\.\d{0,})?)([\]>])/g,function(oz,oz1,oz2,oz3,oz4){ return "{"+(oz1=="["?"!":"&")+(parseInt(oz2,10) * 60 + parseFloat(oz3))+"}"; });

		//去掉其它标签
		tt = tt.replace(/\[[^\[\]]*\:[^\[\]]*\]/g,"");

		tt = tt.replace(/</g,"&lt;").replace(/>/g,"&gt;");

		tt.replace(/((?:\{![\d\.]+\})+)([^\r\n]*)/g,function(oz,oz1,oz2)
		{
			var darr = oz1.slice(2,-1).split("}{!");
    		$f.each(darr,function(v){
				data.push({ t:[parseFloat(v)] , w:[], ws:0 , n:$.trim(oz2) });
			});
		});

		data.sort(function(a,b){
			return a.t[0]-b.t[0];
		});

		var xstr = "";
		$f.each(data,function(v){
			xstr += "<div><font>"+ v.n.replace(/\{&([\d\.]+)\}/g,function(oz,oz1){
			    v.t.push(parseFloat(oz1));
				return "</font><font>";
			}) +"</font></div>";
		});
		lineObj = $p.co.lrcText.html(xstr).find("div");
		lineObj.each(function (i) {
			var sp = $(this);
			var sd = data[i];
			sp.find("font").each(function () {
				sd.ws += this.offsetWidth;
				sd.w.push(this.offsetWidth);
			});
			sd.n = sp.text();
			sp.css({width:sd.ws, marginLeft:-Math.floor(sd.ws/2)-14});//14是padding-left
		});
	}

	o.start = function ()		//运行开始
	{
		startTime = -1;		//当前行显示的s
		endTime = -1;		//当前行显示的e
		current = 0;		//当前行
		dragCurrent = -1;
		$p.co.lrcTextBox.css("top",0);
		lineHeight = $p.co.lrcCurrent.height();
		boxHeight =	$p.co.lrcText.height()-lineHeight;
		interval = setInterval(runing,100);
	}

	o.end = function ()		//运行结束
	{
		clearInterval(interval);
		$p.co.lrcCurrent.text("");
		$p.co.lrcPast.text("");
		$p.co.lrcText.text("");
		$p.co.lrcgsh.text("");
	}

	function runing()
	{
		var time = player.pos() + offsetTime;
		if(time<startTime || time>=endTime)
		{
			var hk = data.length-1;
			for(; hk>=0 && data[hk].t[0]>time; hk--){}
			if(hk<0) return;
			currData = data[hk];
			startTime = data[hk].t[0];
			endTime = (hk<data.length-1)?data[hk+1].t[0]:player.length() + offsetTime;

			reline(hk);
		}

		var bbw = 0;
		var ki = 0;
		while(ki<currData.t.length && currData.t[ki]<=time)
			bbw += currData.w[ki++];
		var kt = ki-1;
		var sc = ((ki<currData.t.length)?currData.t[ki]:endTime) - currData.t[kt];
		var tc = time - currData.t[kt];
		bbw -= currData.w[kt] - tc / sc * currData.w[kt];

		$p.co.lrcCurrent.width(Math.round(bbw));
	}

	function reline(l)
	{
		lineObj.eq(current).removeClass("-ox-plugin-color2");
		var zz = $p.co.lrcPast;
		$p.co.lrcPast = $p.co.lrcCurrent;
		$p.co.lrcCurrent = zz;
		$p.co.lrcPast.width("auto")
				.animate({opacity:0}, 600);
		current = l;
		lineObj.eq(current).addClass("-ox-plugin-color2");
		$p.co.lrcCurrent.text(data[current].n)
			.stop(true)
			.css({top:current*lineHeight , marginLeft:-Math.floor(data[current].ws/2) , opacity:1});
		if(!o.moveing)
			$p.co.lrcTextBox.stop(true).animate({top:-current*lineHeight}, 600);
	}


	o.setDrawing = function ()
	{
		new DrawingLrcClass(o,$p.co.lrcTextBox);
	}

	o.setTop = function (y)
	{
		y = y>0?0:y<-boxHeight?-boxHeight:y;
		$p.co.lrcTextBox.css("top",y);
		var dc = -Math.round(y/lineHeight);
		if(dragCurrent==dc)
			return;
		lineObj.eq(dragCurrent).removeClass("-ox-plugin-background1");
		dragCurrent = dc;
		lineObj.eq(dragCurrent).addClass("-ox-plugin-background1");
	}

	o.dragGo = function ()
	{
		lineObj.eq(dragCurrent).removeClass("-ox-plugin-background1");
		player.go(data[dragCurrent].t[0]-offsetTime+0.1);
	}

	function reOffsetTime()		//更新余补时间
	{
		$p.co.lrcTimetext.text(Math.round(offsetTime*1000));
	}

	o.setTimeButton = function ()
	{
		$p.co.lrcTimeButton1.click(function(event){
			offsetTime -= 0.1;
			reOffsetTime();
		});
		$p.co.lrcTimeButton2.click(function(event){
			offsetTime += 0.1;
			reOffsetTime();
		});
		$p.co.lrctextBoxBox.dblclick(function(event){
			var gt = $p.co.lrctextBoxBox.offset().left-$(document).scrollLeft() < $p.co.lrcSrtTimeBox.outerWidth();
			$p.co.lrcSrtTimeBox.toggleClass("-ox-lrc-r",gt);
			$p.co.lrcSrtTimeBox.toggle(300);
		});
	}

	return o;
})({});





var DrawingLrcClass = $f.Class(function(t,cid)		// **Lrc拖拽Class**
{
	this.obj = t;
	this.Super(cid,6);		//调用父类的构造函数
},{
	extend: $o.getObject("DrawingClass") ,

	down: function (x,y)
	{
		this.d = y - this.cid.position().top;
	} ,

	move: function (x,y)
	{
	    y -= this.d;
		this.obj.setTop(y);
	} ,

	up: function ()
	{
		this.obj.dragGo();
		this.obj.moveing = false;
	} ,

	moveStart: function ()
	{
		this.cid.stop(true);
		this.obj.moveing = true;
	}
});


//////////////////////////////////////
	}
});




