compass compile -e production --force
cat public/javascripts/content_parameters.js \
    public/javascripts/search.js \
    public/javascripts/docs.js \
    public/javascripts/json2.js \
    public/javascripts/utilities.js \
    public/javascripts/livedocs.js \
    | ./node_modules/uglify-js/bin/uglifyjs -o public/javascripts/files.min.js
