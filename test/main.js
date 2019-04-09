
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
    const objStore = await idbOpenObjStore( schema, 'fruit', 'readwrite');
    await Promise.all( fruits.map( fruit => {
        return idbWrite( objStore, fruit );
    }));
}

describe('read/write', function() {

    before( populateDB );

    it('idbRead', async function() {
        const objStore = await idbOpenObjStore( schema, 'fruit');
        const key = fruits[0].name;
        const obj = await idbRead( objStore, key );
        assert.equal( obj.name, key );
    });

    it('idbReadAll', async function() {
        const objStore = await idbOpenObjStore( schema, 'fruit');
        const keys = fruits.map( f => f.name );
        const objects = await idbReadAll( objStore, keys );
        assert.equal( objects.length, fruits.length );
    });

    it('idbIndexCount', async function() {
        const objStore = await idbOpenObjStore( schema, 'fruit');
        const count = await idbIndexCount( objStore, 'color', 'yellow' );
        assert.equal( count, fruits.filter( f => f.color == 'yellow' ).length );
    });
});

describe('delete', function() {

    before( populateDB );

    it('idbDelete', async function() {
        let objStore = await idbOpenObjStore( schema, 'fruit', 'readwrite');
        const key = fruits[0].name;
        await idbDelete( objStore, key );
        objStore = await idbOpenObjStore( schema, 'fruit');
        const obj = await idbRead( objStore, key );
        assert.equal( obj, null );
    });

});
