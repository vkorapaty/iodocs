(function() {
    $('.edit').on("click", function(event) {
        event.stopPropagation();
        console.log($(this).siblings());
    });
})();
