declare module MultiPass {
    module Adapters {
        class GoogleAnalytics implements IAdapter {
            private storage;
            private queue;
            constructor();
            /**
             * Called when the Experiment is initialized, used to keep track of the amount of people who are in a certain variant
             *
             * @param experimentName
             * @param variant
             */
            start(experimentName: string, variant: string): void;
            /**
             * This is usually called by a goal when it's completed, but you can also manually call it to complete any goals
             *
             * @param experimentName
             * @param variant
             * @param goal
             */
            complete(experimentName: string, variant: string, goal: string): void;
            /**
             * Removes an uuid from the tracking queue, done when an event is send
             *
             * @param uuid
             */
            private removeUuid(uuid);
            /**
             * Flushes the tracking queue
             *
             * @returns {string[]}
             */
            private flushQueue();
            /**
             * Add an event to the tracking queue
             *
             * @param category
             * @param action
             * @param label
             */
            private track(category, action, label);
        }
    }
}
declare module MultiPass {
    module Adapters {
        interface IAdapter {
            start(experimentName: string, variant: string): void;
            complete(experimentName: string, variant: string, goal: string): void;
        }
    }
}
declare module MultiPass {
    interface IVariant {
        activate: (experiment: Experiment) => void;
    }
    interface IExperimentConfig {
        name: string;
        variants: {
            [name: string]: IVariant;
        };
        sample?: number;
    }
    class Experiment {
        name: string;
        variants: {
            [name: string]: IVariant;
        };
        sample: number;
        private storage;
        private tracker;
        constructor(config: IExperimentConfig);
        /**
         * This creates a new goal for the current experiment
         *
         * @param name
         * @returns {MultiPass.Goal}
         */
        addGoal(name: string): Goal;
        /**
         * Used to complete a goal
         *
         * @param name
         * @param unqiue
         */
        completeGoal(name: string, unqiue?: boolean): void;
        /**
         * This picks one of the variants available and sets up the experiment
         *
         * @returns {string}
         */
        private applyVariant();
        /**
         * This picks one of the variants
         *
         * @returns {string}
         */
        private chooseVariant();
        /**
         * Check if the person is within the sampple size
         *
         * @returns {boolean}
         */
        private inSample();
        /**
         * Parses the string behind the hash in a url, used to force any variants
         *
         * @returns {boolean}
         */
        private parseHash();
    }
}
declare module MultiPass {
    class Goal {
        name: string;
        experiment: Experiment;
        unique: boolean;
        constructor(experiment: Experiment, name: string, unique?: boolean);
        /**
         * Should be called when a goal is completed
         */
        complete(): void;
    }
}
declare module MultiPass {
    class Utils {
        /**
         * Create a uuid v4
         *
         * @returns {string}
         */
        static generateUuid(): string;
    }
}
