module MultiPass {
    export module Adapters {
        interface IGoogleAnalyticsEvent {
            uuid: string;
            category: string;
            action: string;
            label: string;
        }

        export class GoogleAnalytics implements IAdapter {
            private storage: Quartz.Storage = Quartz.Storage.getInstance();

            private queue: IGoogleAnalyticsEvent[] = [];

            constructor() {
                if (typeof ga !== 'function') {
                    console.warn('ga not defined. Please make sure your Universal analytics is set up correctly');
                }

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

            /**
             * Called when the Experiment is initialized, used to keep track of the amount of people who are in a certain variant
             *
             * @param experimentName
             * @param variant
             */
            public start(experimentName: string, variant: string): void {
                return this.track('Experiment: ' + experimentName, 'Variant: ' + variant, 'Visitors');
            }

            /**
             * This is usually called by a goal when it's completed, but you can also manually call it to complete any goals
             *
             * @param experimentName
             * @param variant
             * @param goal
             */
            public complete(experimentName: string, variant: string, goal: string): void {
                return this.track('Experiment: ' + experimentName, 'Variant: ' + variant, 'Goal: ' + goal);
            }

            /**
             * Removes an uuid from the tracking queue, done when an event is send
             *
             * @param uuid
             */
            private removeUuid(uuid: string): void {
                for (let i: number = this.queue.length - 1; i >= 0; i--) {
                    if (this.queue[i].hasOwnProperty('uuid') && this.queue[i].uuid === uuid) {
                        this.queue.splice(i);
                    }
                }

                this.storage.set('queue', JSON.stringify(this.queue));
            }

            /**
             * Flushes the tracking queue
             *
             * @returns {string[]}
             */
            private flushQueue(): string[] {
                let results: string[] = [];
                for (let i: number = 0, len: number = this.queue.length; i < len; i++) {
                    var item: IGoogleAnalyticsEvent = this.queue[i];
                    results.push(ga('send', 'event', item.category, item.action, item.label, {
                        'hitCallback': (): void => {
                            this.removeUuid(item.uuid);
                        },
                        'nonInteraction': 1
                    }));
                }

                return results;
            }

            /**
             * Add an event to the tracking queue
             *
             * @param category
             * @param action
             * @param label
             */
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
        }
    }
}
