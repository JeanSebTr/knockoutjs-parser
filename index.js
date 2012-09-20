
var Parser = exports.Parser = require('./lib/parser.js');

function express_render(callback, data, err, tpl) {
    if(err) {
        callback(err, null)
    }
    else {
        tpl.render(data, callback);
    }
}

function express_parse(file, options, callback) {
    var settings = options.settings || {};
    this.dir = settings.views || this.dir;
    this.parse(file, options.cache || false,
        express_render.bind(this, callback, options));
}

Object.defineProperty(exports, '__express', {
    enumerable: true,
    get: function() {
        return express_parse.bind(new Parser());
    }
});

