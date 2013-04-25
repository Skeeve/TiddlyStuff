/***
|Name|UnwikifiedPlugin|
|Source|https://github.com/Skeeve/TiddlyStuff.git|
|Version|1|
|Author|Stephan Hradek|
|License|The BSD License|
|~CoreVersion|tested with 2.7.1|
|Type|plugin|
|Description|A macro which allows transclusion of other tiddlers' code|

This tiddler is partly based on Eric Shulman's [[CoreTweaks|http://www.tiddlytools.com/#CoreTweaks]].

!Syntax
{{{
<<unwikified tiddlerName if:{{...}}>>
}}}
The source of the tiddler "tiddlerName" is transcluded inside a <pre> block.

The optional "if" parameter is intended for a javascript-based test expression to determine if the tiddler transclusion should be performed:

If the test is true, the tiddler is transcluded. If the test is false, the transclusion is skipped and no output is produced.
!Code
***/
//{{{
config.macros.unwikified= {};

config.macros.unwikified.handler = function (place,macroName,params,wikifier,paramString,tiddler){
    // this will run when macro is called from a tiddler
    params = paramString.parseParams("name",null,true,false,true);
    if (!getParam(params,'if',true)) return;
    var names = params[0]["name"];
    var tiddlerName = names[0];
    var className = names[1] || null;
    var wrapper = createTiddlyElement(place,"span",null,className);
    wrapper.setAttribute("refresh","unwikified");
    wrapper.setAttribute("tiddler",tiddlerName);
    config.refreshers.unwikified(wrapper,[tiddlerName.replace(/##.*/,'')]);
}

config.refreshers.unwikified= function(e,changeList) {
    var title = e.getAttribute("tiddler");
    var force = e.getAttribute("force");
    if(force != null || changeList == null || changeList.indexOf(title.replace(/##.*/,'')) != -1) {
        removeChildren(e);
        var text = store.getTiddlerText(title); if (!text) return;
        createTiddlyElement(e, "pre", null, null, text);
        return true;
    }
    else {
        return false;
    }
};
//}}}
/***
!Example
<<unwikified [[UnwikifiedPlugin##Result]]>>
!Result
<<unwikified [[UnwikifiedPlugin##Syntax]]>>
!END
***/
