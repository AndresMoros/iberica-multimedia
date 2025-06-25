/* this file is only used by build 792 and should never be changed */

/*
    Developed by:
        PowerMapper Software Limited
        Quartermile Two
        2 Lister Square
        Edinburgh EH3 9GL
        Scotland

    Copyright PowerMapper Software Limited 2007-2017
*/

// plain JS equivalent of $(document).ready
if ( document.addEventListener ) {
    document.addEventListener("DOMContentLoaded", pageLoad );
} else { // IE8
    window.attachEvent('onload', pageLoad );
}

function addListener( selector, event, listener ) {

    // querySelectorAll works on IE8 and later (but IE8 only supports CSS2 selectors)
    // IE7 and earlier accounts for 0.35% of traffic in mid 2017
    if ( document.querySelectorAll ) {
        var elements = document.querySelectorAll( selector );

        for (var i = 0; i < elements.length; i++) {
            elements[i].addEventListener(event, listener);
        }
    }
}

function pageLoad()
{
    enableSpellings();

    // toggleChevron
    addListener( "a.chevron.toggleChevron", "click", function(event) {
        event.preventDefault();
        return toggleChevron( this.getAttribute('data-toggleid') );
    });

    // spelling
    addListener( "a.spell-bad.web", "click", function(event) {
        event.preventDefault();
        return spellOptions( this, "web" );
    });

    addListener( "a.spell-bad.desktop", "click", function(event) {
        event.preventDefault();
        return spellOptions( this, "desktop" );
    });

    // ruleOptions
    addListener( "button.menu.ruleOptions", "click", function(event) {
        return ruleOptions( this, this.getAttribute('data-ruleid') );
    });
}

function toggleChevron( id )
{
    var oElement = document.getElementById( "chev" + id );
    //alert( id + " " + oElement.outerHTML );

    if ( oElement.src.indexOf( "chevron-up.png" ) != -1 )
    {
        oElement.src = oElement.src.replace( "up", "down" );
    }
    else
    {
        oElement.src = oElement.src.replace( "down", "up" );
    }

    toggleVisibility( id );
}

function toggleVisibility( id )
{
    var oElement = document.getElementById( id );

    var strVisible = 'block';

    if ( window.getComputedStyle( oElement ).display == 'none' )
        oElement.style.display = strVisible;
    else
        oElement.style.display = 'none';
}

function enableSpellings()
{
    var oRows = document.getElementsByTagName('a');

    for ( i = 0 ; i < oRows.length ; ++i )
    {
        var oElement = oRows[i];

        if ( oElement.className == "spell-bad"  )
        {
            try
            {
                var strWord = oElement.innerHTML;

                var bCorrect = window.external.GetSpellingCorrect( strWord );

                if ( bCorrect )
                    oElement.className = 'spell-good';
            }
            catch(err)
            {
                //Do nothing
            }
        }
    }
}

function spellOptions( oLink, strClass ) {

    SpellAction = {
        spellOther : 0,
        spellAdded : 1,
        spellRemoved : 2
    };

    try
    {
        var action = SpellAction.spellOther;
        var strWord = oLink.innerHTML;

        if ( strClass == "web" )
        {
            // add to custom dictionary
            var urlAdd = '/Scans/AddCustomSpelling?word=' + strWord;
            var urlRemove = '/Scans/RemoveCustomSpelling?word=' + strWord;

            if ( $( '#iframeSpelling' ).attr('src') == urlAdd )
            {
                // clicking word again removes it from dictionary
                action = SpellAction.spellRemoved;
                $( '#iframeSpelling' ).attr('src', urlRemove );
            }
            else
            {
                action = SpellAction.spellAdded;
                $( '#iframeSpelling' ).attr('src', urlAdd );
            }
        }
        else
        {
            // popup menu
            action = window.external.SpellOptions( strWord );
        }

        if ( action == SpellAction.spellAdded )
        {
            // mark this one as good
            oLink.className = 'spell-good';

            // mark all instances of this word as good
            for (var i = 0; i < document.links.length; i++)
            {
                var oAnchor = document.links[i];

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
            for (var i = 0; i < document.links.length; i++)
            {
                var oAnchor = document.links[i];

                if ( oAnchor.className == 'spell-good' && oAnchor.innerHTML == strWord )
                {
                    oAnchor.className = 'spell-bad';
                }
            }
        }
    }
    catch( err )
    {
        alert( "Spelling options are only available when the report is viewed in SortSite." );
    }

    // don't jump around or scroll after showing options menu
    return false;
}

function ruleOptions( buttonElement, ruleId ) {

        try {
            var bEnabled = window.external.RuleOptions( buttonElement, ruleId );
        } catch( err ) {
            alert( "Options are only available when the report is viewed in SortSite." );
        }

        // don't jump around or scroll after showing options menu
        return false;
    }