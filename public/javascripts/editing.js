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

        // Send stuff to the server.
        var params = [],
            updateStuff = { name: 'test', value: getEditElement($(this)).html() };

        params.push(updateStuff);

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
