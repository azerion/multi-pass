module MultiPass {
    export class Goal {
        public name: string;

        public experiment: Experiment;

        public unique: boolean = true;

        constructor(experiment: Experiment, name: string, unique: boolean = true) {
            this.experiment = experiment;
            this.name = name;
            this.unique = unique;
        }
        
        public complete(): void {
            this.experiment.completeGoal(this.name, this.unique);
        }
    }
}