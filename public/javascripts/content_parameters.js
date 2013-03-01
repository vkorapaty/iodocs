(function() {
    // On click or data entry/change in content parameters, this block will capture
    // the event and things will happen, dominos will fall, and pigs will fly.
    $('.content').find('td.parameter').on( "change click keyup", "input, select", function(event) {
        event.stopPropagation();
        tree($(this));
    });

    function tree( elem ) {
        var root = elem.closest('div.content');
        var table = root.children('table.parameters');
        var snapshotObject = handleTable(table); 
        updateTextArea( elem, snapshotObject );
    }

    /*
     The model for this is that each row of a given table is a property.
     handleTable, handleCollection, handleList, rowName, and rowValue all 
     work off of the basis that a row has 4 particular fields: name, parameter,
     type, and description. Collections, objects, and lists set themselves up
     as tables within the parameter field of a given row;
     as such, whenever a row that has a type of 'collection', 'object', or 'list'
     is encoutered, the contents of the parameter field for that row can be
     operated on recursively.
    */

    function handleTable( table , type ) {
        if (type == 'collection') {
            var collectionValue = handleCollection(table.children('tbody'));
            if (collectionValue.length > 0) {
                return collectionValue;
            }
            else {
                return;
            }
        }

        if (type == 'object') {
            var objectValue = handleObject(table.children('tbody'));
            if (Object.keys( objectValue ).length !== 0) {
                return objectValue;
            }
            else {
                return;
            }
        }

        if (type == 'list') {
            var listValue = handleList(table.children('tbody'));
            if (listValue.length > 0) {
                return listValue;
            }
            else {
                return;
            }
        }

        var rows = table.children('tbody').children('tr');
        var obj = {};

        rows.each(function () {
            var name = rowName( $(this) );
            var val = rowValue( $(this) );

            $.extend(obj, createSimpleObject(name, val));
        });

        return obj;
    }

    function handleCollection( element ) {
        // Collect information of all collection elements
        var collectionsArray = [];
        // What are the children I'm getting? Rows.
        element.children().each( function (event) {
            var val = rowValue( $(this) );
            var name = rowName( $(this) );
            var attr = $(this).attr('class');
            // This is to ignore the row which contains the minimize collection
            // button.
            if ( attr != '' &&  undefined != attr && undefined !== val ) {
                collectionsArray.push({ 'name': name, 'value': val, 'class': attr });
            }
        });

        return createCollectionValue( collectionsArray );
    }

    function handleObject( element ) {
        // Collect all of the properties and property values for the object
        // element.
        var tempObj = {};
        // What are the children I'm getting? Rows.
        element.children().each( function (event) {
            var val = rowValue( $(this) );
            var name = rowName( $(this) );

            $.extend(tempObj, createSimpleObject(name, val));
        });

        return tempObj;
    }

    function handleList ( element ) {
        // Collect information of all list elements
        var collectionsArray = [];
        element.children().each( function (event) {
            var val = rowValue( $(this) );
            var attr = $(this).attr('class');
            // This is to ignore the row which contains the minimize
            // list button.
            if ( attr != '' &&  undefined != attr ) {
                collectionsArray.push( val );
            }
        });

        return collectionsArray;
    }

    function rowName( row ) {
        return name = row.children('td.name')
            .text()
            .replace(/Add\s+\w+/g, '');
    }

    function rowValue( row ) {
        var type = row.children('td.type').text();
        type = type.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

        // '' option for list type, where parameter fields do not have an
        // associated type field. Could add type field back and not have this
        // problem. Or the ''== type can be the final else clause.
        if (type == 'enumerated' || type == 'string' || type == 'integer' || '' == type) {
            var val;
            val = row.children('td.parameter')
                .children('input, select')
                .val();

            if (val != '') {
                return formatValue(val);
            }
        }

        else if (type == 'collection' || type == 'object' || type == 'list') {
            var table  = row.children('td.parameter').children('table.parameters');
            return handleTable(table, type);
        }
    }

    function createCollectionValue( collectionsArray ) {
        var currentObj = '',
            tempObj = {},
            collectionValue = [];

        for ( var i = 0; i < collectionsArray.length; i++ ) {
            var name = collectionsArray[i]['name'];
            var value = collectionsArray[i]['value'];
            
            // Creating an object with all of its properties and values.
            if ( collectionsArray[i]['class'] == currentObj ) {
                $.extend(tempObj, createSimpleObject(name, value));
            }
            // A new/different object has been found, push the current object
            // on to an array saving completed objects, and setup a new object.
            else {
                currentObj = collectionsArray[i]['class'];
                if (Object.keys( tempObj ).length !== 0) {
                    // In the future: check tempObj against schema before adding
                    collectionValue.push(tempObj);
                    tempObj = {};
                }
                tempObj = createSimpleObject(name, value);
            }

            // Handle a 1 object collection, or the last object in the collection.
            if ( i == collectionsArray.length - 1 ) {
                if (Object.keys( tempObj ).length !== 0) {
                    // In the future: check tempObj against schema before adding
                    collectionValue.push(tempObj);
                }
            }
        }

        return collectionValue;
    }
    // Take collected information (collectionsArray), and create an array of objects
    // that will be displayed as the value for the collection-owner parameter.
    //
    // [                                                    [
    //    {                                                    {
    //       name: 'id',                                          'id':324,
    //       value: '324',                                        'enabled':false
    //       class: 'collection-new-2'                         },
    //    },                                                   {
    //    {                               -> becomes ->           'id':8934,
    //       name: 'enabled',                                     'enabled':true
    //       value: 'false',                                   }
    //       class: 'collection-new-2'                      ]
    //    },                                         
    //    {
    //       name: 'id',
    //       value: '8934',
    //       class: 'collection-new-3'
    //    },
    //    {
    //       name: 'enabled',
    //       value: 'true',
    //       class: 'collection-new-3'
    //    }
    //  ]

    function createSimpleObject( name, value ) {
        var tempObj = {};
        tempObj[name]= value;
        return tempObj;
    }

    function formatValue( value ) {
        if ( value == 'value' || value == 'true' ) { 
            return true;
        }
        else if ( value == 'false' ) {
            return false;
        }
        // Should probably add a seperate check to see if its a number type to
        // begin with
        else if ( /^\d+$/.test(value) ) {
            return parseInt(value);
        }
        else {
            return value;
        }
    }
    // This function makes it so that 'true', 'false', and 'integer' values will
    // not show up as strings (encased in quotation marks). formatValue()
    // was originally intended just for 'select' elements, but has been modified 
    // to affect 'input' elements as well. This doesn't seem a bad thing, will
    // reconsider with input.

    function updateTextArea( element, dataObject ) {
        // Determine the text area to which this parameter belongs
        var goal = element.closest('li.method')
                        .children('form')
                        .children('div.content')
                        .children('div.fields')
                        .children('textarea');

        // Update the text field
        goal.val(JSON.stringify(dataObject, null, 2));
    }

    //
    // Adding new collections to the page
    // 
    // First thing, add 'add' button to parameters of type 'collection'
    $("td.type:contains('collection')").each(function() {
        $(this).siblings('td.name')
            .append("<br/><a href='#' class='add-collection' onclick='return false'>Add collection</a>");
    // The onclick='return false' may be no good.
    });
    
    // What I'm looking at doing:
    // *Click 'Add collection'
    // *Clone node and sub-nodes. (basically clone the row that the node 
    // belongs to)
    //      - What exactly am I aiming to copy?
    //          = The *rows* of the collection table, not the collection row, 
    //          not the collection table.
    //      ^ Implementation details
    //          & Get tbody
    //          & Get appropriate rows from this tbody
    //          & Sounds like the place for the recursion to occur
    //              & Have to check the types of the rows within...
    //          & Keep the minimize row <--- IMPORTANT, minimize row looks like
    //          it's implemented generally enough for it to not break stuff.
    //          Note that there should only be one minimize row, or something
    //          along those lines for each add... this should probably be fleshed
    //          out more.
    // *Change collection-original for top node to appropriate class
    // *Remove unnecessary sub-nodes. (anything that isn't collection-original
    // in the sub-notes/sub-rows)
    // *Put updated block into correct position. 
    $('td.name').on('click', 'a.add-collection', function( event ) {
        event.stopPropagation();

        var collectionClass = $(this).parent()
                            .siblings('td.parameter')
                            .children('table.parameters')
                            .children('tbody')
                            .children(':first')
                            .attr('class');

        collectionClass = collectionClass.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        
        var collectionBody = $(this).parent()
                            .siblings('td.parameter')
                            .children('table.parameters')
                            .children('tbody')
                            .clone(true, true);

        // Obtain identifier class of the current last element in the list of
        // collections
        var lastRow = $(this).parent().siblings('td.parameter')
            .children('table.parameters')
            .children('tbody')
            .children()
            .last();

        // Determine the numeric identifier from the class, then increment and
        // pass on value
        var collectionCount = 0;
        if (lastRow.hasClass('collection-original')) { 
            collectionCount = 1;
        }
        else {
            collectionCount = parseInt(lastRow.attr('class').replace(/collection-new-/g, ''));
            collectionCount++;
        }

        newCollectionObject(collectionBody, collectionClass, collectionCount);

        $(this).parent().siblings('td.parameter')
                    .children('table.parameters')
                    .children('tbody')
                    .append(collectionBody.children());
    });

// So the added collections do have the event handler thing,
// it's that they do not have the 'collection-original' class, and so they are 
// being deleted before they can be added.
// It seems like getting the class of the row from which was clicked on
// and using that inplace of 'collection-original'... should work...
    function newCollectionObject(collectionBody, collectionClass, collectionCount) {
        // Rows
        collectionBody.children().each(function() {
            var type = $(this).children('td.type').text();
            type = type.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

            if (!$(this).hasClass(collectionClass)) {
                $(this).remove();
            }
            else {
                $(this).removeClass(collectionClass);
                $(this).addClass('collection-new-'+collectionCount);
                if (type == 'collection') {
                    newCollectionObject($(this).children('td.parameter') 
                                            .children('table.parameters')
                                            .children('tbody'),
                                          collectionClass,
                                          collectionCount
                                        );
                }
            }
        });
    }

    //
    // Adding addition fields for list type
    // 
    // First thing, add 'add' button to parameters of type 'list'
    $("td.type:contains('list')").each(function() {
        $(this).siblings('td.name')
            .append("<br/><a href='#' class='add-list' onclick='return false'>Add list field</a>");
    });

    // Add additional fields for list type element.
    $('.add-list').click(function() {
        var originalList = $(this).parent()
                                    .siblings('td.parameter')
                                    .find('tr.list-element');
        
        // Add the new list
        $(this).parent().siblings('td.parameter')
            .children('table.parameters')
            .children('tbody')
            .append(originalList.get(0).outerHTML);
    });

    //
    // Minimize functionality for collections and lists
    // 
    $('td').on("click", "a.collection-minimize, a.list-minimize", function(event) {
        event.stopPropagation();
        // Get the class of the following row
        var minimize_class = $(this).parent().parent().next().attr('class');
        // trim whitespace
        minimize_class = minimize_class.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        // Minimize all following rows of the same class.
        $(this).parent().parent().siblings('.' + minimize_class).slideToggle();
    });
})();
