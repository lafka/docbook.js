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
				type : dir ? 'collection' : item,
				link : tags[i].href,
				name : dir ? name : docbook.model.rewriteName(name)
			});
		}

		return docs;
	},
	fetchItem : function (path) {
		return {};
	},
	rewriteName : function(text) {
		text = text.replace(/\.[^.]$/, '');
		return text.replace(/[_+]/g, '');
	}
};

docbook.view = {
	collection : function (container, collection) {
		var render = document.createElement('ul');
 		var item   = undefined
 		var link = undefined
 
		for (var i in collection) {
			item = document.createElement('li');
			link = document.createElement('a');
			link.hash = collection[i].link;
			link.innerText = collection[i].name;
			item.appendChild(link);
			render.appendChild(item);
		}		

		container.innerHTML = "";
		container.appendChild(render);
	}
};

docbook.controller = function (root, container, opts) {
	this.opts = {
		debug      : true,
		header_id  : "page-title",
		content_id : "page-content"
	};

	opts = opts || {};

	this.doc  = document.getElementById(container);

	for (k in opts) {
		this.opts[k] = opts[k];
	}

	this.opts.debug && console.log("Init docbook for" + root);

	if (null == this.doc) {
		alert("Could not find element: #" + container);
		return;
	}

	this.setTitle = function(text) {
		this.opts.debug && console.log("setTitle: " + text);
		var title = document.getElementById(this.opts.header_id);

		if (null == title) {
			return;
		}

		title.innerText = text;
	}

	this.setTitle("Docbook.js");
	var container = document.getElementById(this.opts.content_id);

	render.collection(container, docbook.model.fetchCollection(root));
} 
