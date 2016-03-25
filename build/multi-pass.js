/*!
 * multi-pass - version 0.0.1 
 * A simple javascript multivariate testing framework for use with Google Analytics
 *
 * OrangeGames
 * Build at 25-03-2016
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
                if ('' === queueData) {
                    return;
                }
                try {
                    this.queue = JSON.parse(queueData);
                }
                catch (e) {
                    console.warn('Unable to parse queue data, initialising with empty queue');
                }
            }
            GoogleAnalytics.prototype.removeUuid = function (uuid) {
                for (var i = this.queue.length; i >= 0; i--) {
                    if (this.queue[i].hasOwnProperty('uuid') && this.queue[i].uuid === uuid) {
                        this.queue.splice(i);
                    }
                }
                return this.storage.set('queue', JSON.stringify(this.queue));
            };
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
            GoogleAnalytics.prototype.start = function (experimentName, variant) {
                return this.track('Experiment: ' + experimentName, variant, 'Visitors');
            };
            GoogleAnalytics.prototype.complete = function (experimentName, variant, goal) {
                return this.track(experimentName, variant, goal);
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
            this.applyVariant();
        }
        Experiment.prototype.addGoal = function (name) {
            return new MultiPass.Goal(this, name);
        };
        Experiment.prototype.completeGoal = function (name, unqiue) {
            if (unqiue === void 0) { unqiue = true; }
            if (unqiue && this.storage.get(this.name + ":" + name)) {
                return;
            }
            var variant = this.storage.get(this.name + ":variant");
            if (!variant) {
                return;
            }
            if (unqiue) {
                this.storage.set(this.name + ":" + name, true);
            }
            return this.tracker.complete(this.name, variant, name);
        };
        Experiment.prototype.applyVariant = function () {
            var variantName = this.storage.get(this.name + ":variant");
            if (!this.inSample()) {
                return;
            }
            if (variantName === '') {
                variantName = this.chooseVariant();
                this.tracker.start(this.name, variantName);
            }
            var varient;
            if ((varient = this.variants[variantName]) != null) {
                varient.activate(this);
            }
            this.storage.set(this.name + ":variant", variantName);
            return variantName;
        };
        Experiment.prototype.chooseVariant = function () {
            var variants = Object.keys(this.variants);
            var part = 1.0 / variants.length;
            var pickedPart = Math.floor(Math.random() / part);
            var variant = variants[pickedPart];
            return variant;
        };
        Experiment.prototype.inSample = function () {
            var isIn = 'true' === this.storage.get(this.name + ':isIn');
            if (isIn) {
                return isIn;
            }
            isIn = Math.random() <= this.sample;
            this.storage.set(this.name + ':isIn', isIn);
            return isIn;
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
        Utils.generateUuid = function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = (c == 'x') ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        return Utils;
    })();
    MultiPass.Utils = Utils;
})(MultiPass || (MultiPass = {}));
//# sourceMappingURL=multi-pass.js.map