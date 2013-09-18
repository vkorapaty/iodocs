(function() {
    // When a PUT or POST method is opened, populate the content/request-body
    // area with the defaults set for the method.
    $('li.method.post > div.title, li.method.put > div.title').on('click', function(event) {
        event.stopPropagation();
        updateContentTextArea($(this).parent().children('form').children('div.content'));
    });
 
    // Whenever there is a change to an input field or select field in a
    // PUT/POST methods' content parameters, update the content area of the
    // method to which the modified parameter belongs.
    $('.content').find('ul.parameters').on( "change click keyup", "input, select", function(event) {
        event.stopPropagation();
        updateContentTextArea($(this));
    });

    // Given a parameter element, find the 'div.content' block it belongs to,
    // and inspect all of the parameters elements of that block. Update the
    // content area with the results of the inspection.
    function updateContentTextArea( elem ) {
        var root = elem.closest('div.content');
        var paramList = root.children('ul.parameters');
        var snapshotObject = handleTable(paramList); 
        updateTextArea( elem, snapshotObject );
    }

    // Updating method content area based on content parameters
    // --------------------------------------------------------

    // Figuring out how to style nested tables seemed like more work than using
    // lists of lists to model objects. This function attempts to treat the
    // list structure as a table.
    // 
    // 'li > ul' are the row abstraction. Take the li, and then process the sub-ul.
    //
    // Each 'row' of the list is inspected based on the type of the row,
    // and the appropriate values are extracted from the row (and sub-rows,
    // it the row has sub-rows).
    function handleTable( paramList , type ) {
        if (type == 'collection') {
            var collectionValue = handleCollection(paramList.children('li'));
            if (collectionValue.length > 0) {
                return collectionValue;
            }
            else {
                return;
            }
        }

        if (type == 'object') {
            var objectValue = handleObject(paramList.children('li'));
            if (Object.keys( objectValue ).length !== 0) {
                return objectValue;
            }
            else {
                return;
            }
        }

        if (type == 'list' || type == 'list-only') {
            var listValue = handleList(paramList.children('li'));
            if (listValue.length > 0) {
                return listValue;
            }
            else {
                return;
            }
        }

        var rows = paramList.children('li');
        var obj = {};

        // Go through each row and obtain the name and value of the row.
        // rowValue calls handleTable if there are sub-rows as in the case
        // of collections, objects, and lists.
        //
        // Rows that have the type of 'list-only' are a special case. The
        // expected use case is for a method that expects an array in the
        // content body, and not an object. It's expected that a 'list-only'
        // parameter is the only content parameter for the method.
        rows.each(function () {
            var row = $(this).children('ul');

            var type = row.children('li.type').text();
            type = type.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

            if ( !row.hasClass('header') ) {
                var name = rowName( row );
                var val = rowValue( row );
            }

            if (type == 'list-only') {
                obj = rowValue(row);
            }
            else {
                $.extend(obj, createSimpleObject(name, val));
            }
        });

        return obj;
    }

    // Collect values for a given collection element.
    // What are the children I'm getting? Rows.
    function handleCollection( elements ) {
        var collectionsArray = [];
        elements.children().each(function (event) {
            var val = rowValue( $(this) );
            var name = rowName( $(this) );
            var attr = $(this).parent().attr('class');
            // This is to ignore the row which contains the minimize collection
            // button.
            if ( attr != '' &&  undefined != attr && undefined !== val ) {
                collectionsArray.push({ 'name': name, 'value': val, 'class': attr });
            }
        });

        return createCollectionValue( collectionsArray );
    }

    // Collect all of the properties and property values for the object
    // elements.
    function handleObject( elements ) {
        var tempObj = {};
        elements.children().each(function (event) {
            var val = rowValue( $(this) );
            var name = rowName( $(this) );

            $.extend(tempObj, createSimpleObject(name, val));
        });

        return tempObj;
    }

    // Unlike handleObject and handleCollection, handleList gets the set of
    // 'li' elements that contain values to be processed. rowValue is not
    // needed here, provided that only the basic input types are present
    // (string/integer/enumerated).
    //
    // Collect information of the list elements
    function handleList( elements ) {
        var collectionsArray = [];
        elements.children().each(function (event) {
            var val = formatValue($(this).val(), '');
            if (val) {
                collectionsArray.push( val );
            }
        });

        return collectionsArray;
    }

    function rowName( row ) {
        return name = row.children('li.name') .text();
    }

    // Obtain the value of a given row. If the row has the type of 'collection',
    // 'object', 'list', or 'list-only' recurse through the sub-rows to obtain
    // the value for the row.
    function rowValue( row ) {
        var type = row.children('li.type').text();
        type = type.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

        if (type == 'boolean' || type == 'enumerated' || type == 'string' || type == 'integer' || type == '') {
            var val;
            val = row.children('li.parameter')
                .children('input, select')
                .val();

            if (val != '') {
                return formatValue(val, type);
            }
        }
        else if (type == 'collection' || type == 'object' ) {
            var paramList  = row.children('li.parameter').children('ul.parameters');
            return handleTable(paramList, type);
        }
        else if (type == 'list' || type == 'list-only') {
            var paramList  = row.children('li.parameter').children('ul');
            return handleTable(paramList, type);
        }
    }

    // Take collected information (collectionsArray), and create an array of objects
    // that will be displayed as the value for the collection-owner parameter.
    //
    //     [                                                    [
    //        {                                                    {
    //           name: 'id',                                          'id':324,
    //           value: '324',                                        'enabled':false
    //           class: 'collection-new-2'                         },
    //        },                                                   {
    //        {                               -> becomes ->           'id':8934,
    //           name: 'enabled',                                     'enabled':true
    //           value: 'false',                                   }
    //           class: 'collection-new-2'                      ]
    //        },                                         
    //        {
    //           name: 'id',
    //           value: '8934',
    //           class: 'collection-new-3'
    //        },
    //        {
    //           name: 'enabled',
    //           value: 'true',
    //           class: 'collection-new-3'
    //        }
    //     ]
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
                    collectionValue.push(tempObj);
                    tempObj = {};
                }
                tempObj = createSimpleObject(name, value);
            }

            // Handle a 1 object collection, or the last object in the collection.
            if ( i == collectionsArray.length - 1 ) {
                if (Object.keys( tempObj ).length !== 0) {
                    collectionValue.push(tempObj);
                }
            }
        }

        return collectionValue;
    }

    function createSimpleObject( name, value ) {
        var tempObj = {};
        tempObj[name]= value;
        return tempObj;
    }

    // This function makes it so that 'true', 'false', and 'integer' values will
    // not show up as strings (encased in quotation marks) in the text area.
    function formatValue( value, type ) {
        if ( value == 'value' || value == 'true' ) { 
            return true;
        }
        else if ( value == 'false' ) {
            return false;
        }
        else if ( /^\d+$/.test(value) ) {
            if (type == 'string') {
                return value;
            }
            else {
                return parseInt(value);
            }
        }
        else {
            return value;
        }
    }

    // Determine the text area to which the given element belongs, parse the 
    // data given into a string and update the text area with the stringified
    // data.
    function updateTextArea( element, dataObject ) {
        var goal = element.closest('li.method')
                        .children('form')
                        .children('div.content')
                        .children('div.fields')
                        .children('textarea');

        goal.val(JSON.stringify(dataObject, null, 2));
    }

    // Adding new collections to the page
    // ----------------------------------
    // When a plus icon is clicked on, create an additional set of fields to represent
    // another object belonging to the collection.
    $('li.name').on('click', 'a.add-collection, a.add-list', function( event ) {
        event.stopPropagation();
        if ( $(this).hasClass('add-collection') ) {
            var collectionClass = $(this).parent()
                                .siblings('li.parameter')
                                .children('ul.parameters')
                                .children(':first')
                                .attr('class');

            collectionClass = collectionClass.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            
            var collectionBody = $(this).parent()
                                .siblings('li.parameter')
                                .children('ul.parameters')
                                .clone(true, true);

            // Obtain identifier class of the current last element in the list of
            // collections.
            var lastRow = $(this).parent().siblings('li.parameter')
                .children('ul.parameters')
                .children()
                .last();

            // Determine the numeric identifier from the class and increment the
            // value.
            var collectionCount = 0;
            if (lastRow.hasClass('collection-original')) { 
                collectionCount = 1;
            }
            else {
                collectionCount = parseInt(lastRow.attr('class').replace(/collection-new-/g, ''));
                collectionCount++;
            }

            newCollectionObject(collectionBody, collectionClass, collectionCount);

            // Add the additional object to the page.
            $(this).parent().siblings('li.parameter')
                        .children('ul.parameters')
                        .append(collectionBody.children());
        }
        else if ( $(this).hasClass('add-list') ) {
            // Get the 'ul' element in li.parameter for this 'list' type row.
            var listElement = $(this).parent().siblings('li.parameter').children('ul');
            // Make a copy of the first list element, and then append that to the end of the list.
            var firstListElement = listElement.children().first().clone();
            firstListElement.appendTo(listElement);
        }
    });

    // Update the class attribute of the rows of the collectionBody elements.
    function newCollectionObject(collectionBody, collectionClass, collectionCount) {
        collectionBody.children().each(function() {
            var type = $(this).children('ul').children('li.type').text();
            type = type.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

            if (!$(this).hasClass(collectionClass)) {
                $(this).remove();
            }
            else {
                $(this).removeClass(collectionClass);
                $(this).addClass('collection-new-'+collectionCount);
                if (type == 'collection') {
                    newCollectionObject($(this).children('ul.collection')
                                        .children('li.parameter')
                                        .children('ul.parameters'),
                                          collectionClass,
                                          collectionCount
                                        );
                }
            }
        });
    }

    // Minimize functionality for objects and collections
    // --------------------------------------------------
    // When a triangle is clicked on, hide the fields associated with the
    // button. 
    $('li').on("click", "a.collection-minimize, a.list-minimize", function(event) {
        event.stopPropagation();
        // Get the class of the following row.
        var minimize_class = $(this).parent().parent().parent().next().attr('class');
        // Object case.
        if (minimize_class === undefined) {
            $(this).parent().parent().parent().siblings().slideToggle();
        }
        // Collection case.
        else {
            // Trim whitespace
            minimize_class = minimize_class.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            // Minimize all following rows of the same class.
            $(this).parent().parent().parent().siblings('.' + minimize_class).slideToggle();
        }
        // Rotating the minimize button.
        if ($(this).parent().hasClass('rotate')) {
            $(this).parent().removeClass('rotate');
        }
        else {
            $(this).parent().addClass('rotate');
        }
    });
})();
