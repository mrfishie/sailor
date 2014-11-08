/**
 * Sailor.js
 *
 * The #1 way to win the internet with Sails
 *
 * Copyright (c) 2014 mrfishie - Licensed under the MIT license
 */

// If someone already made Sailor, be nice to them before clobbering their functions later
var sailor = window.sailor || {};

// All the cool kids use anonymous enclosures
(function() {
    /**
     * GET a URL from a socket
     *
     * @param url {string} the url to request
     * @param additional {object?} additional information
     * @returns {Promise} the resulting promise
     * @private
     */
    function socketGet(url, additional) {
        return new Promise(function(resolve, reject) {
            additional = additional || {};
            io.socket.get(url, additional, resolve);
        });
    }

    /**
     * Processes the model name
     *
     * @param modelName {string} the model name to resolve
     * @returns {string} the resulting path
     */
    function resolveName(modelName) {
        var prefix = modelName.split('/');
        if (prefix.length > 1) {
            modelName = prefix.splice(prefix.length - 1, 1).join();
            prefix = prefix.join('/') + '/';
        } else prefix = '';

        return '/' + prefix + modelName;
    }

    var modelCache = sailor._modelCache = {};

    /**
     * Gets a model
     *
     * @param name {string} the name of the model
     * @param itemDef {object?} the item definition
     * @param modelDef {object?} the model definition
     * @param filter {object?} a Waterline filter
     */
    function getModel(name, itemDef, modelDef, filter) {
        filter = filter || {};
        var cacheName = name + JSON.stringify(filter);
        if (_.has(modelCache, cacheName)) {
            var model = modelCache[cacheName];
            if (itemDef) {
                model.itemDef = itemDef;
                model.refresh();
            }
            if (modelDef) model.modelDef = modelDef;
            return model.value;
        }

        var mdl = new Model(name, itemDef, modelDef, filter);
        modelCache[cacheName] = mdl;
        return mdl.value;
    }

    /**
     * Creates or updates a model definition
     *
     * @param name {string} the name of the model
     * @param itemDef {object?} the item definition
     * @param modelDef {object?} the model definition
     * @returns {object} the value of the model
     */
    sailor.model = function(name, itemDef, modelDef) {
        var model = getModel(name, itemDef, modelDef);

        if (!_.has(sailor, name + "s")) {
            model.bind(sailor);
            sailor[name] = createModelWrapper(modelCache[name + "{}"]);
        }

        return model;
    };

    /**
     * Binds a model to a property in an object
     *
     * @param name {string} the name of the model
     * @param scope {object} the scope object
     * @param property {string?} the property to place on the scope, default is pluralized name
     * @param filter {object?} a filter to use on the model
     * @returns {object} the value of the model
     */
    sailor.bind = function(name, scope, property, filter) {
        var cacheName = name + "{}";
        if (!_.has(modelCache, cacheName)) throw new Error("The specified model does not exist: " + name);
        var model = modelCache[cacheName];
        return model.bind(scope, property, filter);
    };

    /**
     * Allows a property to be calculated as a function only when the model is modifed
     *
     * @param func {function} the function to call
     * @param subProps {object} properties to add to the returned object
     * @returns {object} the object to be inserted into the model
     */
    sailor.calculate = function(func, subProps) {
        return _.merge({
            __precalc: func
        }, subProps);
    };

    /**
     * Adds the connection pre-calc flags to an object
     *
     * @param model {Model} the model object
     * @param obj {object} the object to add them to
     * @returns {object} The resulting object
     */
    function addConnectionPrecalc(model, obj) {
        var self = model;
        _.merge(obj, sailor.calculate(function (flags) {
            if (!this._previous) return;

            var isArray = _.isArray(this._previous), prevId;
            if (isArray) {
                prevId = _.map(this._previous, function(val) {
                    if (_.isNumber(val)) return val;
                    return val.id;
                });
            } else prevId = [_.isNumber(this._previous) ? this._previous : this._previous.id];

            return self.value.asyncSearch({id: prevId}).then(function(val) {
                if (!flags.noRefresh) for (var i = 0; i < val.length; i++) val[i].refresh();

                if (isArray) return val;
                return val.length ? val[0] : null;
            });
        }, {'__connection': model.name}));
        return obj;
    }

    /**
     * A model that syncs with the server
     *
     * @param modelName {string} the name of the model
     * @param itemDef {object?} the item definition
     * @param modelDef {object?} the model definition
     * @param filter {object?} a filter to apply to the object
     * @constructor
     */
    function Model(modelName, itemDef, modelDef, filter) {
        this.name = modelName;
        this.url = resolveName(modelName);
        this.itemDef = itemDef || {};
        this.modelDef = modelDef || {};
        this.filter = filter || {};
        this.children = {"{}": this};
        this.eventHandlers = {};
        this.value = [];
        this.value._isModel = true;

        var self = this;

        // Copy model definition
        _.merge(this.value, this.modelDef);

        /**
         * Binds the model to a scope, with an optional filter
         *
         * @param scope {object} the object to bind the model to
         * @param propertyName {string?} the property to bind on the scope
         * @param filter {object?} an optional Waterline filter
         * @returns {object} the resulting scope object
         */
        this.value.bind = function (scope, propertyName, filter) {
            // Process optional arguments
            if (!_.isString(propertyName)) {
                filter = propertyName;
                propertyName = self.name + "s";
            }
            filter = filter || {};

            // Merge filters to allow filtering on filtered models
            var useModel = self,
                    mergedFilter = _.merge(_.cloneDeep(self.filter), filter);

            if (!_.isEqual(mergedFilter, self.filter)) useModel = this.find(filter);
            scope[propertyName] = useModel.value;
            return useModel.value;
        };

        /**
         * Filters a model
         *
         * @param filter {object} the Waterline filter
         * @returns {object} the resulting scope object
         */
        this.value.find = function (filter) {
            // Avoid cyclic model items
            var mergedFilter = _.merge(_.cloneDeep(self.filter), _.mapValues(filter, function(val) {
                if (_.has(val, '_model')) return val.serverProperties();
                return val;
            }));
            var stringFilter = JSON.stringify(mergedFilter);
            if (_.has(self.children, stringFilter)) return self.children[stringFilter].value;

            var filteredModel = getModel(self.name, self.itemDef, self.modelDef, mergedFilter);
            self.children[stringFilter] = filteredModel;
            modelCache[self.name + stringFilter].children = self.children;

            return filteredModel.value;
        };

        /**
         * Filters a model and gets a single result
         *
         * @param filter {object} the Waterline filter
         * @returns {Promise} a promise for when the value has been found
         */
        this.value.findOne = function (filter) {
            var self = this;
            return new Promise(function (resolve) {
                self.find(filter).on('ready', function (val) {
                    if (val.length) resolve(val[0]);
                    else resolve(null);
                });
            });
        };

        /**
         * Finds items with the specified properties without querying the server
         *
         * @param filter {object} the properties to match
         * @returns {array} the resulting items
         */
        this.value.search = function (filter) {
            var mergedFilter = _.merge(_.cloneDeep(self.filter), filter);
            if (_.isEqual(mergedFilter, self.filter)) return this;

            var result = [];
            for (var i = 0; i < this.length; i++) {
                var item = this[i], matches = false;

                _.forEach(mergedFilter, function (expected, prop) {
                    var exp = _.isArray(expected) ? expected : [expected];
                    for (var x = 0; x < exp.length; x++) {
                        if (item[prop] === exp[x]) {
                            matches = true;
                            return false;
                        }
                    }
                });
                if (matches) result.push(item);
            }
            return result;
        };

        /**
         * Same as Model.search, but waits for the model to load first
         *
         * @param filter {object} the properties to match
         * @returns {Promise} the resulting items
         */
        this.value.asyncSearch = function (filter) {
            var self = this;
            return new Promise(function (resolve, reject) {
                self.on('ready', function () {
                    resolve(self.search(filter));
                });
            });
        };

        /**
         * Assigns a handler to an event
         *
         * @param event {string} the name of the event
         * @param func {function} the function to call
         */
        this.value.on = function (event, func) {
            if (!_.has(self.eventHandlers, event)) self.eventHandlers[event] = [];
            var handlerList = self.eventHandlers[event];
            handlerList.push(func);

            if (handlerList.triggered) func.apply(window, handlerList.argumentMemory);
        };

        /**
         * Removes a handler from an event
         *
         * @param event {string} the name of the event
         * @param func {function} the function to call
         */
        this.value.off = function(event, func) {
            if (!_.has(self.eventHandlers, event)) return;
            var handlerList = self.eventHandlers[event],
                index = handlerList.indexOf(func);
            if (index !== -1) handlerList.splice(index, 1);
        };

        /**
         * Refreshes all items in the model
         *
         * @returns {Promise} for when the operation is complete
         */
        this.value.refresh = function() {
            var refreshes = [];
            for (var i = 0; i < this.length; i++) refreshes.push(this[i].refresh());
            return Promise.all(refreshes);
        };

        /**
         * Emits an event on the model
         *
         * @param event {string} the name of the event
         * @param args {...} the arguments to supply to the functions
         */
        this.emit = function(event, args) {
            if (!_.has(this.eventHandlers, event)) return;
            var handlerList = this.eventHandlers[event];

            args = _.toArray(arguments).slice(1);
            for (var i = 0; i < handlerList.length; i++) {
                handlerList[i].apply(window, args);
            }
        };

        /**
         * Emits an event and remembers that it has been called
         * If a handler is added to the event later, it will be called immediately
         *
         * @param event {string} the name of the event
         * @param args {...} the arguments to supply to the functions
         */
        this.emitMemory = function(event, args) {
            if (!_.has(this.eventHandlers, event)) this.eventHandlers[event] = [];
            var handlerList = this.eventHandlers[event];
            this.emit.apply(this, arguments);

            args = _.toArray(arguments).slice(1);
            if (handlerList.triggered) _.merge(handlerList.argumentMemory, args);
            else {
                handlerList.triggered = true;
                handlerList.argumentMemory = args;
            }
        };

        // Automatically refresh
        this.refresh();

        // Possible actions to execute on a message
        var messageActions = {
            created: function(message) {
                var newModel = new ModelItem(message.data, self);
                if (_.isEqual(self.filter, {})) add();
                else {
                    newModel.matches(self.filter).then(function (match) {
                        if (match) add();
                    });
                }

                function add() {
                    self.value.push(newModel);
                    self.emit('created', newModel);
                }
            },
            updated: function(message) {
                var itemsWithId = self.value.search({id: message.id});
                if (itemsWithId.length) {
                    itemsWithId[0].update(message.data, false);
                    self.emit('updated', itemsWithId[0]);
                    return true;
                }
                return false;
            },
            destroyed: function(message) {
                var itemsWithId = self.value.search({id: message.id});
                if (itemsWithId.length) {
                    self.value.splice(self.value.indexOf(itemsWithId[0]), 1);
                    self.emit('removed', itemsWithId[0]);
                    return true;
                }
                return false;
            }
        };

        // Hook socket events to update model
        function onMessage(message) {
            if (_.has(messageActions, message.verb)) {
                if (messageActions[message.verb](message)) {
                    self.emit('changed', message.verb, message);
                }
            }
        }
        io.socket.on(this.name, onMessage);

        // Make the model value precalc-able
        addConnectionPrecalc(this, this.value);
    }

    /**
     * Gets all data for the model from the server
     *
     * @emits ready when the data is ready
     * @returns {Model} this
     */
    Model.prototype.refresh = function() {
        socketGet(this.url, this.filter).bind(this).then(function(data) {
            var dta = _.isArray(data) ? data : [data];
            while(this.value.length > 0) this.value.pop();
            for (var i = 0; i < dta.length; i++) {
                this.value.push(new ModelItem(dta[i], this));
            }

            this.emitMemory('ready', this.value);
        });
        return this;
    };

    /**
     * Saves all items in the model
     */
    Model.prototype.save = function() {
        for (var i = 0; i < this.value.length; i++) {
            this.value[i].save();
        }
    };

    /**
     * Creates a model wrapper
     *
     * @param model {Model} the model that owns the wrapper
     * @returns {ModelItem} the wrapper model item
     */
    function createModelWrapper(model) {
        function WrapperObject(data) {
            ModelItem.call(this, data, model);
            model.value.push(this);

            this._create(data).catch(function() { });
        }
        WrapperObject.prototype = _.create(ModelItem.prototype, {'constructor': WrapperObject});
        addConnectionPrecalc(model, WrapperObject);
        return WrapperObject;
    }

    /**
     * A model item that is synced with the server
     *
     * @param data {object} the default data for the object
     * @param model {Model} the owner model
     * @constructor
     */
    function ModelItem(data, model) {
        this._model = model;
        this._def = model.itemDef;
        this._update(data || {});
    }

    /**
     * Updates the model to represent the given data
     *
     * @param data {object} the data to add to the model
     * @param funcParams {object} parameters to pass to any precalc functions
     * @private
     */
    ModelItem.prototype._update = function(data, funcParams) {
        _.forEach(data, function(value, key) {
            if (_.isFunction(value)) {
                var self = this;
                Promise.resolve(value).then(function(val) {
                    self[key] = val;
                });
            } else this[key] = value;
        }, this);

        _.merge(this, data);
        _.forEach(this._def, function(value, key) {
            if (_.has(value, '__precalc')) {
                var func = value.__precalc, self = this, previousVal = data[key];
                Promise.resolve(func.call(_.merge(self, {_previous: previousVal}), funcParams || {})).then(function(val) {
                    self[key] = _.merge(val, previousVal);
                });
            } else this[key] = value;
        }, this);

        delete this._previous;
    };

    /**
     * Updates the items properties
     *
     * @param data {object} properties to update
     * @param sync {boolean=true} whether to sync changes with the server
     * @returns {Promise} for when the update is complete
     */
    ModelItem.prototype.update = function(data, sync) {
        this._update(data);

        if (typeof sync === "undefined") sync = true;

        var self = this;
        return new Promise(function(resolve, reject) {
            if (sync) {
                if (_.has(self, 'id')) {
                    io.socket.post(self._model.url + '/update/' + self.id, self.serverProperties(data), resolve);
                } else resolve(self._create(data));
            } else resolve();
        });
    };

    /**
     * Saves all of the items properties
     *
     * @returns {Promise} for when the update is complete
     */
    ModelItem.prototype.save = function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (_.has(self, 'id')) {
                io.socket.post(self._model.url + '/update/' + self.id, self.serverProperties(), resolve);
            } else resolve(self._create());
        });
    };

    /**
     * Creates the model on the server
     *
     * @param data {object?} optional data to create with
     * @returns {Promise} for when the creation is complete
     * @private
     */
    ModelItem.prototype._create = function(data) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var serverProps = self.serverProperties(data);
            io.socket.put(self._model.url + '/create/', serverProps, function(response) {
                if (response.error) reject(response);
                else {
                    _.merge(serverProps, response);
                    self._update(serverProps);
                }
            });
        });
    };

    /**
     * Refreshes all data in the model item
     *
     * @returns {Promise} for when the operation is complete
     */
    ModelItem.prototype.refresh = function() {
        if (!_.has(this, 'id')) return this._create();

        return socketGet(this._model.url + '/'+ this.id).bind(this).then(function(data) {
            this._update(data, { noRefresh: true });
        });
    };

    /**
     * Removes properties defined in the model definition, and correctly handles
     * connections
     *
     * @param {object?} props a set of properties to iterate over, default is current object
     * @returns {object} all properties
     */
    ModelItem.prototype.serverProperties = function(props) {
        var result = {};
        _.forEach(props || this, function(val, key) {
            if (val instanceof ModelItem) result[key] = val.serverProperties();
            else if (_.isArray(val)) {
                var allModelItems = [];
                for (var i = 0; i < val.length; i++) {
                    if (!(val[i] instanceof ModelItem)) {
                        allModelItems = false;
                        break;
                    } else allModelItems.push(val[i].serverProperties());
                }
                if (allModelItems) result[key] = allModelItems;
                else result[key] = val;
            }
            else if (_.has(this._def, key)) {
                if (_.has(this._def[key], '__connection')) {
                    result[key] = val;
                }
            }
            else if (key !== "_model" && key !== "_def") result[key] = val;
        }, this);
        return result;
    };

    /**
     * Deletes the model from the database
     *
     * @returns {Promise} for when deletion is complete
     */
    ModelItem.prototype.destroy = function() {
        // Remove from model
        var modelIndex = this._model.value.indexOf(this);
        if (modelIndex >= 0) this._model.value.splice(modelIndex, 1);

        // Delete from server
        var self = this;
        return new Promise(function(resolve, reject) {
            io.socket.delete(self._model.url + '/delete/?id=' + this.id, {}, resolve);
        });
    };

    /**
     * Finds if the item matches a given Waterline query
     *
     * @param query {object} the Waterline query
     * @returns {Promise} for when the operation is complete
     */
    ModelItem.prototype.matches = function(query) {
        return socketGet(this._model.url, query).bind(this).then(function(res) {
            for (var i = 0; i < res.length; i++) {
                if (res[i].id === this.id) return true;
            }
            return false;
        });
    };
}());