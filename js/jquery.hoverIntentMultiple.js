/**
* hoverIntentMultiple is a rewrite of hoverIntent to allow multiple actions to be bound to the same DOM element.
* 
* hoverIntentMultiple // 2012.10.31
* <https://github.com/jfmatt/hover-intent-multiple>
*
* hoverIntentMultiple is currently available for use in all personal or commercial 
* projects under both MIT and GPL licenses. This means that you can choose 
* the license that best suits your project, and use it accordingly.
*
* Usage is the same as below, with the following changes:
* **Adding an action will NOT remove actions previously registered
* **To remove previously registered actions, set the configuration option clear = true
* **If clearing, other options are optional (i.e. send {clear: true} to wipe out registered actions
*		without adding a new one)
*
* @param  f  onMouseOver function || An object with configuration options
* @param  g  onMouseOut function  || Nothing (use configuration options object)
* @author    James Matthews github.com/jfmatt
*/

/**
* ORIGINAL HOVERINTENT HEADER TEXT:
* hoverIntent is similar to jQuery's built-in "hover" function except that
* instead of firing the onMouseOver event immediately, hoverIntent checks
* to see if the user's mouse has slowed down (beneath the sensitivity
* threshold) before firing the onMouseOver event.
* 
* hoverIntent r6 // 2011.02.26 // jQuery 1.5.1+
* <http://cherne.net/brian/resources/jquery.hoverIntent.html>
* 
* hoverIntent is currently available for use in all personal or commercial 
* projects under both MIT and GPL licenses. This means that you can choose 
* the license that best suits your project, and use it accordingly.
*
* // basic usage (just like .hover) receives onMouseOver and onMouseOut functions
* $("ul li").hoverIntent( showNav , hideNav );
* 
* // advanced usage receives configuration object only
* $("ul li").hoverIntent({
*	sensitivity: 7, // number = sensitivity threshold (must be 1 or higher)
*	interval: 100,   // number = milliseconds of polling interval
*	over: showNav,  // function = onMouseOver callback (required)
*	timeout: 0,   // number = milliseconds delay before onMouseOut function call
*	out: hideNav    // function = onMouseOut callback (required)
* });
* 
* @param  f  onMouseOver function || An object with configuration options
* @param  g  onMouseOut function  || Nothing (use configuration options object)
* @author    Brian Cherne brian(at)cherne(dot)net
*/

(function($) {
	$.fn.hoverIntentMultiple = function(f,g) {
		//explicit each IS necessary to make sure that each element gets its own set of configs saved
		this.each(function() {
			// default configuration options
			var DATANAME = 'hoverIntentMultiple';
			var cfg = {
				sensitivity: 7,
				interval: 100,
				timeout: 0
			};

			var $el = $(this);

			// override configuration options with user supplied object
			cfg = $.extend(cfg, g ? { over: f, out: g } : f );
			var cfgList = $el.data(DATANAME) || [];

			//Remove everything
			if (cfg.hasOwnProperty('clear')) {
				$.each(cfgList, function() {
					this.hoverIntent_t = clearTimeout(this.hoverIntent_t);
				});
				cfgList = []
			}
			//Abort if 'over' not set - allows for clearing without adding new action
			if (!cfg.hasOwnProperty('over')) {
				$el.data(DATANAME, cfgList);
				return $el;
			}
			//Push whether we cleared or not - list will have at least 1 element now
			cfgList.push(cfg);
			//save
			$el.data(DATANAME, cfgList);

			// instantiate variables
			// cX, cY = current X and Y position of mouse, updated by mousemove event
			// pX, pY = previous X and Y position of mouse, set by mouseover and polling interval
			var cX, cY, pX, pY;

			// A private function for getting mouse position
			var track = function(ev) {
				cX = ev.pageX;
				cY = ev.pageY;
			};

			// A private function for comparing current and previous mouse position
			//ev=event, ob=config object, el=dom element
			var compare = function(ev,ob) {
				ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
				// compare mouse positions to see if they've crossed the threshold
				if ( ( Math.abs(pX-cX) + Math.abs(pY-cY) ) < ob.sensitivity ) {
					$el.unbind("mousemove",track);
					// set hoverIntent state to true (so mouseOut can be called)
					ob.hoverIntent_s = 1;
					return ob.over.apply($el,[ev]);
				} else {
					// set previous coordinates for next time
					pX = cX; pY = cY;
					// use self-calling timeout, guarantees intervals are spaced out properly (avoids JavaScript timer bugs)
					ob.hoverIntent_t = setTimeout( function(){compare(ev, ob);} , ob.interval );
				}
			};

			// A private function for delaying the mouseOut function
			var delay = function(ev,ob) {
				ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
				ob.hoverIntent_s = 0;
				return ob.out.apply($el,[ev]);
			};

			// A private function for handling mouse 'hovering'
			var handleHover = function(e) {
				// copy objects to be passed into t (required for event object to be passed in IE)
				var ev = jQuery.extend({},e);

				//Make sure we're working with updated list of callbacks
				var cfgList = $el.data(DATANAME);

				$.each(cfgList, function() {
					// cancel hoverIntent timer if it exists
					var ob = this;
					if (ob.hoverIntent_t) { ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t); }
				});

				// if e.type == "mouseenter"
				if (e.type == "mouseenter") {
					// set "previous" X and Y position based on initial entry point
					pX = ev.pageX; pY = ev.pageY;
					// update "current" X and Y position based on mousemove
					$el.bind("mousemove",track);
					// start polling interval (self-calling timeout) to compare mouse coordinates over time
					$.each(cfgList, function() {
						var ob = this;
						if (ob.hoverIntent_s != 1) { ob.hoverIntent_t = setTimeout( function(){compare(ev,ob);} , ob.interval );}
					});
				// else e.type == "mouseleave"
				} else {
					// unbind expensive mousemove event
					$el.unbind("mousemove",track);
					// if hoverIntent state is true, then call the mouseOut function after the specified delay
					$.each(cfgList, function() {
						var ob = this;
						if (ob.hoverIntent_s == 1) { ob.hoverIntent_t = setTimeout( function(){delay(ev,ob);} , ob.timeout );}
					});
				}
			};

			// bind the function to the two event listeners
			return $el.bind('mouseenter',handleHover).bind('mouseleave',handleHover);
		});
	};
})(jQuery);