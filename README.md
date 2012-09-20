# knockoutjs-parser

Server-side knockoutjs templates parser

## Warning!

It's realy just a proof of concept for now.
Use at your own risks, but have fun!

### TODO

 * many [knockoutjs bindings](#knockoutjs-bindings)
 * [Views inheritance](#views-inheritance)
 * well... pointless without [Client-side ko.applyBindings](#client-side-ko-applybindings)

## Install

`npm install knockoutjs-parser`

## Usage

### With express
```javascript

var express = require('express');
var app = express(); // express >=3.0 else: express.createServer();

// ...

var ko = require('knockoutjs-parser');
app.engine('xml', ko.__express);

// ...

app.get('/', function(req, res, next) {
    res.render('view', {
        title: 'Hello',
        text: 'World!'
    });
});

```
### Template exemple

```xml
---
title: {category.title} :: JeanSebTr's blog
style:
 - css/some-style.css
 - css/more-style.styl
script:
 - js/jquery.js
 - js/strange-syntax.coffee
---
<block name="body">
    <header>
        <h1>JeanSebTr's blog</h1>
    </header>
    <section>
        <header>
            <h2>Category: <span data-bind="text: category.title" /></h2>
        <header>
        <!-- ko foreach: articles -->
        <article>
            <header>
                <h3 data-bind="text: title" />
                <p>Author: <span data-bind="text: author" /></p>
            </header>
            <p data-bind="text: content" />
        </article>
        <!-- /ko -->
    </section>
</block>
```

## Template features

### knockoutjs bindings

knockoutjs-parser _currently_ implement these knockoutjs' bindings:
 * [if](http://knockoutjs.com/documentation/if-binding.html)

knockoutjs-parser _will_ implement these knockoutjs' bindings:
 * [visible](http://knockoutjs.com/documentation/visible-binding.html)
 * [text](http://knockoutjs.com/documentation/text-binding.html)
 * [html](http://knockoutjs.com/documentation/html-binding.html)
 * [css](http://knockoutjs.com/documentation/css-binding.html)
 * [style](http://knockoutjs.com/documentation/style-binding.html)
 * [attr](http://knockoutjs.com/documentation/attr-binding.html)
 * [foreach](http://knockoutjs.com/documentation/foreach-binding.html)
 * [ifnot](http://knockoutjs.com/documentation/ifnot-binding.html)
 * [with](http://knockoutjs.com/documentation/with-binding.html)

knockoutjs-parser _won't_ implement bindings related to events handling.
Because events don't happen server-side...

The [template](http://knockoutjs.com/documentation/template-binding.html) binding may be implemented if there is a clean way to do it.

### YAML header

A header of YAML data may be used to define additionnal variables to those passed to res.render

### Views inheritance

Not yet.

## Client-side ko.applyBindings

A lot to think about here...
