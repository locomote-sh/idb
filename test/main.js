
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

describe('read/write', function() {

    before( populateDB );

    it('read', async function() {
        const { read } = await idbConnect( schema, 'fruit');
        const key = fruits[0].name;
        const obj = await read( key );
        assert.equal( obj.name, key );
    });

    it('readAll', async function() {
        const { readAll } = await idbConnect( schema, 'fruit');
        const keys = fruits.map( f => f.name );
        const objects = await readAll( keys );
        assert.equal( objects.length, fruits.length );
    });

    it('indexCount', async function() {
        const { indexCount } = await idbConnect( schema, 'fruit');
        const count = await indexCount('color', 'yellow' );
        assert.equal( count, fruits.filter( f => f.color == 'yellow' ).length );
    });
});

describe('remove', function() {

    before( populateDB );

    it('remove', async function() {
        const { remove, read } = await idbConnect( schema, 'fruit');
        const key = fruits[0].name;
        await remove( key );
        const obj = await read( key );
        assert.equal( obj, null );
    });

});

describe('meta', function() {

    before( populateDB );

    it('keyPath', async function() {
        const { keyPath } = await idbConnect( schema, 'fruit');
        assert.equal( keyPath, 'name');
    });


    it('indexNames', async function() {
        const { indexNames } = await idbConnect( schema, 'fruit');
        assert.equal( indexNames.length, 1 );
        assert.equal( indexNames[0], 'color');
    });

});
