/**
 * Class that allows any module to have the persistent state
 * that will be saved after page-reload.
 *
 * Usage examples:
 * - by Gallery to save viewed image index and allow to continue swiping from that
 * - by Adviser to remember which advices was already read by user
 *
 * @example
 * class Gallery extends PersistentStateObject {
 *      constructor(){
 *          super({
 *              storageKey: 'gallery',
 *              initialState: {
 *                  currentPhoto: 0
 *              }
 *          })
 *
 *          console.log('state', this.state);
 *          console.log('photo', this.state.currentPhoto);
 *
 *          this.mutateState('currentPhoto', '++');
 *      }
 * }
 *
 */
Air.defineClass(
    'class.PersistentStateObject',
    `lib.storage`,
    function(storage) {

        'use strict';

        class PSO {
            /**
             * @param {string} storageKey - Key in the local storage that contains object's state
             * @param {*} initialState - initial (default) state structure
             */
            constructor({storageKey, initialState}){
                if (!storageKey){
                    throw new Error('Can not create a Persistent State Object: option storageKey is required')
                }

                this._storageKey = storageKey;
                this._initialState = initialState;
                this.state = null;

                /**
                 * Initialize object's state
                 */
                this.initState()
            }

            /**
             * Initialize Object's state
             */
            initState(){
                let saved = storage.get(this._storageKey, true);

                if (!saved) {
                    this.state = this._initialState;
                } else {
                    this.state = saved;
                }
            }

            /**
             * All state changes should go through this method
             *
             * @param {string} prop - property of the state that should be changed
             * @param {string} action - what to do with this
             * @param {*} [value] - optional value for the action
             */
            mutateState(prop, action, value) {
                console.group('persistent state mutation: ' + prop + ' ' + action);
                console.log('prev state:', Object.assign({}, this.state));

                switch (action) {
                    case '++':
                        this.state[prop]++;
                        break;
                    case '--':
                        this.state[prop]--;
                        break;
                    case 'push':
                        this.state[prop].push(value);
                        break;
                    case 'set':
                        this.state[prop] = value;
                        break;
                }

                storage.set(this._storageKey, this.state, true);

                console.log('new state:', this.state);
                console.groupEnd();
            }
        }

        return PSO;
    }
);