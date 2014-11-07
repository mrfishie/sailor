Make Github-style anchors with Angular!

# Installation

	bower install angular-anchorjs --save

# Usage

**Use in your HTML:**

	<h1 anchored>A header</h1>

**Use in your CSS:**

	a.anchor-link {
		opacity:0;
	}
	*:hover > a.anchor-link, .anchor-link:focus {
		opacity:1;
	}
	.icon-link:before {
		content: "§";
	}
	.icon-link {
		font-size:90%;
		padding-left:6px;
	}

# Credits

Based on (and includes some source code from) [AngularJS](https://github.com/bryanbraun/anchorjs/)

# License

Licensed with the [MIT License](http://opensource.org/licenses/MIT).