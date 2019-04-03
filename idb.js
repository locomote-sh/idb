/* 
   Copyright 2019 Locomote Ltd.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/* Functions for working with IndexedDB databases. */

/**
 * Initialize the IndexedDB API.
 * @param global    A global object with { indexedDB, IDBKeyRange } properties.
 * @return Returns a set of functions for interacting with an IndexedDB instance.
 */
function init( global ) {

    const { indexedDB, IDBKeyRange } = global;

    /**
     * Open an IndexedDB connection.
     * @param schema    The database schema.
     */
    function idbOpen( schema ) {
        const { name, version } = schema;
        return new Promise( ( resolve, reject ) => {
            const request = indexedDB.open( name, version );
            request.onsuccess = ( e ) => {
                resolve( request.result );
            };
            request.onerror = ( e ) => {
                reject( request.error );
            };
            request.onupgradeneeded = ( e ) => {
                idbInit( e.target.result, schema );
            };
        });
    }

    /**
     * Initialize an IndexedDB instance.
     * @param db        The DB connection.
     * @param schema    The DB schema.
     */
    function idbInit( db, schema ) {
        const { stores } = schema;
        for( const name in stores ) {
            const { options, indexes } = stores[name];
            const objStore = db.createObjectStore( name, options );
            for( const index in indexes ) {
                const { keyPath, options } = indexes[index];
                objStore.createIndex( index, keyPath, options );
            }
        }
    }

    /**
     * Open a transaction on an object store.
     * @param schema    The database schema.
     * @param store     The object store name.
     * @param mode      The transaction mode; defaults to 'readonly'.
     */
    async function idbOpenObjStore( schema, store, mode = 'readonly' ) {
        const db = await idbOpen( schema );
        return db.transaction( store, mode ).objectStore( store );
    }

    /**
     * Convert an idb request object to a promise.
     */
    function reqAsPromise( request ) {
        return new Promise( ( resolve, reject ) => {
            request.onsuccess = () => resolve( request.result );
            request.onerror   = () => reject( request.error );
        });
    }

    /**
     * Read an object from an object store.
     * @param key       An object primary key.
     * @param objStore  An open object store transaction.
     */
    function idbRead( key, objStore ) {
        return reqAsPromise( objStore.get( key ) );
    }

    /**
     * Read a list of objects from an object store.
     * @param keys      A list of object primary keys.
     * @param objStore  An open object store transaction.
     */
    function idbReadAll( keys, objStore ) {
        return Promise.all( keys.map( key => {
            return idbRead( key, objStore );
        }));
    }

    /**
     * Write an object to an object store.
     * @param object    The object to write.
     * @param objStore  An open object store transaction.
     */
    function idbWrite( object, objStore ) {
        return reqAsPromise( objStore.put( object ) );
    }

    /**
     * Delete an object from an object store.
     * @param key       An object primary key.
     * @param objStore  An open object store transaction.
     */
    function idbDelete( key, objStore ) {
        return reqAsPromise( objStore.delete( key ) );
    }

    /**
     * Open a cursor on an object store's primary key index.
     * @param term      An index filter term.
     * @param objStore  An open object store transaction.
     */
    function idbOpenPK( term, objStore ) {
        return objStore.openCursor( term );
    }

    /**
     * Open a cursor on an object store index.
     * @param index     The name of the index to open.
     * @param term      An index filter term.
     * @param objStore  An open object store transaction.
     */
    function idbOpenIndex( index, term, objStore ) {
        return objStore.index( index ).openCursor( term );
    }

    /**
     * Count the number of items in an index.
     * @param index     The name of the index to open.
     * @param term      An index filter term.
     * @param objStore  An open object store transaction.
     */
    async function idbIndexCount( index, term, objStore ) {
        return reqAsPromise( objStore.index( index ).count( term ) );
    }

    return {
        indexedDB,
        IDBKeyRange,
        idbOpen,
        idbOpenObjStore,
        idbRead,
        idbReadAll,
        idbWrite,
        idbDelete,
        idbOpenPK,
        idbOpenIndex,
        idbIndexCount
    };
        
}

module.exports = init;
