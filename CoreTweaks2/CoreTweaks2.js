/***
|Name|CoreTweaks2|
|Source|https://github.com/Skeeve/TiddlyStuff.git|
|Version|1.1|
|Author|Stephan Hradek|
|License|BSD|
|~CoreVersion|2.2.0|
|Type|plugin|
|Description|A small tweak to the tiddler macro to support flexible rewrites|

This tiddler is based on Eric Shulman's [[CoreTweaks|http://www.tiddlytools.com/#CoreTweaks]].

It patches the tiddler Macro to support a more flexibel syntax.

**NOTE: YOu shouldn't use this tweak but switch to [[TemplateTiddlerPlugin|https://github.com/Skeeve/TiddlyStuff.git]]**

!Old Syntax
It's still possible to use the old syntax as described in the [[CoreTweaks|http://www.tiddlytools.com/#CoreTweaks]]
{{{
<<tiddler tiddlerName if:{{...}} with:parameter1 parameter2 ...>>
}}}

!New Syntax
Alternatively, the new syntax can be used.
{{{
<<tiddler tiddlerName if:{{...}} REPLACE:true variable:value variable:value...>>
}}}
In this case, the tiddler "tiddlerName" should contain some placeholders of the
form {{{ ${variable} }}}. Every occurence of such a placeholder is replaced
by the value defined in the tiddler-Reference.

If the START_TAG {{{ ${ }}} and END_TAG {{{ } }}} are inconvenient, they can be
redefined:
{{{
<<tiddler tiddlerName REPLACE:true START_TAG:"[%" END_TAG:"%]" ...>>
}}}
Please note that it's not possible to use
# The same tag for START_TAG and END_TAG
# An empty tag for either of them
***/
//{{{
config.refreshers.content=function(e,changeList) {
    var title = e.getAttribute("tiddler");
    var force = e.getAttribute("force");
    if(force != null || changeList == null || changeList.indexOf(title.replace(/##.*/,'')) != -1) {
        removeChildren(e);
        config.macros.tiddler.transclude(e,title); // ADDED
        return true;
    } else
        return false;
};

config.macros.tiddler.flex_handler=function(place,macroName,params,wikifier,paramString,tiddler) {
    params = paramString.parseParams("name",null,true,false,true);
    var names = params[0]["name"];
    var tiddlerName = names[0];
    var className = names[1] || null;
    var args;
    var replace = params[0]["REPLACE"] && params[0]["REPLACE"][0] == "true";
    if (!replace) args = params[0]["with"];
    var wrapper = createTiddlyElement(place,"span",null,className);
    wrapper.setAttribute("refresh","content");
    wrapper.setAttribute("tiddler",tiddlerName);
    if(args!==undefined) wrapper.setAttribute("args",'[['+args.join(']] [[')+']]')
    else if (replace) wrapper.setAttribute("paramstring", paramString.replace(/&/g, "&amp;").replace(/"/g, "&quot;"));
    this.transclude(wrapper,tiddlerName);
}

if (config.macros.tiddler.if_handler != null)
    config.macros.tiddler.if_handler= config.macros.tiddler.flex_handler;
else
    config.macros.tiddler.handler= config.macros.tiddler.flex_handler;

config.macros.tiddler.transclude=function(wrapper,tiddlerName) {
    var text = store.getTiddlerText(tiddlerName); if (!text) return;
    var stack = config.macros.tiddler.tiddlerStack;
    if(stack.indexOf(tiddlerName) !== -1) return;
    stack.push(tiddlerName);
    var args = wrapper.getAttribute("args");
    var paramString = wrapper.getAttribute("paramstring");
    try {
        if (paramString != null) {
            params = paramString.replace(/&quot;/g ,'"').replace(/&amp;/g, "&").parseParams("name",null,true,false,true);
            var start_tag= getParam(params, 'START_TAG', '${');
            var end_tag= getParam(params, 'END_TAG', '}');
            delete params[0]['START_TAG'];
            delete params[0]['END_TAG'];
            delete params[0]['name'];
            delete params[0]['if'];
            var splitted= text.split(start_tag);
            var el= end_tag.length;
            for (var i=splitted.length; --i;) {
                var e= splitted[i].indexOf(end_tag);
                if (e>=0) {
                    var k= splitted[i].substr(0, e).trim();
                    if (k in params[0]) {
                        splitted[i]= params[0][k] + splitted[i].substr(e+el);
                        continue;
                    }
                }
                splitted[i]= start_tag + splitted[i];
            }
            text= splitted.join("");
        }
        else if (typeof args == "string") args=args.readBracketedList();
        var n = args ? Math.min(args.length,9) : 0;
        for(var i=0; i<n; i++) {
            var placeholderRE = new RegExp("\\$" + (i + 1),"mg");
            text = text.replace(placeholderRE,args[i]);
        }
        config.macros.tiddler.renderText(wrapper,text,tiddlerName,null);
    } finally {
        stack.pop();
    }
};
//}}}