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
function initIDB( global ) {

    const { indexedDB, IDBKeyRange } = global;

    /**
     * Open an IndexedDB connection.
     * @param schema    The database schema.
     */
    function idbOpen( schema ) {
        const { name, version = 1 } = schema;
        if( !name ) {
            throw new Error('idbOpen: "name" property not specified on schema');
        }
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
     * Convert an idb request object to a promise.
     */
    function reqAsPromise( request ) {
        return new Promise( ( resolve, reject ) => {
            request.onsuccess = () => resolve( request.result );
            request.onerror   = () => reject( request.error );
        });
    }

    /**
     * Connect to a named object store of a database instance.
     * @param schema    The database schema.
     * @param store     The name of the object store being connected to.
     */
    async function idbConnect( schema, store ) {

        // The database connection.
        const db = await idbOpen( schema );

        // The currently active object store transaction.
        let _objStore;

        // Start a new transaction and open the object store.
        function _openObjStore( mode ) {
            const tx = db.transaction( store, mode );
            // Flag indicating whether the transaction is active.
            tx.__active = true;
            // Event handlers to mark the transaction is inactive.
            tx.complete = tx.onerror = () => tx.__active = false;
            // Attach method for testing the transaction's usability.
            tx.__usable = function( required ) {
                const { __active, mode } = this;
                // The transaction is usable if:
                // - it is still active (i.e. not complete or in error);
                // - its mode matches the required mode
                // - or its mode is readwrite (implying the required mode 
                //   is readonly).
                return __active && (mode == required || mode == 'readwrite');
            }
            // Open the object store within the new transaction.
            return tx.objectStore( store );
        }

        // Return an active transaction opened on the object store.
        function _tx( mode = 'readonly' ) {
            if( _objStore && _objStore.transaction.__usable( mode ) ) {
                return _objStore;
            }
            _objStore = _openObjStore( mode );
            return _objStore;
        }

        /**
         * Read an object from an object store.
         * @param key   An object primary key.
         */
        function read( key ) {
            const objStore = _tx();
            return reqAsPromise( objStore.get( key ) );
        }

        /**
         * Read a list of objects from an object store.
         * @param keys  A list of object primary keys.
         */
        function readAll( keys ) {
            return Promise.all( keys.map( key => {
                return read( key );
            }));
        }

        /**
         * Write an object to an object store.
         * @param object    The object to write.
         */
        function write( object ) {
            const objStore = _tx('readwrite');
            return reqAsPromise( objStore.put( object ) );
        }

        /**
         * Delete an object from an object store.
         * @param key   An object primary key.
         */
        function remove( key ) {
            const objStore = _tx('readwrite');
            return reqAsPromise( objStore.delete( key ) );
        }

        /**
         * Open a cursor on an object store's primary key index.
         * @param term  An index filter term.
         */
        function openPK( objStore, term ) {
            const objStore = _tx();
            return objStore.openCursor( term );
        }

        /**
         * Open a cursor on an object store index.
         * @param index The name of the index to open.
         * @param term  An index filter term.
         */
        function openIndex( index, term ) {
            const objStore = _tx();
            return objStore.index( index ).openCursor( term );
        }

        /**
         * Count the number of items in an index.
         * @param index The name of the index to open.
         * @param term  An index filter term.
         */
        async function indexCount( index, term ) {
            const objStore = _tx();
            return reqAsPromise( objStore.index( index ).count( term ) );
        }

        // Return the API.
        return {
            read,
            readAll,
            write,
            remove,
            openPK,
            openIndex,
            indexCount
        };

    }

    return {
        indexedDB,
        IDBKeyRange,
        idbConnect
    };
        
}

if( typeof module === 'object' ) {
    module.exports = initIDB;
}

