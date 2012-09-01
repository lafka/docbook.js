docbook = {};

docbook.model = {
	req : function(url) {
		var req = null;

		if (window.XMLHttpRequest) {
			req = new XMLHttpRequest();
		} else {
			req = new ActiveXObject("Microsoft.XMLHTTP");
		}

		req.open("GET", url, false);
		req.send();

		return req.responseText;
	},
	fetchCollection : function(path) {
		var dom = document.createElement('html');
		dom.innerHTML = docbook.model.req(path);

		var tags = dom.getElementsByTagName('a');
		var docs = [];
		var dir  = false;

		for (var i = 0; i < tags.length; i++) {
			if ('.' == tags[i].innerText.substring(0, 1) ||
			    '/' == tags[i].innerText.substring(0, 1)) {
				continue;
			}
			dir  = '/' == tags[i].innerText.substr(-1);
			name = tags[i].innerText;

			docs.push({
				type : dir ? 'collection' : 'item',
				link : tags[i].getAttribute('href'), 
				name : dir ? name : docbook.model.rewriteName(name)
			});
		}

		return docs;
	},
	fetchItem : function (path) {
		var name  = path.replace(/^.*\/([^/]+)$/, '$1');
		var ipath = path.replace(/^(.*\/)[^/]+$/, '$1');
		return {
			name   : name, 
			path   : path,
			parent : ipath,
			body   : docbook.model.req(path),
		};
	},
	rewriteName : function(text) {
		text = text.replace(/\.[^.]$/, '');
		return text.replace(/[_+]/g, '');
	}

};

docbook.view = {
	collection : function (container, data, controller) {
		if (0 == data.collection.length) {
			var error = document.createElement('div');
			error.className = 'alert alert-error';
			docbook.view.setTitle("Not found", controller.opts);

			container.innerHTML = "<p class=\"alert alert-warning\">" +
				"Sorry, the resource your where looking for could not " +
				"be found.</p>";
			return;
		}

		var render = document.createElement('ul');
 		var item   = undefined

		item = docbook.view.addLink(data.parent + " (parent)",
			data.parent,
			controller);
		item.className = 'parent';

		render.appendChild(item);

		for (var i in data.collection) {
			item = docbook.view.addLink(data.collection[i].name,
				data.collection[i].link,
				controller);
			render.appendChild(item);
		}
			
		docbook.view.setTitle(data.name, controller.opts);
		container.innerHTML = "";
		container.appendChild(render);
	},
	item : function(container, data, controller) {
		convert = new Markdown.getSanitizingConverter().makeHtml;

		render = document.createElement('div');
		container.innerHTML = "";
		var name = data.name.replace(/[_.-]/g, ' ');

		var breadcrumb = document.createElement('ul');
		breadcrumb.className = "breadcrumb";

		var parts = data.path.split('/');
		var acc   = '';

		for (var i in parts) {
			acc += parts[i] + '/';
			parts[i] += ' <span class="divider">/</span>';
			breadcrumb.appendChild(docbook.view.addLink(parts[i], acc, controller));
		}
		
		docbook.view.setTitle(name, controller.opts);
		data.body = docbook.view.normalizeLinebreaks(data.body);
		render.innerHTML = "<ul class=\"breadcrumb\">" + breadcrumb.innerHTML +
			"</ul>" + convert(docbook.view.convertCodeBlocks(data.body));
		container.appendChild(render);
	},
	addLink : function (name, href, controller) {
			item = document.createElement('li');
			link = document.createElement('a');
			link.href      = href; 
			link.innerHTML = name;
			item.appendChild(link);
			docbook.view.addEvent(link, "click", function (e) {
				controller.opts.debug && console.log("click: ", this);
				e.returnValue = false;
				controller.route(this.pathname);
			}, false);

			return item;
	},
	filterCollection : function (container, collection, controller) {
		// Do stuff
	},
	setTitle : function(text, opts) {
		opts = opts || {};
		opts.debug && console.log("setTitle: " + text);
		var title = document.getElementById(opts.header_id);

		if (null == title) {
			return;
		}

		title.innerText = text;
	},
	normalizeLinebreaks : function (str, lineEnd) {
		lineEnd = lineEnd || '\n';
		return str
			.replace(/\r\n/g, lineEnd) // DOS
			.replace(/\r/g, lineEnd) // Mac
			.replace(/\n/g, lineEnd); // Unix
	},
	wrapCode : function(match, lang, code) {
		var hl;
		if (lang) {
 			try {
		//		hl = hljs.highlight(lang, code).value;
 			} catch(err) {
				console.log("failed to highlight");
			}
		} else {
		}
		hl =  hljs.highlightAuto(code).value;
		return '<pre><code>' + hl + '</code></pre>';
	},
	convertCodeBlocks : function(mdown){
		var re = /^```\s*(\w+)\s*$([\s\S]*?)^```$/gm;
		return mdown.replace(re, docbook.view.wrapCode);
	},
	addEvent : function(obj, ev, fn, capture) {
		if (obj.length > 1) {
			for (i in obj)
				docbook.view.addEvent(obj[i], ev, fn, capture);
			return;
		}
	
		if (obj.addEventListener) {
			obj.addEventListener(ev, fn, capture);
			return true;
		} else if (obj.attachEvent){
			var r = obj.attachEvent("on" + ev, fn);
			return r;
		} else {
			return false;
		}
	},
	removeEvent : function (obj, ev, fn, capture){
		if (obj.length > 1) {
			for (i in obj)
				docbook.view.removeEvent(obj[i], ev, fn, capture);
			
			return;
		}

		if (obj.removeEventListener){
			obj.removeEventListener(ev, fn, capture);
			return true;
		} else if (obj.detachEvent){
			var r = obj.detachEvent("on" + ev, fn);
			return r;
		} else {
			return false;
		}
	},
	triggerEvent : function (obj, ev, event) {
		event = event || document.createEvent('Event');
		event.initEvent(ev, true, true);
		obj.dispatchEvent(event);
	}
};

docbook.controller = function (container, opts) {
	this.opts = {
		debug       : false,
		header_id   : "page-title",
		content_id  : "page-content",
		path_prefix : "",
	};

	opts = opts || {};

	this.doc  = document.getElementById(container);

	for (k in opts) {
		this.opts[k] = opts[k];
	}

	this.opts.repository  = this.opts.repository.replace(/(?:^\/|\/$)/, "");
	this.opts.path_prefix = this.opts.path_prefix.replace(/(?:^\/|\/$)/, "");

	this.opts.debug && console.log("Init docbook for #" + container);

	if (null == this.doc) {
		alert("Could not find element: #" + container);
		return;
	}

	this.content = document.getElementById(this.opts.content_id);

	docbook.view.addEvent(window, 'popstate', function (e) {
		book.route(location.href);
	});

	this.route = function (path) {
		if ("" == path) {
			path = this.opts.repository + "/";
		} 

		this.opts.debug && console.log("path: ", path);

		if ("/" == path.substr(-1)) {
			var resource = {
				name       : path, 
				path       : path,
				parent     : path.replace(/\/[^/]+\/?$/, '') + "/",
				collection : docbook.model.fetchCollection(path),
			};

			docbook.view.collection(this.content, resource, this);
			history.pushState({collection: path}, path, path);
		} else {
			var doc  = docbook.model.fetchItem(path);
			docbook.view.item(this.content, doc, this);
		}
	};

	this.rewriteResource = function (resource) {
		return resource + ".md";
	}
}
