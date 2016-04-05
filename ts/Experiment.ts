module MultiPass {
    import IAdapter = MultiPass.Adapters.IAdapter;
    import GoogleAnalytics = MultiPass.Adapters.GoogleAnalytics;
    Quartz.Storage.getInstance().setNamespace('multi-pass');

    export interface IVariant {
        activate: (experiment: Experiment) => void;
    }

    export interface IExperimentConfig {
        name: string;
        variants: {
            [name: string]: IVariant;
        };
        sample?: number;
    }

    export class Experiment {
        public name: string = null;

        public variants: {
            [name: string]: IVariant;
        } = {};

        public sample: number = 1.0;

        private storage: Quartz.Storage = Quartz.Storage.getInstance();

        private tracker: IAdapter = new GoogleAnalytics();

        constructor(config: IExperimentConfig) {
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
        public addGoal(name: string): Goal {
            return new Goal(this, name);
        }

        /**
         * Used to complete a goal
         *
         * @param name
         * @param unqiue
         */
        public completeGoal(name: string, unqiue: boolean = true): void {
            if (unqiue && this.storage.get(this.name + ':' + name)) {
                return;
            }

            let variant: string = this.storage.get(this.name + ':variant');
            if (!variant) {
                return;
            }

            if (unqiue) {
                this.storage.set(this.name + ':' + name, true);
            }

            return this.tracker.complete(this.name, variant, name);
        }

        /**
         * This picks one of the variants available and sets up the experiment
         *
         * @returns {string}
         */
        private applyVariant(): string {
            let variantName: string = this.storage.get(this.name + ':variant');
            if (!this.inSample()) {
                return;
            }

            if (variantName === null) {
                variantName = this.chooseVariant();
                this.tracker.start(this.name, variantName);
            }

            let variant: IVariant = this.variants[variantName];
            if (variant !== null) {
                variant.activate(this);
            }

            this.storage.set(this.name + ':variant', variantName);

            return variantName;
        }

        /**
         * This picks one of the variants
         *
         * @returns {string}
         */
        private chooseVariant(): string {
            let variants: string [] = Object.keys(this.variants);

            let part: number = 1.0 / variants.length;
            let pickedPart: number = Math.floor(Math.random() / part);

            return variants[pickedPart];
        }

        /**
         * Check if the person is within the sampple size
         *
         * @returns {boolean}
         */
        private inSample(): boolean {
            let isIn: string = this.storage.get(this.name + ':isIn');
            if (null !== isIn) {
                return isIn === 'true';
            }

            let isInreal: boolean = Math.random() <= this.sample;
            this.storage.set(this.name + ':isIn', isInreal);
            return isInreal;
        }

        /**
         * Parses the string behind the hash in a url, used to force any variants
         *
         * @returns {boolean}
         */
        private parseHash(): boolean {
            let hash: string = window.location.hash;
            if (hash.indexOf('#') === 0) {
                hash = hash.slice(1, hash.length);
            }

            let pairs: string[] = hash.split('&');
            for (let i: number = 0; i < pairs.length; i++) {
                let pair: string[] = pairs[i].split('=');
                let testName: string = pair[0];
                let variantName: string = pair[1];

                if (this.name === testName) {
                    if (Object.keys(this.variants).indexOf(variantName) !== -1) {
                        let variant: IVariant = this.variants[variantName];
                        variant.activate(this);

                        this.storage.set(this.name + ':variant', variantName);

                        return true;
                    }
                }
            }

            return false;
        }
    }
}
