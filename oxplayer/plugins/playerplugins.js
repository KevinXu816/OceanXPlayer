/*==================================================*\
        浩海 O'ceanX播放器 --- 播放插件
  -------------------------------------------------
	window.$oxplayer是播放器程序对外的唯一接口
\*==================================================*/

/*
=====================【目录】=====================
   * Windows Media Player插件
   * html5 video 插件
   * Real Player插件
==================================================
*/
window.$oxplayer.plugin({name:"playerplugins",pluginFunction: function ($,$p,$o){

/*==================================================*\
               检测当前浏览器
\*==================================================*/
(function ()
{
	var ua = navigator.userAgent.toLowerCase();
	var s;
	var Sys = $o.$f.browser;
	(s = ua.match(/msie ([\d.]+)/))			? Sys.ie = s[1] :
	(s = ua.match(/firefox\/([\d.]+)/))		? Sys.firefox = s[1] :
	(s = ua.match(/chrome\/([\d.]+)/))		? Sys.chrome = s[1] :
	(s = ua.match(/opera.([\d.]+)/))		? Sys.opera = s[1] :
	(s = ua.match(/version\/([\d.]+).*safari/)) ? Sys.safari = s[1] :
	null;
})();

/*==================================================*\
               Windows Media Player插件
\*==================================================*/

$o.player.plugins.wmp = (function (o)		// **Windows Media Player插件**
{
	o.extensionVideo = "mpg mpeg mpe mpa avi wmv wvx ivf dat asf wav";
	o.extensionAudio = "m1v mp2 mpv2 mp2v mp3 mid midi rmi wma wax aif aifc aiff au snd swa m3u";
	o.protocol = "mms mmst";

	o.objBox = null;				//插件div
	o.eventRun = null;				//插件事件所执行的函数

	var object;						//插件对像

	o.sustain = function ()			//检测当前系统是否支持本插件
	{
		return !!document.all;
	}

	o.initial = function ()			//初始化插件
	{
		var html =
		'<object classid="clsid:6BF52A52-394A-11D3-B153-00C04F79FAA6">'+
		'    <param name="url" value="">'+
		'    <param name="rate" value="-1">'+
		'    <param name="balance" value="0">'+
		'    <param name="currentPosition" value="0">'+
		'    <param name="playCount" value="1">'+
		'    <param name="autoStart" value="-1">'+
		'    <param name="currentMarker" value="0">'+
		'    <param name="invokeURLs" value="-1">'+
		'    <param name="volume" value="0">'+
		'    <param name="mute" value="0">'+
		'    <param name="uiMode" value="none">'+
		'    <param name="stretchToFit" value="-1">'+
		'    <param name="windowlessVideo" value="-1">'+
		'    <param name="enabled" value="-1">'+
		'    <param name="enableContextMenu" value="0">'+
		'    <param name="fullScreen" value="0">'+
		'    <param name="enableErrorDialogs" value="0">'+
		'</object>'+
		'';

		o.objBox[0].innerHTML = html;
		object = o.objBox.find("object")[0];

		var ap = object.attachEvent?"attachEvent":"addEventListener";
		object[ap]("PlayStateChange", playStateChange);
		object[ap]("Error", error);

		$o.event.attach("unload", unload);
	}

	o.initEnded = function ()			//插件初始化状态(是否初始化完成)
	{
		return !!object.controls;
	}

	var playStateChange = function(state)	//改变播放状态事件
	{
		if(!o.eventRun)	return;
		var sv = {
			"1":"stopped",
			"2":"paused",
			"3":"playing",
			"6":"buffering",
			"7":"waiting",
			"8":"mediaEnded",
			"9":"transitioning",
			"10":"ready",
			"11":"reconnecting"
		}[state];
		o.eventRun("state", sv);
		if(state==8)
			o.eventRun("playEnd");
/***********************************
	"stopped": "停止",
	"paused": "暂停",
	"playing": "正在播放",
	"buffering": "缓冲",
	"waiting": "等待开始",
	"mediaEnded": "播放已结束",
	"transitioning": "准备新媒体",
	"ready": "准备就绪",
	"reconnecting": "重新连接",
	"error": "媒体出错",
	"undefined": "未知状态"
***********************************/
	}

	var error = function()	//改变播放状态事件
	{
		if(!o.eventRun)	return;
		o.eventRun("state", "error");
		o.eventRun("error");
	}

	var unload = function()	//离开页面时执行
	{
		var ap = object.detachEvent?"detachEvent":"removeEventListener";
		object[ap]("PlayStateChange", playStateChange);
		object[ap]("Error", error);
		object = undefined;
	}


	o.open = function(d)	//路径 方法
	{
		object.url = $o.$f.getAbsolutePath(d.url);
		try {
			o.play();
		} catch(hh){}
	}

	o.closed = function()	//关闭控件 方法
	{
		o.stop();
	}

	o.reLoad = function()	//重新载入 方法
	{
		o.play();
	}

	o.play = function()		//播放 方法
	{
		object.controls.play();
	}

	o.pause = function()	//暂停 方法
	{
		object.controls.pause();
	}

	o.stop = function()		//停止 方法
	{try {
		object.controls.stop();
		object.controls.currentPosition = 0;
	} catch(hh){}}

	o.go = function(s)		//转到 方法
	{
		object.controls.currentPosition = s;
	}

	o.pos = function()		//当前位置 方法
	{
		return object.controls.currentPosition;
	}

	o.length = function()	//总长度 方法
	{
		return object.currentMedia.duration;
	}

	o.isPlay = function()	//是否正在播放
	{
		var ps = object.PlayState;
		return /^(3|6|7|9|11)$/.test(ps);
	}

	o.volume = function(s)	//调节音量 方法
	{
		object.settings.volume = s;
	}

	o.mute = function(s)	//静音 方法
	{
		object.settings.mute = s;
	}

	o.fullScreen = function()	//全屏 方法
	{
		if(object.PlayState!=3)
			return "no";
		try {
			object.fullScreen=1;
		} catch(hh){}
	}

	o.simulateEvent = function()	//模拟事件
	{
	}


	return o;
})({});






/*==================================================*\
                   html5 video插件
\*==================================================*/

$o.player.plugins.html5Video = (function (o)		// **html5 video插件**
{
	o.extensionVideo = "avi mp4 webm";
	o.extensionAudio = "mp3 ogg wav";
	o.protocol = "";

	o.objBox = null;				//插件div
	o.eventRun = null;				//插件事件所执行的函数

	var object;						//插件对像

	o.sustain = function ()			//检测当前系统是否支持本插件
	{
		return !!document.createElement("video").canPlayType;
	}

	o.initial = function ()			//初始化插件
	{
		var html =
		'<video autoplay="autoplay" style="background:#000000;">'+
		'</video>'+
		'';
		o.objBox[0].innerHTML = html;
		var obj = o.objBox.find("video");
		obj.bind({
			"playing": playingE ,
			"pause": pauseE ,
			"loadstart": loadstartE ,
			"canplay": canplayE ,
			"ended": endedE ,
			"error": error
		});
		object = obj[0];

		$o.event.attach("unload", unload);
	}

	o.initEnded = function ()			//插件初始化状态(是否初始化完成)
	{
		return !!object.canPlayType;
	}

/***********************************
	"stopped": "停止",
	"paused": "暂停",
	"playing": "正在播放",
	"buffering": "缓冲",
	"waiting": "等待开始",
	"mediaEnded": "播放已结束",
	"transitioning": "准备新媒体",
	"ready": "准备就绪",
	"reconnecting": "重新连接",
	"error": "媒体出错",
	"undefined": "未知状态"
***********************************/
	var playingE = function()	//事件
	{
		if(!o.eventRun)	return;
		o.eventRun("state", "playing");
	}
	var pauseE = function()	//事件
	{
		if(!o.eventRun)	return;
		o.eventRun("state", "paused");
	}
	var loadstartE = function()	//事件
	{
		if(!o.eventRun)	return;
		o.eventRun("state", "transitioning");
	}
	var canplayE = function()	//事件
	{
		if(!o.eventRun)	return;
		o.eventRun("state", "buffering");
	}
	var endedE = function()	//事件
	{
		if(!o.eventRun)	return;
		o.eventRun("state", "mediaEnded");
		o.eventRun("playEnd");
	}

	var error = function()	//事件
	{
		if(!o.eventRun)	return;
		o.eventRun("state", "error");
		o.eventRun("error");
	}

	var unload = function()	//离开页面时执行
	{
		$(object).unbind({
			"playing": playingE ,
			"pause": pauseE ,
			"loadstart": loadstartE ,
			"canplay": canplayE ,
			"ended": endedE ,
			"error": error
		});
		object = undefined;
	}


	o.open = function(d)	//路径 方法
	{
		object.src = d.url;
		try {
			o.play();
		} catch(hh){}
	}

	o.closed = function()	//关闭控件 方法
	{
		o.stop();
	}

	o.reLoad = function()	//重新载入 方法
	{
		object.load();
	}

	o.play = function()		//播放 方法
	{
		object.play();
	}

	o.pause = function()	//暂停 方法
	{
		object.pause();
	}

	o.stop = function()		//停止 方法
	{try {
		object.currentTime = 0;
		object.pause();
	} catch(hh){}}

	o.go = function(s)		//转到 方法
	{
		object.currentTime = s;
	}

	o.pos = function()		//当前位置 方法
	{
		return object.currentTime;
	}

	o.length = function()	//总长度 方法
	{
		return object.duration;
	}

	o.isPlay = function()	//是否正在播放
	{
		return !object.paused;
	}

	o.volume = function(s)	//调节音量 方法
	{
		object.volume = s/100;
	}

	o.mute = function(s)	//静音 方法
	{
		object.muted = s;
	}

	o.fullScreen = function()	//全屏 方法
	{
		return "no";
		//try {
			//object.fullScreen=1;
		//} catch(hh){}
	}

	o.simulateEvent = function()	//模拟事件
	{
	}

	return o;
})({});






/*==================================================*\
                  Real Player插件
\*==================================================*/

$o.player.plugins.real = (function (o)		// **Real Player插件**
{
	o.extensionVideo = "rmvb";
	o.extensionAudio = "rmj smi smil ssm ra rm ssm ram rpm ra rmm";
	o.protocol = "rtsp";

	o.objBox = null;				//插件div
	o.eventRun = null;				//插件事件所执行的函数

	var object;						//插件对像

	o.sustain = function ()			//检测当前系统是否支持本插件
	{
		if(!document.all) return false;
		var real = document.createElement("object");
		try {
			real.classid="clsid:CFCDAA03-8BE4-11cf-B84B-0020AFBBCCFA";
			if(real.GetLength()>=0) return true;
		} catch(ee) {
			return false;
		}
	}

	o.initial = function ()			//初始化插件
	{
		var html =
		'<object classid="clsid:CFCDAA03-8BE4-11cf-B84B-0020AFBBCCFA">'+
		'    <param name="AUTOSTART" value="-1">'+
		'    <param name="SHUFFLE" value="0">'+
		'    <param name="PREFETCH" value="0">'+
		'    <param name="NOLABELS" value="-1">'+
		'    <param name="CONTROLS" value="Imagewindow">'+
		'    <param name="LOOP" value="0">'+
		'    <param name="NUMLOOP" value="0">'+
		'    <param name="CENTER" value="0">'+
		'    <param name="MAINTAINASPECT" value="0">'+
		'</object>'+
		'';

		o.objBox[0].innerHTML = html;
		object = o.objBox.find("object")[0];

		object.SetEnableContextMenu(false);
		object.SetWantErrors(true);
		object.SetWantMouseEvents(true);
		if(object.attachEvent)
		{
			//object.attachEvent("onShowStatus", showStatus);
			object.attachEvent("onPlayStateChange", playStateChange);
			object.attachEvent("onErrorMessage", error);
		}
		else
		{
			//object.addEventListener("ShowStatus", showStatus);
			object.addEventListener("PlayStateChange", playStateChange);
			object.addEventListener("ErrorMessage", error);
		}

		$o.event.attach("unload", unload);
	}

	o.initEnded = function ()			//插件初始化状态(是否初始化完成)
	{
		try {
			if(object.GetLength()>=0) return true;
		} catch(ee) {
			return false;
		}
	}

	var playStateChange = function(state)	//改变播放状态事件
	{
		if(!o.eventRun)	return;
		var sv = {
			"0":"stopped",
			"4":"paused",
			"3":"playing",
			"2":"buffering",
			"1":"waiting",
			"5":"buffering"
		}[state];
		o.eventRun("state", sv);
/***********************************
	"stopped": "停止",
	"paused": "暂停",
	"playing": "正在播放",
	"buffering": "缓冲",
	"waiting": "等待开始",
	"mediaEnded": "播放已结束",
	"transitioning": "准备新媒体",
	"ready": "准备就绪",
	"reconnecting": "重新连接",
	"error": "媒体出错",
	"undefined": "未知状态"
***********************************/
	}

	var showStatus = function()	//改变播放状态事件
	{
		if(!o.eventRun)	return;
	}

	var error = function()	//改变播放状态事件
	{
		if(!o.eventRun)	return;
		o.eventRun("state", "error");
		o.eventRun("error");
	}

	var unload = function()	//离开页面时执行
	{
		if(object.detachEvent)
		{
			//object.detachEvent("onShowStatus", showStatus);
			object.detachEvent("onPlayStateChange", playStateChange);
			object.detachEvent("onErrorMessage", error);
		}
		else
		{
			//object.removeEventListener("ShowStatus", showStatus);
			object.removeEventListener("PlayStateChange", playStateChange);
			object.removeEventListener("ErrorMessage", error);
		}

		object = undefined;
	}


	o.open = function(d)	//路径 方法
	{
		object.setSource($o.$f.getAbsolutePath(d.url));
		setTimeout(o.play,1000);
	}

	o.closed = function()	//关闭控件 方法
	{
		o.stop();
	}

	o.reLoad = function()	//重新载入 方法
	{
		o.play();
	}

	o.play = function()		//播放 方法
	{
		if(object.CanPlay())
			object.DoPlay();
	}

	o.pause = function()	//暂停 方法
	{
		if(object.CanPause())
			object.DoPause();
	}

	o.stop = function()		//停止 方法
	{try {
		if(object.CanStop())
		{
			object.DoStop();
			object.SetPosition(0);
		}
	} catch(hh){}}

	o.go = function(s)		//转到 方法
	{
		object.SetPosition(s*1000);
	}

	o.pos = function()		//当前位置 方法
	{
		return object.GetPosition()/1000;
	}

	o.length = function()	//总长度 方法
	{
		return object.GetLength()/1000;
	}

	o.isPlay = function()	//是否正在播放
	{
		var ps = object.GetPlayState();
		return  ps!=0 && ps!=4;
	}

	o.volume = function(s)	//调节音量 方法
	{
		object.SetVolume(s);
	}

	o.mute = function(s)	//静音 方法
	{
		object.SetMute(s);
	}

	o.fullScreen = function()	//全屏 方法
	{
		if(object.GetPlayState()!=3)
			return "no";
		try {
			object.SetFullScreen();
		} catch(hh){}
	}

	var playEndTimeout;
	o.simulateEvent = function()	//模拟事件
	{
	    if(o.length()>0 && o.length()-o.pos()<=1)
		{
			clearTimeout(playEndTimeout);
			playEndTimeout = setTimeout(function(){
				o.eventRun("state", "mediaEnded");
				o.eventRun("playEnd");
			},1000);
		}
	}

	return o;
})({});













/*==================================================*\
				检测html5 video能播放的格式
html5 video可以自动检测能播放的格式，不需要判断浏览器
\*==================================================*/
(function (){
	var obj = document.createElement("video");
	if(!obj.canPlayType) return;
	function canExtension(es,va)
	{
		return es.replace(/(\w+)\s*/g,function (sall,ex){
			if(obj.canPlayType(va+'/'+ex)!="")
				return sall;
			else
				return "";
		})
	}
	var o = $o.player.plugins.html5Video;
	o.extensionVideo = canExtension(o.extensionVideo,"video");
	o.extensionAudio = canExtension(o.extensionAudio,"audio");
})();

/*==================================================*\
\*==================================================*/


}});



