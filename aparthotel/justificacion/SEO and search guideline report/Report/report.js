/*
    Developed by:
        PowerMapper Software Limited
        Quartermile Two
        2 Lister Square
        Edinburgh EH3 9GL
        Scotland

    Copyright PowerMapper Software Limited 2007-2025

    NOTE: this file isn't used directly: the minified version of this file
    is referenced instead. If you add/remove any functions or change function
    interfaces you must create a new minified version based on current date.

    This script file needs to run multiple environments:

    - in modern web browsers for OnDemand
    - in WKWebView on macOS Desktop (which requires async/await for appHost calls)
    - in WebView2 on Windows Desktop (which doesn't need async/await)
    - in MsHtml on Windows Desktop which cannot use ES6 features like async/await
    
    On macOS a preprocessor script removes the /*@ comments around async and await 

    WARNING: do not use npm minify because it replaces ES5 compatible code with ES6 features like window.chrome?.webview?.hostObjects
    use uglifyjs report.js --compress > report-min-20250221.js
*/

var categoryArraySize = 9;
var categories = new Array(categoryArraySize)
categories[0]="overallQuality";
categories[1]="errors";
categories[2]="compliance";
categories[3]="standards";
categories[4]="accessibility";
categories[5]="usability";
categories[6]="seo";
categories[7]="security";
categories[8]="compatibility";

// plain JS equivalent of $(document).ready
if( document.addEventListener ) {
    document.addEventListener("DOMContentLoaded", pageLoad );
} else { // IE8
    window.attachEvent('onload', pageLoad );
}


function appHost() {

    if (window.chrome && window.chrome.webview && window.chrome.webview.hostObjects && window.chrome.webview.hostObjects.powermapper) {
        return window.chrome.webview.hostObjects.sync.powermapper;
    } else if ( window.external ) {
        // old macOS and Windows WebView
        return window.external;
    } else if (window.webkit && window.webkit.messageHandlers) {
        // macOS WKWebView
        var macProxyTarget = new Object;

        return new Proxy(macProxyTarget, {
          get: function(target, property) {
            return function() {

              if (property != null) { // property is the name of the script message that the main app window controller listenes out for
                // we generate a unique id to reference the promise later
                // from native function
                var promiseID = generateUniqueID();

                var evalStr = "window.webkit.messageHandlers." + property + ".postMessage({'promiseID':'" + promiseID + "', 'params':["; // at the end we'll simply evaluate this string

                if (arguments != null) {
                  if (arguments.length > 0) {
                    for (var i = 0; i < arguments.length; i++) {
                      // extract the parameters and add them to the message call string
                      argument = arguments[i];
                      if (typeof(argument) === "string" || typeof(argument) === "object")
                        evalStr += "'" + argument + "'"; // add quotes around strings so that they're interpreted as such when the message reaches the app
                      else
                        evalStr += argument;

                      if (i < (arguments.length - 1))
                        evalStr += ", "; // separate arguments with a comma (if we still have arguments after this one)
                    }
                  }
                }

                evalStr += "]});";

                return generatePromise(evalStr, promiseID);
              }
            }
          }
        });
    }

    return null;
}

function generatePromise(evalStr, promiseID) {
  var promise = new Promise(function(resolve, reject) {
    // save reference to promise in the global variable
    this.promises[promiseID] = {resolve:resolve, reject:reject}; // can't use ES2015 shorthand property names (ie11)

    try {
      var result = new Function(evalStr)();
    }
    catch(exception) {
      // handle the exception
    }
  });

  return promise;
}

function resolvePromise(promiseID, data, error) {
  if (error){
    promises[promiseID].reject(data);
  } else {
    promises[promiseID].resolve(data);
  }

  // remove referenfe to stored promise
  delete promises[promiseID];
}

function generateUniqueID() { // We'll use unique IDs to identify responses to async function calls between JS and the macOS app
  var dTime = new Date().getTime();
  var uniqueID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var randomNum = (dTime + Math.random()*16)%16 | 0;
    dTime = Math.floor(dTime/16);
    return (c=='x' ? randomNum : (randomNum&0x3|0x8)).toString(16);
  });
  return uniqueID;
};

var promises = {}; // Used to resolve the problem of async calls to macOS app

