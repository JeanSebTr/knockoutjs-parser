
var streamBuffers = require("stream-buffers");

var tags = require('./tags.js');

function Template(file, parser, config) {
    this.file = file;
    this.parser = parser;
    this.conf = {
        js: [],
        css: []
    };
    config = config || {};
    for(var k in config) {
        if(k == 'extend') {
            // extend template ?
        }
        else if(k == 'type') {
            this.conf.type = config[k];
        }
        else if(k == 'doctype') {
            this.conf.doctype = '<!doctype '+config[k]+'>\n';
        }
        else if(k == 'style' && config[k] instanceof Array) {
            for(var i=0; i<config[k].length; i++) {
                var css = config[k][i];
            }
        }
        else if(k == 'script') {

        }
    }
    if(!this.conf.type) {
        this.conf.type = html;
    }
    if(!this.conf.doctype) {
        this.conf.doctype = '<!doctype html>\n';
    }


    this.blocks = {};
    this.renderStats = {n:0, t:0};
}
module.exports = Template;

function Context(data, parent) {
    if(!parent) {
        data['$root'] = data;
        data['$parent'] = data;
    }
    else {
        data['$root'] = parent.data['$root'];
        data['$parent'] = parent.data;
    }
    data['$data'] = data;

    this.data = data;
    this.keys = Object.keys(this.data).sort();
    this.values = [];
    for(var i in this.keys) {
        var k = this.keys[i];
        this.values.push(this.data[k]);
    }

    // rendering states
    this.rStack = [];
}
Context.prototype = {
    getBindding: function(str) {
        return Function
            .apply(null, this.keys.concat('return {'+str+'};'))
            .apply(null, this.values);
    }
};

Template.prototype = {
    render: function(data, callback) {
        var ctx = new Context(data);
        var s0 = this.renderStats.t/(this.renderStats.n||1);
        var si = s0/10;
        var stream = new streamBuffers.WritableStreamBuffer({
            initialSize: s0||10 * 1024,
            incrementAmount: si||1 * 1024
        });
        console.log('Start rendering!');
        stream.write('<!doctype html>\n<html><head>');
        console.log('Render HEAD.');
        if(this.hasBlock('head')) {
            var block = ctx.currentEl = this.getBlock('head');
            if(block.append) {
                this.renderHead(stream, ctx);
            }
            while(ctx.currentEl && !ctx.currentEl.render(stream, ctx));
            if(block.prepend) {
                this.renderHead(stream, ctx);
            }
        }
        else {
            this.renderHead(stream, ctx);
        }
        stream.write('</head><body>');
        console.log('Render BODY.');
        if(this.hasBlock('body')) {
            var block = ctx.currentEl = this.getBlock('body');
            while(ctx.currentEl && !ctx.currentEl.render(stream, ctx));
        }
        stream.write('</body></html>');
        // YEAH !
        console.log('Rendering completed');
        callback(null, stream.getContentsAsString('utf8'));
    },
    renderHead: function(stream, ctx) {
        stream.write('<title>Hello World!</title>\n');
    },
    hasBlock: function(name) {
        return !!this.blocks[name];
    },
    getBlock: function(name) {
        return this.blocks[name];
    },
    openBlock: function(name, append) {
        if(this.currentBlock) {
            throw new SyntaxError("A block can't containt another block tags");
        }
        this.currentBlock = this.blocks[name] = new tags.Block(name, append);
        this.currentEl = this.currentBlock;
    },
    closeBlock: function() {
        if(this.currentBlock) {
            this.currentBlock.compact();
        }
        this.currentEl = this.currentBlock = null;
    },
    openTag: function(name, attrs) {
        if(!this.currentEl) {
            throw new SyntaxError("Tags can't be declared outside of a block");
        }
        var tag;
        if(tags.isClosing(name)) {
            tag = new tags.ClosingTag(name, attrs, this.currentEl);
        }
        else {
            tag = new tags.Tag(name, attrs, this.currentEl);
        }
        this.currentEl.appendChild(tag);
        this.currentEl = tag;
    },
    closeTag: function(name) {
        if(!this.currentEl || this.currentEl.name != name) {
            throw new SyntaxError("Tags can't be declared outside of a block");
        }
        this.currentEl.compact();
        this.currentEl = this.currentEl.parent;
    },
    appendText: function(text) {
        if(!this.currentEl) {
            if((text || '').trim() != '')
                throw new SyntaxError("TextNodes can't be declared outside of a block");
        }
        else {
            this.currentEl.appendText(text);
        }
    },
    appendComment: function(comment) {
        if(!this.currentEl) {
            throw new SyntaxError("Comment can't be declared outside of a block");
        }
        this.currentEl.appendComment(comment);
    }
};
