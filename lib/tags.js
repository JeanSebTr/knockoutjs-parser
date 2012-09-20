
function Tag(name, attrs, parent) {
    this.name = name;
    this.parent = parent;
    this.childNodes = [];
    this.attrs = attrs;

    this.bind = !!attrs['data-bind'];
}
var TagProto = Tag.prototype = {};
exports.Tag = Tag;

function ClosingTag(name, attrs, parent) {
    Tag.call(this, name, attrs, parent);
}
var ClosingTagProto = ClosingTag.prototype = Object.create(TagProto);
exports.ClosingTag = ClosingTag;
var selfClosing = ['br', 'meta'];
exports.isClosing = function(name) {
    return selfClosing.indexOf(name) != -1;
};

function Block(name, append) {
    Tag.call(this, 'block', {});
    this.blockName = name;
    this.append = append;
}
var BlockProto = Block.prototype = Object.create(TagProto);
exports.Block = Block;

TagProto.appendChild = function(child) {
    this.childNodes.push(child);
};

TagProto.appendText = function(text) {
    this.childNodes.push(html_encode(text));
};

TagProto.appendComment = function(comment) {
    this.childNodes.push('<!--'+html_encode(comment)+'-->');
};

TagProto.render = function(stream, ctx) {
    var i0 = 0;
    if(typeof ctx.lastTag == 'number') {
        i0 = ctx.lastTag+1;
    }
    if(this.name != 'block' && i0 == 0) {
        stream.write('<'+this.name+this.attrsString()+'>');
    }
    if(this.bind) {
        var bind = ctx.getBindding(this.attrs['data-bind']);
        if(bind.hasOwnProperty('if') && !bind['if']) {
            i0 = this.childNodes.length;
        }
    }
    for(var i=i0; i<this.childNodes.length; i++) {
        var node = this.childNodes[i];
        if(typeof node == 'string') {
            ctx.lastTag = i;
            stream.write(node);
        }
        else {
            ctx.currentEl = node;
            ctx.lastTag = undefined;
            ctx.rStack.push(i);
            return false;
        }
    }
    if(this.name != 'block') {
        stream.write('</'+this.name+'>');
    }
    if(this.parent) {
        ctx.currentEl = this.parent;
        ctx.lastTag = ctx.rStack.pop();
        return false;
    }
    else {
        ctx.currentEl = undefined;
        ctx.lastTag = undefined;
    }
    return true;
};

TagProto.compact = function() {
    var childs = [];
    var lastNode = '';
    for(var i=0; i<this.childNodes.length; i++) {
        var node = this.childNodes[i];
        if(node.isString) {
            node = node.toString();
        }
        if(typeof node == 'string') {
            lastNode += node;
        }
        else {
            if(lastNode.length) {
                childs.push(lastNode);
                lastNode = '';
            }
            childs.push(node);
        }
    }
    if(lastNode.length) {
        childs.push(lastNode);
    }
    this.childNodes = childs;
    if(!this.bind && (!this.childNodes.length || 
      (this.childNodes.length == 1 && typeof this.childNodes[0] == 'string')) )
        this.isString = true;
};

TagProto.attrsString = function() {
    var str = '';
    for(var k in this.attrs) {
        str += ' '+k+'="'+html_encode(this.attrs[k])+'"';
    }
    return str;
};

TagProto.toString = function() {
    var str = '<'+this.name+this.attrsString()+'>';
    for(var i=0; i<this.childNodes.length; i++) {
        str += this.childNodes[i];
    }
    return str + '</'+this.name+'>';
};

ClosingTagProto.toString = function() {
    return '<'+this.name+this.attrsString()+' />';
};

var entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
};
function html_encode(str) {
    for(var c in entities) {
        str = str.split(c).join(entities[c]);
    }
    return str;
}