function addListener( selector, event, listener ) {

    var elements;
    var i;

    // querySelectorAll works on IE8 and later (but IE8 only supports CSS2 selectors)
    // IE7 and earlier accounts for 0.35% of traffic in mid 2017
    if ( document.querySelectorAll ) {

        elements = document.querySelectorAll( selector );

        for ( i = 0; i < elements.length; i++) {

            if( document.addEventListener ) {
                elements[i].addEventListener(event, listener, false);
            }
            else { // IE8
                elements[i].attachEvent('on'+event, listener );
            }
        }
    }
    else  {

        // fallback selectors compatible with IE7 must be of form tagname.classname
        var parts = selector.split('.');
        var tagName = parts[0];
        var className = parts[1];

        if ( parts.length == 2 ) {

            elements = document.getElementsByTagName( tagName );

            for ( i = 0; i < elements.length; i++) {

                if ( elements[i].className.indexOf(className) != -1 ) {
                    elements[i].attachEvent('on'+event, listener );
                }
            }
        }
    }
}


function pageLoad() {

    // Maintain the rules that the user had expanded
    expandRules();

    enableRules();

    if ( document.querySelector( "html.saas-web-val, html.eval-web-val") )
        enableSpellingsWeb();
    else
        enableSpellingsDesktop();

    // viewSource (either a.viewsource or area.viewsource)
    addListener(".viewsource[data-pageid]", "click", /*@ async @*/ function (event) {
        var target = this != window ? this : event.srcElement; // srcElement element needed for IE6-8 (where this==document.window)
        try {
            const pageId = parseInt(target.getAttribute('data-pageid'));
            const line = parseInt(target.getAttribute('data-line'));
            const col = parseInt(target.getAttribute('data-col'));
            const result = /*@ await @*/ appHost().ViewSource(pageId, line, col);

            event.preventDefault();
        } catch (err) {
            // will get here if reports are viewed outside Desktop version
            // case 60131 - console is undefined if in webview if exception fires
            // console.log(".viewsource click caught err=", err);
        }
    });

    // toggleChevron
    addListener( "button.toggleChevron", "click", function(event) {
        var target = this != window ? this : event.srcElement; // srcElement element needed for IE6-8 (where this==document.window)
        toggleChevron( target.getAttribute('data-toggleid') );
    });

    // make issue description clickable
    addListener( "td.desc", "click", function(event) {
        if ( window.getSelection().toString() ) {
            // user selecting text
        } else {
            var target = this != window ? this : event.srcElement; // srcElement element needed for IE6-8 (where this==document.window)
            toggleChevron( target.getAttribute('data-toggleid') );
        }
    });

    // expandAll - make issue description clickable
    addListener( "button.expandAll", "click", function(event) {
        expandAll();
    });

    addListener( "td.expandAll", "click", function(event) {
        if ( window.getSelection().toString() ) {
            // user selecting text
        } else {
            expandAll();
        }
    });

    // spelling
    addListener( "a.spell-bad", "click", function(event) {
        var target = this != window ? this : event.srcElement; // srcElement element needed for IE6-8 (where this==document.window)
        spellOptions(target, target.getAttribute('data-platform'));
        event.preventDefault();
    });

    addListener("a.spell-good", "click", function (event) {
        var target = this != window ? this : event.srcElement; // srcElement element needed for IE6-8 (where this==document.window)
        spellOptions(target, target.getAttribute('data-platform'));
        event.preventDefault();
    });

    // ruleOptions
    addListener( "button.ruleOptions", "click", function(event) {
        var target = this != window ? this : event.srcElement; // srcElement element needed for IE6-8 (where this==document.window)
        ruleOptions( target, target.getAttribute('data-ruleid') );
    });

    // pageOptions
    addListener( "button.pageOptions", "click", function(event) {
        var target = this != window ? this : event.srcElement; // srcElement element needed for IE6-8 (where this==document.window)
        pageOptions( target, target.getAttribute('data-url') );
    });

    if ( !document.addEventListener ) {
        // IE8 or earlier doesn't support SVG, which we detect using addEventListener which wasn't added until IE9
        var imgs = document.getElementsByTagName('img');
        var svgExtension = /.*\.svg$/
        var l = imgs.length;
        for(var i = 0; i < l; i++) {
            if(imgs[i].src.match(svgExtension)) {
                imgs[i].src = imgs[i].src.slice(0, -3) + 'png';
                //console.log(imgs[i].src);
            }
        }
    }
}

function expandRules() {

    // handle View All expansion in paged inventory (see InventoryRow in Dashboard.xsl)
    if ( window.location.hash.indexOf( '#page-' ) == 0 ) {
        addExpandedRule( 'expando-' + window.location.hash.substring(1) );
    }

    var expandedRuleArray = window.history.state || [];

    // toggle rules in the saved expanded rule list
    for (var i=0; i<expandedRuleArray.length; i++) {
        toggleChevron(expandedRuleArray[i]);
    }
}

