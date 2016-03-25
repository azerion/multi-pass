declare module MultiPass {
    module Adapters {
        interface GoogleAnalyticsProperties {
        }
        class GoogleAnalytics implements IAdapter {
            private storage;
            private queue;
            constructor();
            private removeUuid(uuid);
            private flushQueue();
            private track(category, action, label);
            start(experimentName: string, variant: string): void;
            complete(experimentName: string, variant: string, goal: string): void;
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
        addGoal(name: string): Goal;
        completeGoal(name: string, unqiue?: boolean): void;
        private applyVariant();
        private chooseVariant();
        private inSample();
    }
}
declare module MultiPass {
    class Goal {
        name: string;
        experiment: Experiment;
        unique: boolean;
        constructor(experiment: Experiment, name: string, unique?: boolean);
        complete(): void;
    }
}
declare module MultiPass {
    class Utils {
        static generateUuid(): string;
    }
}
