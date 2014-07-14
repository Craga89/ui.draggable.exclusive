(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery", "jqueryui"], factory);
    } else {
        factory(root.$, root.$.ui);
    }
}
(this, function ($) {
	/**
	UI.Droppable class extensions

	@class droppable
	@namespace jQuery.ui
	@extends jQuery.ui.droppable`
	**/
	$.widget('ui.droppable', $.ui.droppable, {
		/**
		Adds itself to the current draggable's queue if it has exclusivity enabled.

		@method _over
		@param event {Object} Event object that triggered the handler
		@param ui {Object} UI Object containg details about the interaction
		**/
		_over: function(event, ui) {
			var result = this._super.apply(this, arguments),
				current = $.ui.ddmanager.current;

			// If the droppable is exclusive...
			if(current.options.exclusive) {
				// Keep track of the hovered, active droppables via jQuery array
				current.hovering = current.hovering.add(this.element);

				// Remove the added hover class, as this is taken care of in the
				// draggable exclusivity logic
				this.element.removeClass(this.options.hoverClass);
			}

			// super()
			return result;
		},

		/**
		If the current draggable is `exclusive`, it ensures the actual `drop` event is only fired if 
		this `droppable` is the current `draggable`'s calculated target.

		@method _drop
		@param event {Object} Event object that triggered the handler
		@param ui {Object} UI Object containg details about the interaction
		**/
		_drop: function(event, ui) {
			var current = $.ui.ddmanager.current;

			// If the droppable is exclusive...
			if(current.options.exclusive) {
				// Remove hover class
				this.toggleHover(false);

				// Ensure we only call the actual `drop` callback for the target matched by the 
				// exclusivity logic, stored in `draggable.target`.
				if(current.target !== this.element[0]) { return; }
			}

			// super()
			return this._super.apply(this, arguments);
		},

		/**
		Removes itself from the current draggable's queue if it has exclusivity enabled.

		@method _out
		@param event {Object} Event object that triggered the handler
		@param ui {Object} UI Object containg details about the interaction
		**/
		_out: function(event, ui) {
			var current = $.ui.ddmanager.current;

			// If the droppable is exclusive, remove this from the tracked droppables
			if(current.options.exclusive) {
				current.hovering = current.hovering.not(this.element);
			}

			// super()
			return this._super.apply(this, arguments);
		},

		toggleHover: function(state) {
			this.element.toggleClass(this.options.hoverClass, !!state);
		}
	});


	/**
	UI.Draggable class extensions

	@class draggable
	@namespace jQuery.ui
	@extends jQuery.ui.draggable
	**/
	$.widget('ui.draggable', $.ui.draggable, {

		options: $.extend($.ui.droppable.prototype.options, {
			/**
			Number of pixels the mouse must move in order for the overall directionality of the
			cursor to be re-calculated.

			@property options.moveThreshold
			@type Number
			@default 5
			**/
			moveThreshold: 5,

			/**
			Amount of comparable axis movement needed in order to consider the movement of the mouse
			a majority "n-axis" operation i.e. moving the mouse x times more in one axis than in another

			@property options.directionRatio
			@type Number
			@default 7
			**/
			directionRatio: 7,

			/**
			Ratio of width -> height that needs to be satisfied for a shape to be considered "wide"

			@property options.wideRatio
			@type Number
			@default 3.5
			**/
			wideRatio: 3.5, 

			/**
			Ratio of height -> width that needs to be satisfied for a shape to be considered "long"

			@property options.longRatio
			@type Number
			@default 3.5
			**/
			longRatio: 3.5,

			/**
			Ratio of the draggable's area to use when calculating inner quadrant area

			@property options.quadrantArea
			@type Number
			@default 0.6
			**/
			quadrantArea: 0.6
		}),
		
		/**
		Creation method. Sets up additional exlusivity tracking properties if enabled.

		@protected
		@method _create
		**/
		_create: function() {
			// super()
			var result = this._super.apply(this, arguments);

			// If exclusive mode is enabled, set up additional properties
			if(this.options.exclusive) {
				this._setOption('exclusive', true);
			}

			return result;
		},

		/**
		Tracks when the `exclusive` property changes, adding additional tracking properties
		when enabled, and removing them when disabled

		@private
		@method _setOption
		@param key {String} Property name being set
		@param value {Mixed} Property value being set
		**/
		_setOption: function(key, value) {
			switch(key) {
				case 'exclusive':
					if(value) {
						// Add tracking properties
						this.hovering = $();
						this._lastX = 0;
						this._lastY = 0;
						this.direction = [];
					}

					// Null out extra properties if it was turned off
					else { 
						this.hovering = this.target = this._lastX = 
							this._lastY = this.direction = null;
					}
				break;
			}

			return this._super.apply(this, arguments);
		},

		/**
		Triggered on each mouse move when dragging operation is in progress. Calls methods
		that calculate mouse directionality and distances between droppables.

		@private
		@method _mouseMove
		**/
		_mouseMove: function() {
			var result = this._super.apply(this, arguments);

			// If exclusive mode is enabled...
			if(this.options.exclusive) {
				this._calculateDirection.apply(this, arguments);
				this._calculateDistances.apply(this, arguments);
			}

			return result;
		},

		/**
		Triggered when the drag operation ends. Removes all tracked droppables and resets the
		target droppable property.

		@private
		@method _mouseUp
		**/
		_mouseUp: function() {
			var result = this._super.apply(this, arguments);

			// If exclusive mode is enabled...
			if(this.options.exclusive) {
				this.hovering = $();
				this.target = null;
			}

			return result;
		},

		/**
		Calculates the movement direction based on the passed mouse `event` object. 
		Throttled to run once every 50ms at most.

		@private
		@method _calculateDirection
		@param event {Object} Event object passed from `mousemove` event handler
		**/
		_calculateDirection: throttle(function(event) {
			!this.helper && console.log(this);

			var x = event.pageX, 
				y = event.pageY, 
				dir = this.direction,
				lastX = this._lastX,
				lastY = this._lastY,
				helper = this.helper,
				moveThreshold = this.options.moveThreshold,
				dirRatio = this.options.directionRatio,
				diffX, diffY, newDir;

			// Ensure the mouse has moved our threshold movement
			if(Math.abs(x - lastX) <= moveThreshold && Math.abs(y - lastY) <= moveThreshold) { return; }

			// Calculate difference between the points
			diffX = x - lastX; diffY = y - lastY;

			// Figure out the direction
			newDir = [(diffY > 0 ? 's' : 'n'), (diffX > 0 ? 'e' : 'w')];

			// Check to see if we moved primarily in a particular axis direction,
			// and if so, always use the last calculated direction perpendicular to it.
			// For example, if we move primarily to the left with little to no movement
			// up or down, we'll always use the last correctly calculated y-axis direction.
			// This ensures we can easily drag up/down/sideways without constant switching.
			if(Math.abs(diffX) > Math.abs(dirRatio * diffY)) {
				newDir[0] = dir[0];
			}
			else if(Math.abs(diffY) > Math.abs(dirRatio * diffX)) {
				newDir[1] = dir[1];
			}

			// Store last direction / coordinates
			this.direction = newDir; 
			this._lastX = x; 
			this._lastY = y;	
		}, 
		50), // Throttled to run no more than once every 50ms


		/**
		Calculates the distances between all hovered droppables. Throttled to run once every
		100ms at most.

		@private
		@method _calculateDistances
		@param event {Object} Event object passed from `mousemove` event handler
		**/
		_calculateDistances: throttle(function(event) {
			var $hovered = this.hovering, 
				quadrantCenter,
				newTarget;

			// If there's only one droppable being targetted, that's our target!
			if($hovered.length < 2) { newTarget = $hovered[0]; }

			// If there's more than one potential droppable
			else {
				// Calculate new hitpoint
				quadrantCenter = this._calculateQuadrantCenter();

				// For every active droppable, find the minimum distance between it and the calculated
				// quandrant center, taking the minimum distance as the droppable that should be active
				newTarget = findMin($hovered, function(elem) {
					var center = this._calculateDroppableCenter($(elem), event);

					return Math.sqrt(
						Math.pow(quadrantCenter[0] - center[0], 2) + 
						Math.pow(quadrantCenter[1] - center[1], 2)
					);
				}, this);
			}

			// If the target hasn't changed, do nothing.
			if(newTarget === this.target) { return; }

			// Toggle the hover state
			$hovered.add(this.target).each(function() {
				$(this).droppable('toggleHover', this === newTarget);
			});

			// Store the target
			this.target = newTarget;
		}, 
		100), // Throttled to run no more than once every 100ms

		/**
		Calculates the center point of a given droppable

		@private
		@method _calculateDroppableCenter
		@param $droppable {jQuery} jQuery-wrapped DOM element to retrieve proportions for
		@param event {Object} Event object from triggered event handler
		@return {Array} Array containg left and top offset in pixels, respectfully.
		**/
		_calculateDroppableCenter: function($droppable, event) {
			var offset = $droppable.offset(),
				proportions = this._getDroppableProportions($droppable),
				wideRatio = this.options.wideRatio,
				longRatio = this.options.longRatio,
				splitArea,
				left, top;

			// Account for wide/long shapes using [wide/long]Ratio to split the shape into multiple
			// discrete centers, and choosing one based on the current mouse offset in the associated axis
			// e.g. for wide shapes, split the shape into x individual centers, and choose the one closest to the mouse along the x-axis
			if((proportions.width / proportions.height) > wideRatio) {
				splitArea = (proportions.width * wideRatio) / proportions.height;
				left = offset.left + (Math.floor((event.pageX - offset.left) / splitArea) * splitArea) + (splitArea / 2);
				top = offset.top + (proportions.height / 2);
			}
			else if((proportions.height / proportions.width) > longRatio) {
				splitArea = (proportions.height * longRatio) / proportions.width;
				top = offset.top + (Math.floor((event.pageY - offset.top) / splitArea) * splitArea) + (splitArea / 2);
				left = offset.left + (proportions.width / 2);
			}

			// Regular shapes just have their regular center calculated
			else {
				left = (offset.left + (proportions.width / 2));
				top = (offset.top + (proportions.height / 2));
			}

			return [ left, top ];
		},

		/**
		Calculates the center point of a quadrant within the draggable, using the current
		mouse direction.

		@private
		@method _calculateQuadrantCenter
		@return {Array} Array containg left and top offset in pixels, respectfully.
		**/
		_calculateQuadrantCenter: function() {
			// Generate hitbox coordinates based on direction
			var offset = this.helper.offset(),
				width = this.helper.width(),
				height = this.helper.height(),
				hitWidth = width * this.options.quadrantArea,
				hitHeight = height * this.options.quadrantArea;

			return [
				offset.left + (hitWidth / 2) + (this.direction[1] === 'e' ? width - hitWidth : 0),
				offset.top + (hitHeight / 2) + (this.direction[0] === 's' ? height - hitHeight : 0)
			]; 
		},

		/**
		Helper method to return a given droppable's proportions via the stored `droppable` API values

		@private
		@method _getDroppableProportions
		@param $droppable {jQuery} jQuery-wrapped DOM element to retrieve proportions for
		@return {Object} Object containing `width` and `height` properties
		**/
		_getDroppableProportions: function($droppable) {
			var data = $droppable.data(),
				api = data['uiDroppable'] || data['ui-droppable'] || [],
				props = api.proportions;

			return $.isFunction(props) ? props() : props;
		}
	});

	// Finds a minimum value within a collection via filter function, returning
	// the collection item that has the min.
	function findMin(collection, filterFunc, context) {
		if(!collection.length) { return; }

		// Type-cast jQuery arrays to an array
		$.isFunction(collection.toArray) && (collection = collection.toArray());

		var result, computed, 
			lastComputed = Infinity, 
			i = collection.length;

		while(i--) {
			computed = filterFunc.call(context || this, collection[i]);
			if(computed < lastComputed) {
				result = collection[i];
				lastComputed = computed;
			}
		}

		return result;
	}

	// Taken from Underscore.js source
	// http://underscorejs.org/docs/underscore.html#section-71
	function throttle(func, wait, options) {
		var context, args, result;
		var timeout = null;
		var previous = 0;
		options || (options = {});
		var later = function() {
			previous = options.leading === false ? 0 : _.now();
			timeout = null;
			result = func.apply(context, args);
			context = args = null;
		};
		return function() {
			var now = _.now();
			if (!previous && options.leading === false) previous = now;
			var remaining = wait - (now - previous);
			context = this;
			args = arguments;
			if (remaining <= 0) {
				clearTimeout(timeout);
				timeout = null;
				previous = now;
				result = func.apply(context, args);
				context = args = null;
			} 
			else if (!timeout && options.trailing !== false) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};
	}
}));