function removeExpandedRule(id) {

    var expandedRuleArray = window.history.state || [];

    const index = expandedRuleArray.indexOf(id);
    if (index > -1) {
        expandedRuleArray.splice(index, 1); // 2nd parameter means remove one item only
    }
}

function expandAll() {

    var bShow = document.getElementById( 'chevExpandAll' ).getAttribute( 'src' ).indexOf( "chevron-down" ) != -1;
    var i;

    if ( document.querySelectorAll ) {
        var elements = document.querySelectorAll( 'tbody.expando' );

        for ( i = 0; i < elements.length; i++) {
            // style.display = "" sets default display for element (block, table-row-group etc)
            if ( bShow ) {
                elements[i].style.display = 'table-row-group';
            } else {
                elements[i].style.display = 'none';
            }
        }
    }


    var images = document.getElementsByTagName("img");

    for ( i = 0 ; i < images.length ; ++i ) {
        var imgId = images[i].id;

        if ( imgId.indexOf( "chev" ) == 0 ) {
            if ( bShow )
                images[i].src = images[i].src.replace(/chevron-down/i, 'chevron-up');
            else
                images[i].src = images[i].src.replace(/chevron-up/i, 'chevron-down');
        }
    }
}

function addExpandedRule(id)
{
    var expandedRuleArray = window.history.state || [];

    // Only add if the expanded rule is not already in the list
    const index = expandedRuleArray.indexOf(id);
    if (index == -1) {
        expandedRuleArray.push(id);
        window.history.replaceState( expandedRuleArray, "" );
    }
}

function showTab( navName, subnavName )
{
    document.getElementById( "menu-summary" ).className = '';
    document.getElementById( "menu-issues" ).className = '';
    document.getElementById( "menu-all" ).className = '';
    document.getElementById( "menu-" + navName ).className = 'selected';

    document.getElementById( "tab-summary" ).style.display = 'none';
    document.getElementById( "tab-all" ).style.display = 'none';
    document.getElementById( "tab-issues" ).style.display = 'none';

    document.getElementById( "tab-" + navName ).style.display = 'inline';

    document.getElementById( "tab-errors" ).style.display = 'none';
    document.getElementById( "tab-compliance" ).style.display = 'none';
    document.getElementById( "tab-standards" ).style.display = 'none';
    document.getElementById( "tab-accessibility" ).style.display = 'none';
    document.getElementById( "tab-usability" ).style.display = 'none';
    document.getElementById( "tab-seo" ).style.display = 'none';
    document.getElementById( "tab-compatibility" ).style.display = 'none';
    document.getElementById( "tab-security" ).style.display = 'none';

    if ( subnavName )
    {
        document.getElementById( "menu-errors" ).className = '';
        document.getElementById( "menu-compliance" ).className = '';
        document.getElementById( "menu-standards" ).className = '';
        document.getElementById( "menu-accessibility" ).className = '';
        document.getElementById( "menu-usability" ).className = '';
        document.getElementById( "menu-seo" ).className = '';
        document.getElementById( "menu-compatibility" ).className = '';
        document.getElementById( "menu-security" ).className = '';

        document.getElementById( "tab-" + subnavName ).style.display = 'inline';
        document.getElementById( "menu-" + subnavName  ).className = 'selected';
    }
}


function toggleChevron( rowid ) {
    var imgElement = document.getElementById( "chev" + rowid );

    if ( imgElement.src.indexOf( "chevron-up" ) != -1 ) {
        imgElement.src = imgElement.src.replace( /chevron-up/, "chevron-down" );
        removeExpandedRule(rowid);
    } else {
        imgElement.src = imgElement.src.replace( /chevron-down/, "chevron-up" );
        addExpandedRule(rowid);
    }

    toggleElement( 'expand-' + rowid );
}

/*@ async @*/ function enableRules()
{
    var oRows = document.getElementsByTagName('tr');

    //alert( "enableRules: rows=" + oRows.length );

    for ( var i = 0 ; i < oRows.length ; ++i )
    {
        var oElement = oRows[i];

        if ( oElement.id && oElement.id.indexOf( "rule-" ) == 0  )
        {

            try
            {
                var ruleId = oElement.id.substr( 5 );
                var bEnabled = /*@ await @*/ appHost().GetRuleEnabled( ruleId );

                if ( bEnabled )
                    oElement.className = '';
                else
                    oElement.className = 'disabled';
            }
            catch(err)
            {
                //Do nothing
            }
        }
    }
}

