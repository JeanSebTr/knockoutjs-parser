
var path = require('path');
var fs = require('fs');

var expat = require('node-expat');
var yaml = require('js-yaml');

var Template = require('./template.js');


function Parser() {
    this.cache = {};
    this.dir = process.cwd();
}
module.exports = Parser;

function onStartElement(name, attrs) {
    name = name.toLowerCase();
    if(name == 'template') return;
    var lAttrs = {};
    for(var k in attrs) {
        if(k.toLowerCase() != k) {
            lAttrs[k.toLowerCase()] = attrs[k];
        }
        else {
            lAttrs[k] = attrs[k];
        }
    }
    attrs = lAttrs;
    if(name == 'block') {
        if(!attrs.name) {
            console.warn('Unnamed block at line %d, collum %d in %s',
                this.parser.getCurrentLineNumber()+this.lineStart,
                this.parser.getCurrentColumnNumber(),
                this.filename);
        }
        else {
            this.tpl.openBlock(attrs.name, !!attrs.append);
        }
    }
    else {
        this.tpl.openTag(name, attrs);
    }
}

function onEndElement(name) {
    name = name.toLowerCase();
    if(name == 'template') return;
    if(name == 'block') {
        this.tpl.closeBlock();
    }
    else {
        this.tpl.closeTag(name);
    }
}

function onText(str) {
    this.tpl.appendText(str);
}

function onComment(comment) {
    var str = comment.trim();
    var offset = str.indexOf(' ');
    if(offset != -1 && str.slice(0, offset).toLowerCase() == 'ko') {
        this.tpl.openTag('ko', {'data-bind': str.slice(offset+1)});
    }
    else if(offset != -1 && str.slice(0, offset).toLowerCase() == '/ko') {
        this.tpl.closeTag('ko');
    }
    else {
        this.tpl.appendComment(comment);
    }
    var parser = this.parser;
}

function onClose() {
    var parser = this.parser;
    var err = parser.getError();
    if(err) {
        console.error('[Error] %s at line %d, collumn %d, offset %d', 
            err,
            parser.getCurrentLineNumber(),
            parser.getCurrentColumnNumber(),
            parser.getCurrentByteIndex());
        this.callback(err, null);
    }
    else {
        this.callback(null, this.tpl);
    }
}

function bindParser(content) {
    // remove listeners for YAML header
    this.file.removeAllListeners('data');
    this.file.removeAllListeners('end');

    // bind for XML parsing
    var parser = this.parser = new expat.Parser('UTF-8');
    parser.on('startElement', onStartElement.bind(this));
    parser.on('endElement', onEndElement.bind(this));
    parser.on('text', onText.bind(this));
    parser.on('comment', onComment.bind(this));
    parser.on('close', onClose.bind(this));

    // start parsing
    parser.write(content);
    this.file.pipe(parser);
}

function readFile(end, data) {
    this.buf += data || '';
    var offset;
    // complete YAML header
    if(this.buf.indexOf('---') == 0 && (offset = this.buf.indexOf('\n---\n', 3)) > 0) {
        var head = this.buf.slice(0, offset+1);
        var conf = yaml.load(head);
        this.lineStart = head.split('\n').length+1;
        this.offsetStart = head.length+5;
        this.tpl = new Template(this.filename, this.engine, conf);
        bindParser.call(this, this.buf.slice(offset+5));
    }
    // no YAML header
    else if(this.buf.length >= 3 && this.buf.indexOf('---') != 0) {
        this.tpl = new Template(this.filename, this.engine);
        bindParser.call(this, this.buf);
    }
    // EOF
    else if(end) {
        this.callback.call(this.engine, new SyntaxError('Incomplete document. End at offset '+this.buf.length), null);
    }
}

Parser.prototype = {
    parse: function(file, cache, callback) {
        if(cache && this.cache[file]) {
            return process.nextTick(callback.bind(this, null, this.cache[file]));
        }
        var fStream = fs.createReadStream(file, { encoding: 'utf8' });
        var state = {
            buf: '',
            filename: file,
            file: fStream,
            lineStart: 0,
            offsetStart: 0,
            engine: this,
            callback: function(err, tpl) {
                if(err) {
                    process.nextTick(callback.bind(this, err, null));
                }
                else {
                    if(this.cache) {
                        this.cache[file] = tpl;
                    }
                    process.nextTick(callback.bind(this, null, tpl));
                }
            }
        };
        // parse YAML header and xml body
        fStream.on('data', readFile.bind(state, false));
        fStream.on('end', readFile.bind(state, true));
    }
};


