/***
|Name|TemplateTiddlerPlugin|
|Source|https://github.com/Skeeve/TiddlyStuff.git|
|Version|1|
|Author|Stephan Hradek|
|License|The BSD License|
|~CoreVersion|tested with 2.7.1|
|Type|plugin|
|Description|A macro which allows transclusion of other tiddlers while replacing named variables|

This tiddler is partly based on Eric Shulman's [[CoreTweaks|http://www.tiddlytools.com/#CoreTweaks]].

!Syntax
{{{
<<tt tiddlerName IF:{{...}} variable:value variable:value...>>
}}}
The tiddler "tiddlerName" should contain some placeholders of the form {{{ ${variable} }}} where every occurence of such a placeholder is replaced by the value defined in the tiddler-Reference.

The optional "IF" parameter is intended for a javascript-based test expression to determine if the tiddler transclusion should be performed:

If the test is true, the tiddler is transcluded. If the test is false, the transclusion is skipped and no output is produced.

If the START_TAG {{{ ${ }}} and END_TAG {{{ } }}} are inconvenient, they can be
redefined:
{{{
<<tt tiddlerName START_TAG:"[%" END_TAG:"%]" ...>>
}}}
Please note that it's not possible to use
# the same tag for START_TAG and END_TAG.
# an empty tag for either of them.
# variables called "NAME", "IF", "START_TAG" or "END_TAG"
***/
//{{{

config.refreshers.tt=function(e,changeList) {
    var title = e.getAttribute("tiddler");
    var force = e.getAttribute("force");
    if(force != null || changeList == null || changeList.indexOf(title.replace(/##.*/,'')) != -1) {
        removeChildren(e);
        config.macros.tt.transclude(e,title);
        return true;
    } else
        return false;
};

config.macros.tt= {};

config.macros.tt.handler=function(place,macroName,params,wikifier,paramString,tiddler) {
    params = paramString.parseParams("NAME",null,true,false,true);
    var names = params[0]["NAME"];
    var tiddlerName = names[0];
    var className = names[1] || null;
    var args;
    var wrapper = createTiddlyElement(place,"span",null,className);
    wrapper.setAttribute("refresh","tt");
    wrapper.setAttribute("tiddler",tiddlerName);
    wrapper.setAttribute("paramstring", paramString.replace(/&/g, "&amp;").replace(/"/g, "&quot;"));
    this.transclude(wrapper,tiddlerName);
};

config.macros.tt.transclude=function(wrapper,tiddlerName) {
    var text = store.getTiddlerText(tiddlerName); if (!text) return;
    var stack = config.macros.tiddler.tiddlerStack;
    if(stack.indexOf(tiddlerName) !== -1) return;
    stack.push(tiddlerName);
    var paramString = wrapper.getAttribute("paramstring");
    try {
        if (paramString != null) {
            params = paramString.replace(/&quot;/g ,'"').replace(/&amp;/g, "&").parseParams("NAME",null,true,false,true);
            if (!getParam(params,'IF',true)) return;
            var start_tag= getParam(params, 'START_TAG', '${');
            var end_tag= getParam(params, 'END_TAG', '}');
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
        config.macros.tiddler.renderText(wrapper,text,tiddlerName,null);
    } finally {
        stack.pop();
    }
};

//}}}
/***
!Example Tiddler
"""#""" This is coming from the tiddler "${NAME}"
"""#""" If there was a condition, its value was: "${IF}"
{{{
cd ${userdirectory}
chmod 0700 .ssh
cd .ssh
chmod 0600 ${privatkey}
chmod 0644 ${publickey}
}}}
!Example Usage
<<tiddler [[TemplateTiddlerPlugin##CODE]] with:{{
	store.getTiddlerText("TemplateTiddlerPlugin##Result");
}}>>
!Result
<<tt [[TemplateTiddlerPlugin##Example Tiddler]]
        userdirectory:$HOME
        privatkey:id_dsa
        publickey:id_dsa.pub
>>
"""#""" Below a tiddler is include only on odd minutes:
<<tt [[TemplateTiddlerPlugin##Example Tiddler]]
        IF:{{ new Date().getMinutes() % 2 == 1 }}
        userdirectory:/export/home/skeeve
        privatkey:id_rsa
        publickey:id_rsa.pub
>>
!Note
As you can see in the example {{{ ${NAME} }}} and {{{ ${IF} }}} can be used, but they also have a meaning to the macro. The words NAME, IF, START_TAG and END_TAG are //reserved Words//. In future versions there might be more reserved words, but these will also be ALL-CAPS.
/%
!CODE
{{{
$1
}}}
!END
%/
***/