/*@ async @*/ function enableSpellingsDesktop()
{
    var oRows = document.getElementsByTagName('a');

    for ( var i = 0 ; i < oRows.length ; ++i )
    {
        var oElement = oRows[i];

        if ( oElement.className == "spell-bad"  )
        {
            try
            {
                if ( oElement.innerText )
                {
                    var strWord = oElement.innerText;

                    var bCorrect = /*@ await @*/ appHost().GetSpellingCorrect( strWord );

                    if ( bCorrect )
                        oElement.className = 'spell-good';
                }
            }
            catch(err)
            {
                //Do nothing
            }
        }
    }
}

/*@ async @*/ function enableSpellingsWeb()
{
    // only fetch if document contains spelling errors (this is more efficient
    // and avoids fetch 404 on try.powermapper.com/Scans/GetCustomSpellings)
    if ( document.querySelector('a.spell-bad') ) {
        fetch('/Scans/GetCustomSpellings')
        .then( function(response) {response.json().then( function(customSpellings) {
            const elements = document.querySelectorAll('a.spell-bad');

            for ( var i = 0 ; i < elements.length ; ++i ) {
                var element = elements[i];
                var badWord = element.innerText;
                var inCustomDictionary = customSpellings.some( function(word) { return word === badWord } );

                if ( inCustomDictionary )
                    element.className = 'spell-good';
            }
        }) })
        .catch( function(error) { console.error('Fetch /Scans/GetCustomSpellings failed:', error)} );
    }
}

/*@ async @*/ function spellOptions( oLink, strClass ) {
    var SpellAction = {
        spellOther : 0,
        spellAdded : 1,
        spellRemoved : 2
    };

    try
    {
        var action = SpellAction.spellOther;
        var strWord = oLink.innerHTML;
        var i;
        var oAnchor;

        if ( strClass == "web" )
        {
            // add to custom dictionary
            var urlAdd = '/Scans/AddCustomSpelling?word=' + strWord;
            var urlRemove = '/Scans/RemoveCustomSpelling?word=' + strWord;

            if ( oLink.className == 'spell-good' )
            {
                // clicking word again removes it from dictionary
                action = SpellAction.spellRemoved;
                fetch( urlRemove );
            }
            else
            {
                action = SpellAction.spellAdded;
                fetch( urlAdd );
            }
        }
        else
        {
            // popup menu
            action = /*@ await @*/ appHost().SpellOptions(oLink,strWord);
        }

        if ( action == SpellAction.spellAdded )
        {
            // mark this one as good
            oLink.className = 'spell-good';

            // mark all instances of this word as good
            for ( i = 0; i < document.links.length; i++)
            {
                oAnchor = document.links[i];

                if ( oAnchor.className == 'spell-bad' && oAnchor.innerHTML == strWord )
                {
                    oAnchor.className = 'spell-good';
                }
            }
        }
        else if ( action == SpellAction.spellRemoved )
        {
            // mark this one as bad again
            oLink.className = 'spell-bad';

            // mark all instances of this word as good
            for ( i = 0; i < document.links.length; i++)
            {
                oAnchor = document.links[i];

                if ( oAnchor.className == 'spell-good' && oAnchor.innerHTML == strWord )
                {
                    oAnchor.className = 'spell-bad';
                }
            }
        }
    }
    catch( err )
    {
        // don't warn about this in exported reports
        //alert( "Spelling options are only available when the report is viewed in SortSite." );
    }
}

/*@ async @*/ function ruleOptions( buttonElement, ruleId ) {

    try {
        
        var bEnabled = /*@ await @*/ appHost().RuleOptions(buttonElement, ruleId);
        var element = document.getElementById( "rule-" + ruleId );

        if ( element ) {

            if ( bEnabled )
                element.className = '';
            else
                element.className = 'disabled';
        }

        toggleElement( "rule-" + ruleId + "-disabled" );

    } catch( err ) {
        alert( "Options are only available when the report is viewed in SortSite." );
    }
}

function pageOptions( buttonElement, url ) {

    try {
        appHost().PageOptions( buttonElement, url );
    } catch( err ) {
        alert( "Options are only available when the report is viewed in SortSite." );
    }
}

function toggleElement( id ) {

    // find the element
    var element = document.getElementById( id );
    var defaultDisplay = '';

    if ( element != null ) {

        // find a visible element of the same type to get the default display
        var tags = document.getElementsByTagName(element.tagName);
        for ( var i = 0 ; i < tags.length ; ++i ) {
            var style = getElementStyle( tags[i] );
            if ( style.display != 'none' ) {
                defaultDisplay = style.display;
                break;
            }
        }

        if ( getElementStyle(element).display == 'none' ) {
            element.style.display = defaultDisplay;
        } else {
            element.style.display = 'none';
        }
    }
}

function getElementStyle( element ) {

    if ( window.getComputedStyle ) {

        return getComputedStyle( element );

    } else {

        return element.currentStyle;
    }
}
