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
        }
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
                this.applyVariant()
            }
        }
        
        public addGoal(name: string): Goal {
            return new Goal(this, name);
        }

        public completeGoal(name: string, unqiue: boolean = true): void {
            if (unqiue && this.storage.get(this.name + ":" + name)) {
                return;
            }

            let variant: string = this.storage.get(this.name + ":variant")
            if (!variant) {
                return;
            }

            if (unqiue) {
                this.storage.set(this.name + ":" + name, true);
            }

            return this.tracker.complete(this.name, variant, name);
        }
        
        private applyVariant(): string {
            let variantName: string = this.storage.get(this.name + ":variant");
            if (!this.inSample()) {
                return;
            }
            
            if (variantName === null) {
                variantName = this.chooseVariant();
                this.tracker.start(this.name, variantName);
            }

            let varient: IVariant;
            if ((varient = this.variants[variantName]) != null) {
                varient.activate(this);
            }

            this.storage.set(this.name + ":variant", variantName);

            return variantName;
        }

        private chooseVariant(): string {
            let variants: string [] = Object.keys(this.variants);

            let part: number = 1.0 / variants.length;
            let pickedPart: number = Math.floor(Math.random() / part);

            let variant: string = variants[pickedPart];

            return variant;
        }

        private inSample(): boolean {
            let isIn: string = this.storage.get(this.name +  ':isIn');
            if (null !== isIn) {
                return isIn === 'true';
            }

            let isInreal = Math.random() <= this.sample;
            this.storage.set(this.name + ':isIn', isInreal);
            return isInreal;
        }

        private parseHash(): boolean {
            var hash = window.location.hash;
            if(hash.indexOf('#') === 0) hash = hash.slice(1,hash.length);

            var pairs = hash.split('&');
            for(var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                var testName = pair[0];
                var variantName = pair[1];

                if(this.name === testName) {
                    console.log(Object.keys(this.variants));
                    if (Object.keys(this.variants).indexOf(variantName) !== -1) {
                        let variant: IVariant = this.variants[variantName];
                        variant.activate(this);

                        this.storage.set(this.name + ":variant", variantName);

                        return true;
                    }
                }
            }

            return false;
        }
    }
}