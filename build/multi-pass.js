/*!
 * multi-pass - version 0.1.2 
 * A simple javascript multivariate testing framework for use with Google Analytics
 *
 * OrangeGames
 * Build at 08-04-2016
 * Released under MIT License 
 */

var MultiPass;
(function (MultiPass) {
    var Adapters;
    (function (Adapters) {
        var GoogleAnalytics = (function () {
            function GoogleAnalytics() {
                this.storage = Quartz.Storage.getInstance();
                this.queue = [];
                if (typeof ga !== 'function') {
                    console.warn('ga not defined. Please make sure your Universal analytics is set up correctly');
                }
                var queueData = this.storage.get('queue');
                if (null === queueData) {
                    return;
                }
                try {
                    this.queue = JSON.parse(queueData);
                }
                catch (e) {
                    console.warn('Unable to parse queue data, initialising with empty queue');
                }
            }
            /**
             * Called when the Experiment is initialized, used to keep track of the amount of people who are in a certain variant
             *
             * @param experimentName
             * @param variant
             */
            GoogleAnalytics.prototype.start = function (experimentName, variant) {
                return this.track('Experiment: ' + experimentName, 'Variant: ' + variant, 'Visitors');
            };
            /**
             * This is usually called by a goal when it's completed, but you can also manually call it to complete any goals
             *
             * @param experimentName
             * @param variant
             * @param goal
             */
            GoogleAnalytics.prototype.complete = function (experimentName, variant, goal) {
                return this.track('Experiment: ' + experimentName, 'Variant: ' + variant, 'Goal: ' + goal);
            };
            /**
             * Removes an uuid from the tracking queue, done when an event is send
             *
             * @param uuid
             */
            GoogleAnalytics.prototype.removeUuid = function (uuid) {
                for (var i = this.queue.length - 1; i >= 0; i--) {
                    if (this.queue[i].hasOwnProperty('uuid') && this.queue[i].uuid === uuid) {
                        this.queue.splice(i);
                    }
                }
                this.storage.set('queue', JSON.stringify(this.queue));
            };
            /**
             * Flushes the tracking queue
             *
             * @returns {string[]}
             */
            GoogleAnalytics.prototype.flushQueue = function () {
                var _this = this;
                var results = [];
                for (var i = 0, len = this.queue.length; i < len; i++) {
                    var item = this.queue[i];
                    results.push(ga('send', 'event', item.category, item.action, item.label, {
                        'hitCallback': function () {
                            _this.removeUuid(item.uuid);
                        },
                        'nonInteraction': 1
                    }));
                }
                return results;
            };
            /**
             * Add an event to the tracking queue
             *
             * @param category
             * @param action
             * @param label
             */
            GoogleAnalytics.prototype.track = function (category, action, label) {
                this.queue.push({
                    uuid: MultiPass.Utils.generateUuid(),
                    category: category,
                    action: action,
                    label: label
                });
                this.storage.set('queue', JSON.stringify(this.queue));
                this.flushQueue();
            };
            return GoogleAnalytics;
        })();
        Adapters.GoogleAnalytics = GoogleAnalytics;
    })(Adapters = MultiPass.Adapters || (MultiPass.Adapters = {}));
})(MultiPass || (MultiPass = {}));
var MultiPass;
(function (MultiPass) {
    var GoogleAnalytics = MultiPass.Adapters.GoogleAnalytics;
    Quartz.Storage.getInstance().setNamespace('multi-pass');
    var Experiment = (function () {
        function Experiment(config) {
            this.name = null;
            this.variants = {};
            this.sample = 1.0;
            this.storage = Quartz.Storage.getInstance();
            this.tracker = new GoogleAnalytics();
            this.name = config.name;
            this.variants = config.variants;
            if (!this.parseHash()) {
                this.applyVariant();
            }
        }
        /**
         * This creates a new goal for the current experiment
         *
         * @param name
         * @returns {MultiPass.Goal}
         */
        Experiment.prototype.addGoal = function (name) {
            return new MultiPass.Goal(this, name);
        };
        /**
         * Used to complete a goal
         *
         * @param name
         * @param unqiue
         */
        Experiment.prototype.completeGoal = function (name, unqiue) {
            if (unqiue === void 0) { unqiue = true; }
            if (unqiue && this.storage.get(this.name + ':' + name)) {
                return;
            }
            var variant = this.storage.get(this.name + ':variant');
            if (!variant) {
                return;
            }
            if (unqiue) {
                this.storage.set(this.name + ':' + name, true);
            }
            return this.tracker.complete(this.name, variant, name);
        };
        /**
         * This picks one of the variants available and sets up the experiment
         *
         * @returns {string}
         */
        Experiment.prototype.applyVariant = function () {
            var variantName = this.storage.get(this.name + ':variant');
            if (!this.inSample()) {
                return;
            }
            if (variantName === null) {
                variantName = this.chooseVariant();
                this.tracker.start(this.name, variantName);
            }
            var variant = this.variants[variantName];
            if (variant !== null) {
                variant.activate(this);
            }
            this.storage.set(this.name + ':variant', variantName);
            return variantName;
        };
        /**
         * This picks one of the variants
         *
         * @returns {string}
         */
        Experiment.prototype.chooseVariant = function () {
            var variants = Object.keys(this.variants);
            var part = 1.0 / variants.length;
            var pickedPart = Math.floor(Math.random() / part);
            return variants[pickedPart];
        };
        /**
         * Check if the person is within the sampple size
         *
         * @returns {boolean}
         */
        Experiment.prototype.inSample = function () {
            var isIn = this.storage.get(this.name + ':isIn');
            if (null !== isIn) {
                return isIn === 'true';
            }
            var isInreal = Math.random() <= this.sample;
            this.storage.set(this.name + ':isIn', isInreal);
            return isInreal;
        };
        /**
         * Parses the string behind the hash in a url, used to force any variants
         *
         * @returns {boolean}
         */
        Experiment.prototype.parseHash = function () {
            var hash = window.location.hash;
            if (hash.indexOf('#') === 0) {
                hash = hash.slice(1, hash.length);
            }
            var pairs = hash.split('&');
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                var testName = pair[0];
                var variantName = pair[1];
                if (this.name === testName) {
                    if (Object.keys(this.variants).indexOf(variantName) !== -1) {
                        var variant = this.variants[variantName];
                        variant.activate(this);
                        this.storage.set(this.name + ':variant', variantName);
                        return true;
                    }
                }
            }
            return false;
        };
        return Experiment;
    })();
    MultiPass.Experiment = Experiment;
})(MultiPass || (MultiPass = {}));
var MultiPass;
(function (MultiPass) {
    var Goal = (function () {
        function Goal(experiment, name, unique) {
            if (unique === void 0) { unique = true; }
            this.unique = true;
            this.experiment = experiment;
            this.name = name;
            this.unique = unique;
        }
        /**
         * Should be called when a goal is completed
         */
        Goal.prototype.complete = function () {
            this.experiment.completeGoal(this.name, this.unique);
        };
        return Goal;
    })();
    MultiPass.Goal = Goal;
})(MultiPass || (MultiPass = {}));
var MultiPass;
(function (MultiPass) {
    var Utils = (function () {
        function Utils() {
        }
        /**
         * Create a uuid v4
         *
         * @returns {string}
         */
        Utils.generateUuid = function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = (c === 'x') ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        return Utils;
    })();
    MultiPass.Utils = Utils;
})(MultiPass || (MultiPass = {}));
//# sourceMappingURL=multi-pass.js.map