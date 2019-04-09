/* Hacked v2. prototype.
 * Aim is to provide automatic transaction + object store management;
 * code will automatically start a new transactions whenever:
 * - the existing tx is detected to have closed;
 * - the access mode raises from readonly to readwrite;
 */

const idb = require('../idb');
const assert = require('assert');
const initGlobal = require('indexeddbshim');

// A global environment for the IndexedDB shim.
const global = {};
global.window = global;

// Initialize the global env by adding indexedDB and IDBKeyPath refs.
initGlobal( global, { checkOrigin: false, memoryDatabase: ':memory:' });

const {
    idbOpen,
    idbOpenObjStore,
    idbRead,
    idbReadAll,
    idbWrite,
    idbDelete,
    idbOpenPK,
    idbOpenIndex,
    idbIndexCount
} = idb( global );

/**
 * Start a new transaction. Main purpose of this function is to
 * attach event handlers for tracking the tx status.
 */
function starttx( db, store ) {
    console.log('Starting tx');
    const tx = db.transaction( store, 'readwrite');
    tx.__active = true;
    tx.oncomplete = () => tx.__active = false;
    tx.onerror = () => tx.__active = false;
    // Test if the tx is usable with the specified access mode.
    tx._usable = function( required ) {
        const { __active, mode } = this;
        if( !__active ) {
            // Transaction is inactive.
            return false;
        }
        if( mode == required ) {
            // Active transaction in required mode.
            return true;
        }
        if( mode == 'readwrite' && required == 'readonly' ) {
            // Active transaction in compatible mode.
            return true;
        }
        // Active transaction in incompatible mode.
        return false;
    }
    return tx;
}

/**
 * Ensure a connection to a named object store within an
 * active transaction in a compatible access mode.
 */
function ensureos( db, store, mode, os ) {
    if( os ) {
        const { transaction: tx } = os;
        if( tx._usable( mode ) ) {
            console.log('  reusing os');
            return os;
        }
        else console.log('  inactive tx');
    }
    // Unable to use any existing tx, start a new one...
    const tx = starttx( db, store );
    return tx.objectStore( store );
}

/**
 * Connect to a named object store of a database.
 * - The database name etc. is described using the schema;
 * - The function returns methods that can be used to read
 *   and write to the named object store;
 * - All transaction management is done automatically and
 *   transparently.
 */
async function connect( schema, store ) {

    const db = await idbOpen( schema );

    let os;

    function read( key ) {
        os = ensureos( db, store, 'readonly', os );
        return idbRead( os, key );
    }

    function write( value ) {
        os = ensureos( db, store, 'readwrite', os );
        return idbWrite( os, value );
    }

    return { read, write }
}

const schema = {
    name: 'test',
    version: 1,
    stores: {
        'fruits': {
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
    { name: 'apple',     color: 'green' },
    { name: 'banana',    color: 'yellow' },
    { name: 'grape',     color: 'purple' },
    { name: 'pineapple', color: 'yellow' },
    { name: 'orange',    color: 'orange' }
];

async function test() {

    const { read, write } = await connect( schema, 'fruits');

    for( let fruit of fruits ) {
        await write( fruit );
    }

    let [ apple, orange ] = await Promise.all([
        read('apple'),
        read('orange')
    ]);

    console.log(apple);
    console.log(orange);

    await write({ name: 'pear', color: 'green'});

    console.log( await read('pear') );
}

test().then( () => console.log('done') ).catch( e => console.log( e ) );
