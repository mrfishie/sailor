# [<img src="http://i.imgur.com/VjhXaUr.png" alt="Sailor logo" title="Sailor" width="804px" />](http://github.com/mrfishie/sailor)

**The #1 way to win the internet with [Sails](http://sailsjs.org/)**

Sailor lets you access [Sails](http://sailsjs.org/) server-side models as if they were in the browser, with some added treats.

# Getting Started

To use Sailor, clone this repo or install with Bower (preferred)

	bower install sailor --save

Sailor requires [Lo-Dash](https://lodash.com/) and [Bluebird](https://github.com/petkaantonov/bluebird).

Check out the basics or the API documentation.

# The Basics

*Tell Sailor about your model:*

	sailor.model("user");

*Access items in your model:*
	
	sailor.users.on('ready', function() {
		sailor.users; // [...items]
	});

*Bind the model to another object:*

	var myObject = {};
	sailor.bind("users", myObject, "Users"); // or sailor.users.bind(myObject, "Users");
	myObject.Users; // [...items]

*Filter a model with Waterline:*

	sailor.users.find({ age: { '>': 13 } }).on('ready', function(itms) {
		console.log(itms); // [...items]
	});

*Create a new model item:*

	var user = new sailor.user({ username: 'mrfishie' });
	user.age = 25;
	user.name = "Bob Bobsworth";
	user.save().then(function() {
		console.log("Saved changes to the user");
	});

*Update the model item:*

	user.update({
		loginCount: user.loginCount + 1,
		status: $status.val()
	}).then(function() {
		console.log("Updated the user");
	});

*Destroy the model item:*
	
	user.destroy().then(function() {
		console.log("Destroyed the user");
	});

## Model Definitions

When defining models in your Sails server application, Sails allows you to define methods that can be called on a model. Sailor allows you to do this too, as well as define properties that are not saved on the server.

	sailor.model("user", {
		getFullName: function() {
			return this.firstName + this.lastName;
		},
		foo: "bar"
	});
	
	sailor.users[0].getFullName();
	sailor.users[0].foo; // "bar"

You can return a promise from this function to only set the value when the promise is resolved.

## Model Connections

Connections between models are an important part of any database-based application. Since Sails only provides a certain depth of models in models through its websocket interface, you can easily tell Sailor when a model connects to another.

	sailor.model("user", {
		posts: sailor.model("post");
	});

Sailor supports cyclic connections - two objects can connect to each other.

## Calculated Functions

Sometimes you might only want to run a function when the model changes, and then store its value. You can do this in Sailor.

	sailor.model("user", {
		somethingIntensive: sailor.calculate(function() {
			// Do something intensive
		})
	});
	user.somethingIntensive; // the result

You can return a promise from this function for asynchronous calculations.

## Model Class Definitions

In addition to being able to define model definitions, you can also define a set of properties to be applied to the model object.

	sailor.model("user", {
		// model definitions...
	}, {
		getRank: function(rank) {
			return this.search({rank: rank});
		}
	});
	var admins = sailor.users.getRank("admin"); // [...items]