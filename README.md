Multi-Pass
==========

Multi-Pass is a pure-javascript A/B (multivariate) testing framework for developers.

Key Features:

* Supports multiple variants and goals
* Tracks unique visitors and goal completions
* Ideal for use with page and fragment caching
* Developer-friendly for both usage and contirbution (using npm / browserify)
* less than 5kb when minified and gzipped with no external dependencies
* Force load a variant for testing purposes
* Included TypeScript support
* Ideal for HTML5 games

Getting started
-----------

* Make sure your Google Universal analytics is set up.
* [Download](https://github.com/orange-games/multi-pass/releases/latest) and include `multi-pass.min.js` in the head section of your HTML.
Or
* ```npm install multi-pass```

Now you can create an experiment:

```javascript
var buttonColorExperiment = new MultiPass.Experiment({
  name: 'buttonColor',  // the name of this experiment; required.
  variants: {  // variants for this experiment; required.
    blue: {
      activate: function() {  // activate function to execute if variant is selected
        var btn = document.getElementById('my-btn');
        btn.style.color = 'blue';
      }
    },
    red: {
      activate: function() {
        var btn = document.getElementById('my-btn');
        btn.style.color = 'red';
      }
    }
  },
});
```

After setting up the experiment, you might want to add some goals :)

```javascript
// creating a goal
var buttonClicked = buttonColorExperiment.addGoal('buttonClicked');
var btn = document.getElementById('my-btn');
btn.addEventListener('click', function() {
  // The chosen variant will be tied to the goal automatically
  buttonClicked.complete();
});

// tracking non-unique goals, e.g. page views
var pageView = buttonColorExperiment.addGoal('page view', false);
```
### Analytics
Now you can view your results on your Google Analytics Event Tracking Section. The experiment name will be assigned to `Events`, variation to `actions`, and Visitors or Goals to `label`. e.g.

Usage
-----
### Visitors

Visitors will be tracked once they participate in an experiment (and only once). Once a visitor participates in an
experiment, the same variant will always be shown to them. If visitors are excluded from the sample, they will be
permanently excluded from seeing the experiment. Triggers however will be checked more than once, to allow launching
experiments under specific conditions for the same visitor.

### Goals

Goals are uniquely tracked by default. i.e. if a goal is set to measure how many visitors clicked on a button, multiple
clicks won't generate another goal completion. Only one per visitor. Non-unique goals can be set by passing false as the second parameter to the goal when creating it.

Goals will only be tracked if the experiment was launched and a variant selected before. Tracking goals is therefore
safe and idempotent (unless unique is false).

### Forcing a variant
It’s useful when testing to force yourself into a particular variant. You can specify a variant via URL encoded params in a hash, like so:

http://www.example.com/page.html#button_color=red
This would force button color to be red.

Credits
-------
Multi-Pass was heavily inspired by [AlephBet](https://github.com/Alephbet/alephbet) and
[Cohorts.js](https://github.com/jamesyu/cohorts).

Disclaimer
----------
We at OrangeGames just love playing and creating awesome games. We aren't affiliated with google. We just needed some awesome multivariate tests in our awesome HTML5 games. Feel free to use it for enhancing your own awesome games!

Multi-Pass is distributed under the MIT license. All 3rd party libraries and components are distributed under their
respective license terms.
