# [<img src="http://i.imgur.com/VjhXaUr.png" alt="Sailor logo" title="Sailor" width="804px" />](http://mrfishie.github.io/sailor)

## Deprication Notice: While this project is still pretty new, I haven't had the time or willpower to fix many of the glaring issues and bugs in Sailor. I might start working on this project again sometime in the future, but for now, I'm not working on any updates/additions for this project.

**The #1 way to win the internet with [Sails](http://sailsjs.org/)**

### `bower install sailor-client --save`
### [Website](http://mrfishie.github.io/sailor) - [Getting Started](http://mrfishie.github.io/sailor/#/getStarted) - [Documentation](http://mrfishie.github.io/sailor/#/documentation)

[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/mrfishie/sailor?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## What is Sailor?

[Sails](http://sailsjs.org/) is awesome. Real-time single-page webapps are awesome. But what if you want to combine them
both? Sure, Sails has a websocket API that allows you to access your models from the browser, but that is annoying. Sailor
lets you access your models as if you were on the server, with some added treats. You can easily add, update, remove,
watch, or even integrate with Angular. All that with only a couple of lines of code.

## Bind your models

See how easy it is to bind your Sails models to your browser-based Javascript code with Sailor.

```js
var users = sailor.model("user");
users.findOne({id: currentUserId}).then(function(user) {
	user.lastLogin = Date.now();
	user.save();
});

users.on('changed', function() {
	$('.userList').empty();
	for (var i = 0; i < users.length; i++) {
		$("<div>" + users[i].username + "</div>").appendTo('.userList');
	}
});
```

## Specify connections

Sailor lets you specify connections between models, allowing for cyclic structures.

```js
var topics = sailor.model("topic", {
	author: sailor.model("user"),
	comments: sailor.model("comment")
});
var users = sailor.model("user", {
	topics: sailor.model("topic")
});
```

## Use with your favorite framework

Sailor doesn't care about what you are using for the rest of your website (except for Sails, Lo-dash, and Bluebird, of course),
and as a result, is easily integrated with your favorite web framework, be it Angular, Ember, Vue, Backbone, or anything else.

```js
sailor.model("topic").bind($scope, "topics"); // bind a model to an Angular scope
sailor.model("topic").bind(vm.$data, "topics"); // bind to a Vue model
window.topics = Backbone.Model.extend(sailor.model("topic")); // bind to a Backbone model
```

### Angular Binding

**This feature is still in development and is not available yet**

While Sailor can be used with Angular out-of-the-box, you can install the `sailor-ng` [Bower](http://bower.io/) package to
make your site even more awesome and automatically update the server when anything changes in your scope.

```js
sailor.model("topic").$bind($scope);
```


## What's Next?

Download via [Bower](http://bower.io/): `bower install sailor-client --save`

Check out the [Getting Started guide](http://mrfishie.github.io/sailor/#/getStarted) and the
[documentation](http://mrfishie.github.io/sailor/#/documentation)
