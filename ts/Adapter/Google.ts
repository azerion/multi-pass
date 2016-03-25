module MultiPass {
    export module Adapters {
        interface GoogleAnalyticsEvent {
            uuid: string;
            category: string;
            action: string;
            label: string;
        }

        export interface GoogleAnalyticsProperties {

        }

        export class GoogleAnalytics implements IAdapter {
            private storage: Quartz.Storage = Quartz.Storage.getInstance();

            private queue: GoogleAnalyticsEvent[] = [];

            constructor() {
                // if (typeof ga !== 'function') {
                //     console.warn('ga not defined. Please make sure your Universal analytics is set up correctly');
                // }

                let queueData: string = this.storage.get('queue');

                if (null === queueData) {
                    return;
                }

                try {
                    this.queue = JSON.parse(queueData);
                } catch (e) {
                    console.warn('Unable to parse queue data, initialising with empty queue');
                }
            }

            private removeUuid(uuid: string) {
                for (let i = this.queue.length - 1; i >= 0; i--) {
                    if (this.queue[i].hasOwnProperty('uuid') && this.queue[i].uuid === uuid) {
                        this.queue.splice(i);
                    }
                }

                return this.storage.set('queue', JSON.stringify(this.queue));
            }

            private flushQueue(): string[] {
                var results: string[] = [];
                for (let i: number = 0, len: number = this.queue.length; i < len; i++) {
                    var item: GoogleAnalyticsEvent  = this.queue[i];
                    results.push(ga('send', 'event', item.category, item.action, item.label, {
                        'hitCallback': (): void => {
                            this.removeUuid(item.uuid);
                        },
                        'nonInteraction': 1
                    }));
                }

                return results;
            }

            private track(category: string, action: string, label: string): void {
                this.queue.push({
                    uuid: Utils.generateUuid(),
                    category: category,
                    action: action,
                    label: label
                });
                this.storage.set('queue', JSON.stringify(this.queue));
                this.flushQueue();
            }
            
            public start(experimentName: string, variant: string): void {
                return this.track('Experiment: ' + experimentName, variant, 'Visitors');
            }
            
            public complete(experimentName: string, variant: string, goal: string): void {
                return this.track(experimentName, variant, goal);
            }
        }
    }
}
