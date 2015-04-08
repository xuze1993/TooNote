var $editor = document.querySelector('#editor');
var $preview = document.querySelector('#preview');
var $sidebar = document.querySelector('#sidebar');

var openNewWindow = function(cssArr,jsArr,action,message){

	var newWindow = window.open('file://' + __dirname + '/blank.html','newWindow','');
	
	newWindow.webContents.on('did-finish-load',function(){
		console.log('ready');
		newWindow.webContents.send('loadCss',cssArr);
		newWindow.webContents.send('loadJs',jsArr);
		newWindow.webContents.send(action,message);
		// 开发环境打开调试工具
		if(!/app$/.test(__dirname)){
			newWindow.openDevTools();
		}
	});
};

exports.openNoteInNewWindow = function(note){
	openNewWindow([
		'./editor.css',
		'./monokai_sublime.css'
	],[
		'./highlight.pack.js',
	],'loadNote',note);
};

exports.renderPreview = function(note){
	var $preview = document.querySelector('#preview');
	var marked = require('marked');
	var previewRenderer = new marked.Renderer();
	var index = 0;
	previewRenderer.heading = function (text, level) {
		return '<h' + level + '><a name="anchor'+(index++)+'">'+ text + '</a></h' + level + '>';
	};
	var html = marked(note.content,{renderer:previewRenderer});
	$preview.innerHTML = html;

	Array.prototype.forEach.call($preview.querySelectorAll('pre code'),function($code){
		hljs.highlightBlock($code.parentNode);
	});
	var todo = require('./todo');
	var $allLi = $preview.querySelectorAll('li');
	for(var i = $allLi.length;i--;){
		var $li = $allLi[i];
		$li.innerHTML = todo.parseTodo($li.innerHTML);
	}

	var toc = require('marked-toc');
	var tocMarkdown = toc(note.content);
	var tocRenderer = new marked.Renderer();
	index = 1;
	tocRenderer.link = function(href,title,text){
		return '<a href="#anchor'+(index++)+'" title="'+text+'">'+text+'</a>';
	};
	var tocHtml = marked(tocMarkdown,{renderer:tocRenderer});
	var $toc = document.querySelector('#toc');
	if(tocHtml){
		$toc.innerHTML = tocHtml;
		$toc.classList.remove('hide');
	}else{
		$toc.classList.add('hide');
	}
};

exports.init = function(){
	var _this = this;
	var hideTabs = JSON.parse(localStorage.getItem('toonote_hideTabs') || '[]');
	window.addEventListener('DOMContentLoaded',function(){
		hideTabs.forEach(function(hideTab){
			_this.switchVisible(hideTab);
		});
	});
};

// 切换各栏显示状态
exports.switchVisible = function(eleName){

	var $ele;

	switch(eleName){
		case 'sidebar':
			$ele = $sidebar;
			break;
		case 'editor':
			$ele = $editor;
			break;
		case 'preview':
			$ele = $preview;
			break;
	}

	if($ele.classList.contains('hide')){
		$ele.classList.remove('hide');
	}else{
		$ele.classList.add('hide');
	}

	var sidebarVisible = !$sidebar.classList.contains('hide');
	var editorVisible = !$editor.classList.contains('hide');
	var previewVisible = !$preview.classList.contains('hide');

	var editorStatus = sidebarVisible?
		(previewVisible?'normal':'aloneWithSidebar'):
		(previewVisible?'noSidebar':'alone');
	var previewStatus = sidebarVisible?
		(editorVisible?'normal':'aloneWithSidebar'):
		(editorVisible?'noSidebar':'alone');

	if(editorVisible){
		$editor.classList.remove('aloneWithSidebar','noSidebar','alone');
		$editor.classList.add(editorStatus);
	}
	if(previewVisible){
		$preview.classList.remove('aloneWithSidebar','noSidebar','alone');
		$preview.classList.add(previewStatus);
	}

	var hideTabs = [];
	if(!sidebarVisible){
		hideTabs.push('sidebar');
	}
	if(!editorVisible){
		hideTabs.push('editor');
	}
	if(!previewVisible){
		hideTabs.push('preview');
	}

	localStorage.setItem('toonote_hideTabs',JSON.stringify(hideTabs));

};