# API Reference

## Contents
 - `sailor`
	 - `.model(name, itemDef, modelDef)`
	 - `.bind(name, scope, property, filter)`
	 - `.calculate(func, subProps)`
 - `Model`
	 - `.bind(scope, propertyName, filter)`
	 - `.find(filter)`
	 - `.findOne(filter)`
	 - `.search(filter)`
	 - `.asyncSearch(filter)`
	 - `.refresh()`
	 - `.on(event, func)`
	 - `.off(event, func)`
 - `ModelItem`
	 - `.update(data, sync)`
	 - `.save()`
	 - `.refresh()`
	 - `.serverProperties(props)`
	 - `.destroy()`
	 - `.matches(filter)`

## `sailor`

The global sailer class.

### `.model(String name [, Object itemDef] [, Object modelDef])` -> `Model`

Allows you to define, modify, or fetch a model. The model is also `bind`ed into `sailor.<name>`. The object will automatically update when the server is modified.

`itemDef` is a set of properties to define on every model. Any items provided will override any value placed on that property in each model, and will not be synced with the server. Pass the result of `sailor.calculate` to a property to pre-calculate a function, or pass a model object or constructor to specify a connection to a model.

`modelDef` is a set of properties which is copied to the `Model` object.

Example:

	sailor.model("user", {
		getFullName: function() {
			return this.firstName + this.lastName;
		},
		posts: sailor.model("post")
	});

### `.bind(String name, Object scope [, String property] [, Object filter])` -> `Model`

Binds a model onto an object, with an optional filter. By default, `property` is a pluralized version of name (`name + 's'`). Filter is an optional Waterline filter object, which can also be used to sort. The object will automatically update when the server is modified.

Example:

	var models = {};
	sailor.bind("user", models, "olderUsers", { 'age': { '>=': 18 } });

### `.calculate(Function func [, Object subProps])` -> `Object`

Used to specify a property in a model definition that is determined by a function. The function is only called when the model is updated, and so can be used for doing tasks that could be intensive or should be cached.

`subProps` is a list of items which are added to the resulting value as key/value properties.

## `Model`

A model object, created by `sailor.model`, which automatically syncs with the server.

*Emits the `ready` event when the model data has been fetched.* You do not need to wait for the `ready` event to call any functions, except for the `.search` function.

### `.bind(Object scope [, String propertyName] [, Object filter])` -> `Model`

Binds the model to an object. See `sailor.bind` for more information.

### `.find(Object filter)` -> `Model`

Filters the model on the server, and returns the resulting filtered model. You can filter an already-filtered model.

### `.findOne(Object filter)` -> `Promise`

Finds a single model on the server, and returns a promise to allow you to wait for the request. The response will either be a `ModelItem` or `null` if the item was not found.

### `.search(Object filter)` -> `Array<ModelItem>`

Searches for all `ModelItem`s that match the supplied key/value pairs. Provide an array as the value to match either of the supplied values. The difference between this and `.find` is that this executes the search on the client, but has less features (no sorting, limited matching, etc).

Warning: this function must be called after the model items have loaded. If this is a problem, use `.asyncSearch` instead.

### `.asyncSearch(Object filter)` -> `Promise`

The same as `.search`, but waits for the model to load first.

### `.refresh()` -> `Promise`

Refreshes all items in the model, and then resolves the promise when all items are complete.

### `.on(String event, Function func)`

Assigns an event handler for the specified type. Possible event types are:

 - **ready** - called when the model is ready. This event is memorized - adding a handler after the event has been fired will call the handler immediately
 - **created** - called when a model is created on the server.
 - **updated** - called when a model is updated on the server.
 - **removed** - called when a model is removed from the server.

### `.off(String event, Function func)`

Removes a function from an event handler. See `.on` for a list of possible event types.

## `ModelItem`

A specific model item, with information pulled from the server.

### `.update(Object data [, Boolean sync = true])` -> `Promise`

Updates the model item. If `sync` is false, the data will only be updated on the client. Alternatively, you can set properties on the object and then call `.save` to save changes to the server. The promise is resolved when the operation is complete.

### `.save()` -> `Promise`

Saves the model item to the server. The promise is resolved when the model item is saved.

### `.refresh()` -> `Promise`

Refreshes the model item's data from the server. The promise is resolved after the data has been updated.

### `.serverProperties([Object props])` -> `Object`

Gets the properties from the object that can be synced to the server. This is excluding any items defined in the model definition except for connections. By default uses the properties on the model item, however you can provide `props` to use those properties instead.

### `.destroy()` -> `Promise`

Destroys the object on the client and server. The promise is resolved when the operation is complete.

### `.matches(Object filter)` -> `Promise`

Finds if the model item matches the specified filter.