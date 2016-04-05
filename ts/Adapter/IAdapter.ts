module MultiPass {
    export module Adapters {
        export interface IAdapter {
            start(experimentName: string, variant: string): void;
            complete(experimentName: string, variant: string, goal: string): void;
        }
    }
}
