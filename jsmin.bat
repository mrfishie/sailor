@echo off
uglifyjs lib/sailor.js -o lib/sailor.min.js --source-map lib/sailor.min.src --comments --stats -m -c drop_console