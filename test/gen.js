
const idb = require('../idb');
const assert = require('assert');
const initGlobal = require('indexeddbshim');

// A global environment for the IndexedDB shim.
const global = {};
global.window = global;

// Initialize the global env by adding indexedDB and IDBKeyPath refs.
initGlobal( global, { checkOrigin: false, memoryDatabase: ':memory:' });

const {
    idbConnect
} = idb( global );

const schema = {
    name: 'test',
    version: 1,
    stores: {
        'fruit': {
            options: { keyPath: 'name' },
            indexes: {
                color: {
                    keyPath: 'color',
                    options: { unique: false }
                }
            }
        }
    }
}

const fruits = [
    { name: 'apple', color: 'green' },
    { name: 'banana', color: 'yellow' },
    { name: 'grape', color: 'purple' },
    { name: 'pineapple', color: 'yellow' },
    { name: 'orange', color: 'orange' }
];

async function populateDB() {
    const { write } = await idbConnect( schema, 'fruit');
    await Promise.all( fruits.map( fruit => {
        return write( fruit );
    }));
}

describe('generator', function() {

    before( populateDB );

    it('next', async function() {

        const { openPK, read } = await idbConnect( schema, 'fruit');

        async function makePK() {

            return new Promise( ( resolve, reject ) => {

                const request = openPK();

                const results = [];
let first = true;
                request.onsuccess = () => {
                    let cursor = request.result;
                    if( cursor ) {
                        results.push( cursor.primaryKey );
                        cursor.continue();
                    }
                    //else {
                    if( first ) { first = false;
                        resolve( function* genPK() {
                            while( results.length ) {
console.log('results.length=',results.length);
                                yield results.shift();
                                /*
                                const key = results.shift();
                                return read( key );
                                */
                            }
                        });
                    }
                }

                request.onerror = reject;

            });
        }

        const pk = await makePK();
        for( const x of pk() ) {
            console.log( x );
        }

        /*
        let i = 0;
        let pkIterable = await iteratePK();
        for ( const x of pkIterable ) {
            console.log('>', x );
            //assert.equal( x.value, fruits[i++].name );
        }
        */
    });

});
