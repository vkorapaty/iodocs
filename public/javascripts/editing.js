(function() {
    $('.edit').on("click", function(event) {
        event.stopPropagation();
        editField($(this));


    });

    $('.cancel-edit').on("click", function(event) {
        event.stopPropagation();
        $(this).siblings('.edit').show();
        $(this).hide();
        $(this).siblings('.save-edit').hide();
        getEditElement($(this)).children().remove();
    });

    $('.save-edit').on("click", function(event) {
        event.stopPropagation();
        $(this).siblings('.edit').show();
        $(this).hide();
        $(this).siblings('.cancel-edit').hide();
        var editElem = getEditElement($(this));
        var updatedField = editElem.children('textarea').val();
        editElem.children().remove();
        editElem.replaceWith(updatedField);


        var change = {};
    // endpoint name
        change['name'] = $(this).closest('li.endpoint').find('span.name').first().children().first().html();
    // MethodName
        change['MethodName'] = $(this).closest('li.method').find('span.name').html();
    // HTTPMethod
        change['HTTPMethod'] = $(this).closest('li.method').find('span.http-method').html();
    // Synopsis 
        if ($(this).parent().is('form')) {
            change['Synopsis'] = getEditElement($(this)).html() || '';
        }
    // Check if content parameter
        if ($(this).parent().is('li.description')) {
            change['contentParam'] = true;
        }
        else {
            change['contentParam'] = false;
        }
    // Parameter Name and Description
        if ($(this).parent().is('td.description, li.description')) {
            // param name
            change['Name'] = $(this).parent().siblings('td.name, li.name').html();
            // param desc
            change['Description'] = getEditElement($(this)).html();
        }

        // Send stuff to the server.
        if (change['Synopsis']) {
            var params = [
                {name: 'name', value: change['name']},
                {name: 'MethodName', value: change['MethodName']},
                {name: 'HTTPMethod', value: change['HTTPMethod']},
                {name: 'Synopsis', value: change['Synopsis']},
            ];
        }
        else {
            var params = [
                {name: 'name', value: change['name']},
                {name: 'MethodName', value: change['MethodName']},
                {name: 'HTTPMethod', value: change['HTTPMethod']},
                {name: 'contentParam', value: change['contentParam']},
                {name: 'Name', value: change['Name']},
                {name: 'Description', value: change['Description']},
            ];
        }

        $.post('/editDoc', params, function(result, text) {
            console.log(result);
        })
        .error(function(err, text) {
            console.log('ERROR!');
            console.log(err);
        });

    });

    function editField (editIcon) {
        var editElem = getEditElement(editIcon);
        var editText = editElem[0].outerHTML;
        editElem.append('<br><textarea>'+ editText +'</textarea>');

        // Hide edit icon, show save and cancel icons.
        editIcon.hide();
        editIcon.siblings('.save-edit').show();
        editIcon.siblings('.cancel-edit').show();
    }

    function getEditElement (icon) {
        if (icon.parent().is('form')) {
            return icon.siblings('span.description');
        }
        else if (icon.parent().is('td.description, li.description')) {
            return icon.siblings().filter('p');
        }
        else {
            console.log('Unexpected element.');
            console.log(icon);
            console.log('parent.');
            console.log(icon.parent());
            console.log('parent of parent.');
            console.log(icon.parent().parent());
        }
    }
})();
