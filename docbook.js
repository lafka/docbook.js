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
				link : tags[i].pathname.replace(document.location.pathname, ''),
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
	collection : function (container, data, opts) {
		if (0 == data.collection.length) {
			var error = document.createElement('div');
			error.className = 'alert alert-error';
			docbook.view.setTitle("Not found", opts);

			container.innerHTML = "<p class=\"alert alert-warning\">" +
				"Sorry, the resource your where looking for could not " +
				"be found.</p>";
			return;
		}

		var render = document.createElement('ul');
 		var item   = undefined
 		var link = undefined

		for (var i in data.collection) {
			item = document.createElement('li');
			link = document.createElement('a');
			link.href      = "#" + data.collection[i].link;
			link.innerText = data.collection[i].name;
			item.appendChild(link);
			render.appendChild(item);
		}
		docbook.view.setTitle(data.name, opts);
		container.innerHTML = "";
		container.appendChild(render);
	},
	filterCollection : function (container, collection, opts) {
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
	}
};

docbook.controller = function (container, opts) {
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

	this.opts.debug && console.log("Init docbook for" + container);

	if (null == this.doc) {
		alert("Could not find element: #" + container);
		return;
	}

	this.content = document.getElementById(this.opts.content_id);

	this.route = function (path) {
		this.opts.debug && console.log("path: ", path);
		if ("/" == path.substr(-1)) {
			var resource = {
				name       : path,
				collection : docbook.model.fetchCollection(path)
			};
			docbook.view.collection(this.content, resource, this.opts);
		} else {
			var doc  = docbook.model.fetchItem(path);
			docbook.view.item(this.content, doc, this.opts);
		}
	};

	this.rewriteResource = function (resource) {
		return resource + ".md";
	}
}
