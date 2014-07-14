<a name="why"></a>
## What?
By default, `draggable` components will cause a `drop` event on all `droppable`s that it overlaps when the drag operation ends (i.e. you release your mouse).
There's *no built-in way* of ensuring **only one `droppable` has its `drop` event fired**. This plugin adds a new `exlusive` config option to allow this.

<a name="why"></a>
## Why?
We needed a way of ensuring **exclusivity** of our draggables i.e. *only one drop event per drag operation please!* And since this isn't a native feature,
we figured out a way and made this `ui.draggable.exclusive` plugin!

<a name="demo"></a>
## Demo
<iframe width="100%" height="375" src="http://jsfiddle.net/craga89/68bUg/embedded/result" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

<a name="how"></a>
## How?
Simply include the `jquery-ui.draggable.exclusive.js` plugin *straight after the `jquery-ui.js` file*, and add an `exclusive: true` config option to your draggables. Bosh!

```html
<html>
<head>
	<title>My awesome exclusive draggables</title>
</head>
<body>
<div class="draggable"></div>

<script src="/path/to/jquery-1.10.2.js"></script>
<script src="/path/to/jquery-ui-1.11.0.js"></script>
<script src="/path/to/jquery-ui.draggable.exclusive.js"></script>
<script>
$('.draggable').draggable({
	exclusive: true // Make it exclusive!
});
</script>
</body>
</html>
```

<a name="who"></a>
## Who?
[I implemented it](http://github.com/Craga89), and my friend and colleague [Steve Henderson](https://twitter.com/EasyInbox) came up with the concept behind it. 
Big props to him, it's an awesome algorithm (I hope you'll agree...)!

<a name="options"></a>
## Options

### exclusive `[default: false]`
Turns the exclusivity of this particular `draggable` instance on. **Required for the other options to take effect**.

### moveThreshold `[default: 5px]`
Number of pixels the mouse must move in any axis to cause a recalculation of mouse direction.

### directionRatio `[default: 7]`
Amount of comparable axis movement needed in order to consider the movement of the mouse a majority "n-axis" operation i.e. 
moving the mouse x times more in one axis than in another.

This is used to prevent long tracking movements in one direction changing the value of another, hence preventing momentary retargetting
of the draggable to other droppables

### quadrantArea `[default: 0.6]`
Ratio of the `draggable`s area to use when calculating an inner quadrant area. **Default is `60%` of the `draggable` area.**

### wideRatio `[default: 3.5]`
Ratio of `width / height` that needs to be satisfied for a shape to be considered "wide"

### longRatio `[default: 3.5]`
Ratio of `height / width` that needs to be satisfied for a shape to be considered "long"


<br />
<a name="faq"></a>
## FAQ

### 1. How did you... magic!?
Using dragagble sub-division, mouse direction tracking and point distance calculations... it's cool. 
[Read the blog article](http://blog.craigsworks.com/jquery-ui-draggable-exclusive-draggables) for the deets.

### 2. Isn't this in the `ui.draggable` component already?
No. There is a `greedy` option, but that only effects nested droppables, *not droppables close to one another*.

### 3. What versions of jQuery / jQuery UI is this compatible with?
Requires jQuery `1.6.4+` and jQuery UI `1.9.0+`.

### 4. I'm having problems with long/wide elements?
Play around with the `wideRatio` and `longRatio` options to find what works best for you.

### 5. X isn't working...
Found a bug? OR something isn't working? Report it on the [bug tracker](https://github.com/Craga89/ui.draggable.exclusive/issues)