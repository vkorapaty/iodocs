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

    // Handle table
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
            // collection button.
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
    });
    
    // Add new set of collections to the page.
    $('.add-collection').click(function() {
        var originalCollection = $(this).parent()
                                    .siblings('td.parameter')
                                    .find('tr.collection-original');
        
        // Obtain identifier class of the current last element in the list of
        // collections
        var lastClass = $(this).parent().siblings('td.parameter')
            .children('table.parameters')
            .children('tbody')
            .children()
            .last().attr('class');

        // Determine the numeric identifier from the class, then increment and 
        // pass on value
        var collectionCount = 0;
        if ( /collection-original/.test(lastClass) ) {
            collectionCount = 1;
        }
        else {
            collectionCount = parseInt(lastClass.replace(/collection-new-/g, ''));
            collectionCount++;
        }

        // Add the new collection
        $(this).parent().siblings('td.parameter')
            .children('table.parameters')
            .children('tbody')
            .append(newCollection(originalCollection, collectionCount));
    });

    function newCollection( originalCollection, collectionCount ) {
        var string;
        var prefix = "<tr class='collection-new-",
            prefixEnd = "' >",
            suffix = "</tr>";

        string += "<tr><td><a href='#' class='collection-minimize' onclick='return false'>Minimize collection</a></td></tr>";
        for (var i = 0; i < originalCollection.length; i++) {
            string += prefix + collectionCount  + prefixEnd
                + originalCollection.get(i).innerHTML
                + suffix;
        }

        return string;
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
        var minimize_class = $(this).parent().parent().next().attr('class');
        // trim whitespace
        minimize_class = minimize_class.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
        //console.log($(this).parent().parent().siblings('.' + minimize_class));
        $(this).parent().parent().siblings('.' + minimize_class).slideToggle();
    });
})();
