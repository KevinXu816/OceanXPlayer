/*==================================================*\
        浩海 O'ceanX播放器 --- 列表操作插件
\*==================================================*/
window.$oxplayer.plugin({
	name:	"list",				//插件名称
	//style:	"style.css",		//加载样式表，可用于加载插件用到的CSS文件
	language: "{name}.txt",		//加载文字JSON数据
	//pluginWindow:,
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
var playerList = $o.playerList;

$o.event.attach("loadWord", function (mw){
	mw[1].da = mw[1].da.concat($p.word.menuWord);
});

$o.com.returnList = function ()
{
	returnList.re();
}
$o.com.saveList = function ()
{
	userList.save();
}
$o.com.loadList = function ()
{
	userList.load();
}
$o.com.editList = function ()
{
	editList.open();
}

////////////////////////////////////////////////////////////////////

var editList = (function (o)		//编辑播放列表对像
{
	var dom, typeSele, listSele;
	var playList;
	var editPlayList = false;
	var editUserList = false;
	var edList;					//正在编辑的列表数据
	var copyData = [];			//copy数据




	function createDom()			//创建对话框的表单dom
	{
		if(dom) return;
		var html = $p.word.selectList;
		html += '<select style="width:160px"><option>'+$p.word.playList+'</option></select><br />';
		html += '<input type="button" style="width:70px" value="'+$p.word.buttonValue2[0]+'" />';
		html += '<input type="button" style="width:70px" value="'+$p.word.buttonValue2[1]+'" />';
		html += '<input type="button" style="width:70px" value="'+$p.word.buttonValue2[2]+'" /><br />';
		html += '<select style="width:224px" size=10 multiple="multiple"></select><br />';
		html += '<input type="button" style="width:44px" value="'+$p.word.buttonValue[0]+'" />';
		html += '<input type="button" style="width:44px" value="'+$p.word.buttonValue[1]+'" />';
		html += '<input type="button" style="width:44px" value="'+$p.word.buttonValue[2]+'" />';
		html += '<input type="button" style="width:44px" value="'+$p.word.buttonValue[3]+'" />';
		html += '<input type="button" style="width:44px" value="'+$p.word.buttonValue[4]+'" />';
		html += '<br />&nbsp;&nbsp;&nbsp;&nbsp;';
		html += '<input type="button" style="width:44px" value="'+$p.word.buttonValue[5]+'" />';
		html += '<input type="button" style="width:44px" value="'+$p.word.buttonValue[6]+'" />';
		html += '<input type="button" style="width:44px" value="'+$p.word.buttonValue[7]+'" />';
		html += '<input type="button" style="width:44px" value="'+$p.word.buttonValue[8]+'" />';
		dom = $("<div></div>",{html:html});
		var select = $("select",dom);
		typeSele = select[0];
		listSele = select[1];
		$(typeSele).change(typechange);
		var button = $("input",dom);
		button.eq(0).click(newUserList);
		button.eq(1).click(renameUserList);
		button.eq(2).click(delUserList);
		button.eq(3).click(moveUp);
		button.eq(4).click(moveDown);
		button.eq(5).click(allSelect);
		button.eq(6).click(reSelect);
		button.eq(7).click(noSelect);
		button.eq(8).click(cut);
		button.eq(9).click(copy);
		button.eq(10).click(stick);
		button.eq(11).click(del);
	}

	function editde()				//有列表编辑过了
	{
		if(typeSele.selectedIndex==0)
			editPlayList = true;
		else
			editUserList = true;
	}

	function typechange()			//用户列表change事件
	{
		listUpdate(this.selectedIndex);
	}

	function moveUp()				//上移按钮
	{
		if(listSele.selectedIndex==-1) return;
		var so = listSele.options;
		var np;
		for(var i=0, l = so.length; i < l; ++i)
			if(so[i].selected)
			{
				np = i;
				break;
			}
		var tmp = copyData;
		cut();
		np -= 2;
		np = np<-1?-1:np;
		listSele.selectedIndex = np;
		stick();
		copyData = tmp;
	}
	function moveDown()				//下移按钮
	{
		if(listSele.selectedIndex==-1) return;
		var so = listSele.options;
		var np;
		for(var i=so.length-1, l = 0; i >= l; --i)
			if(so[i].selected)
			{
				np = i;
				break;
			}
		var tmp = copyData;
		cut();
		np += 1-copyData.length;
		np = np>=so.length?so.length-1:np;
		listSele.selectedIndex = np;
		stick();
		copyData = tmp;
	}

	function allSelect()			//全选按钮
	{
		$.each(listSele.options,function(){
			this.selected = true;
		});
	}
	function reSelect()				//反选按钮
	{
		$.each(listSele.options,function(){
			this.selected = !this.selected;
		});
	}
	function noSelect()				//不选按钮
	{
		$.each(listSele.options,function(){
			this.selected = false;
		});
	}

	function cut()					//剪切按钮
	{
		copy();
		del();
	}

	function copy()					//复制按钮
	{
		if(listSele.selectedIndex==-1) return;
		copyData = [];
		$f.each(listSele.options,function(d,ii){
			if(d.selected)
				copyData.push(edList[ii]);
		});
	}

	function stick()				//粘贴按钮
	{
		addGF(copyData);
	}

	function del()					//删除按钮
	{
		if(listSele.selectedIndex==-1) return;
		delGF();
		listUpdateGF();
		listSele.selectedIndex = -1;
		editde();
	}

	function addGF(d)		//添加 动作
	{
		var ki = listSele.selectedIndex;
		var n = ki+1;
		var dl = $.isArray(d)?d.length:1;
		edList.splice.apply(edList,[n,0].concat(d));
		listUpdateGF();
		listSele.selectedIndex = n;
		for(var i=n; i<=ki+dl; i++)
			listSele.options[i].selected = true;
		editde();
	}

	function delGF()		//删除 动作
	{
		$f.eachre(listSele.options,function(d,ii){
			if(d.selected)
				edList.splice(ii,1);
		});
	}

	function typeUpdate()			//用户列表更新
	{
		var so = typeSele.options;
		var ii = 1;
		$.each(userList.uls,function(n){
			so.length = ii+1;
			so[ii++].text = n;
		});
	}

	function newUserList()				//新建列表
	{
		var ti = typeSele.selectedIndex;

		var newname,nui=1;
		do {
			newname = $p.word.newList + (nui++);
		} while(userList.uls[newname]);

		$o.box.prompt($p.word.newListName,newname,180,$p.word.newList,newUserListOk);
	}
	function newUserListOk(n,d,formjq)
	{
		var name = d[0].value;
		if(name=="")
		{
			alert($p.word.clue1);
			return false;
		}
		if(/[<>\"\'\\\/.,]/.test(name))
		{
			alert(unescape($p.word.clue2));
			return false;
		}
		if(userList.uls[name])
		{
			alert('"'+name+'" '+ $p.word.clue3);
			return false;
		}
		userList.uls[name] = [];
		editde();
		typeUpdate();
		listUpdate(typeSele.length-1);
	}


	function renameUserList()			//列表改名
	{
		var ti = typeSele.selectedIndex;
		if(ti<=0) return;
		var name = typeSele.options[ti].text;
		$o.box.prompt($p.word.newListName,name,180,$p.word.renameList,renameUserListOk);
	}
	function renameUserListOk(n,d,formjq)
	{
		var name = d[0].value;
		var ti = typeSele.selectedIndex;
		var yname = typeSele.options[ti].text;
		if(name=="")
		{
			alert($p.word.clue1);
			return false;
		}
		if(/[<>\"\'\\\/.,]/.test(name))
		{
			alert(unescape($p.word.clue2));
			return false;
		}
		if(userList.uls[name])
		{
			alert('"'+name+'" '+ $p.word.clue3);
			return false;
		}

		userList.uls[name] = userList.uls[yname];
		delete userList.uls[yname];
		editde();
		typeUpdate();
		listUpdate(typeSele.length-1);
	}


	function delUserList()				//删除列表
	{
		var ti = typeSele.selectedIndex;
		if(ti<=0) return;
		if(!confirm($p.word.delUserList)) return;
		delete userList.uls[typeSele.options[ti].text];
		editde();
		typeUpdate();
		listUpdate(0);
	}

	function listUpdate(io)			//列表项目更新
	{
		typeSele.selectedIndex = io;
		edList = io==0 ? playList : userList.uls[typeSele.options[io].text];
		listUpdateGF();
		listSele.selectedIndex = -1;
	}

	function listUpdateGF()	//列表项目更新 动作
	{
		var so = listSele.options;
		so.length = edList.length;
		$.each(edList,function(ii){
			so[ii].text = (ii+1)+"."+this.name;
		});
	}

	o.open = function()
	{
		createDom();
		playList = playerList.getList();
		typeUpdate();
		listUpdate(0);
		editPlayList = editUserList = false;

		$o.box.dialog({ text: dom , width: 240 , title: $p.word.editList , fun: close, bs: $p.word.dialogBs2 });
	}

	function close()
	{
		dom.detach();
		if(editUserList)
			userList.userSave();
		if(editPlayList)
		{
			returnList.save = false;
			playerList.update(playList,false);
		}
	}

	return o;


})({});



////////////////////////////////////////////////////////////////////

var returnList = (function (o)		//召回列表
{
	var rls = [];		//上几次的列表保存
	o.save = true;		//是否保存本次列表

	$o.event.attach("reList",function (list)
	{
		if(list.length<=0) return;
		if(!o.save)
		{
			o.save = true;
			return;
		}
		rls.unshift(list);
		rls = rls.slice(0,9);
	});

	o.re = function ()
	{
		if(rls.length<=0)
		{
			$o.box.alert($p.word.noList,210,null,"logo");
			return;
		}
		o.save = false;
		playerList.update(rls.shift());
	}


	return o;
})({});

////////////////////////////////////////////////////////////////////////////

var userList = (function (o)		//用户列表
{
	o.uls = {};		//用户列表

	o.userSave = function ()	//本地存储 保存
	{
		var userS = window.localStorage;		//本地存储
		if(!userS)
			return;
		var ts = $f.JSON.stringify(o.uls);
		if(ts.length>1024*1024*2)
		{
			alert($p.word.newListMax);
			return;
		}
		userS.oxUserList = ts;
	}

	o.userLoad = function ()	//本地存储 读取
	{
		var userS = window.localStorage;		//本地存储
		if(!userS)
		{
			o.uls = {};
			return;
		}
		var json = userS.oxUserList || "{}";
		try {
			o.uls = $f.JSON.parse(json);
			if(o.uls.constructor!==Object)
				o.uls = {};
		} catch(e) {
			o.uls = {};
		}
	}

	o.save = function ()
	{
		var newname,nui=1;
		do {
			newname = $p.word.newList + (nui++);
		} while(o.uls[newname]);

		var option = "";
		$.each(o.uls,function(n){
			option += '<option value="'+n+'">'+n+'</option>';
		});

		var html = '<input type="radio" name="sf" value="1" id="oxUUid1" checked="checked" /><label for="oxUUid1">'+$p.word.newList+':<input type="text" name="newname" value="'+newname+'" style="width:140px" /></label>';
		html += '<br /><input type="radio" name="sf" value="2" id="oxUUid2" '+(option==""?'disabled="disabled"':'')+' /><label for="oxUUid2">'+$p.word.reList+':<select name="namelist" style="width:150px">'+option+'</select></label>';

		$o.box.dialog({ text: html , width: 240 , title: $p.word.saveList , fun: saveFunc, bs: $p.word.dialogBs1 });
	}

	function saveFunc(n,d,formjq)
	{
		var form = formjq[0];
		var name = form.sf[0].checked?form.newname.value:form.namelist.value;
		if(name=="")
		{
			alert($p.word.clue1);
			return false;
		}
		if(/[<>\"\'\\\/.,]/.test(name))
		{
			alert(unescape($p.word.clue2));
			return false;
		}
		o.uls[name] = playerList.getList();
		o.userSave();
	}

	o.load = function ()
	{
		var arr = [];
		$.each(o.uls,function(n){
			arr.push(n);
		});
		$o.box.radio($p.word.loadList2,arr,200,$p.word.loadList,loadFunc);
	}

	function loadFunc(n,d)
	{
		if(d.length==0) return;
		playerList.update(o.uls[d[0].value]);
	}

	return o;
})({});

userList.userLoad();

//////////////////////////////////////
	}
});
