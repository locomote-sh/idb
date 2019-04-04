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

// Example code. Pass an instance of the idb api.
async function example( idb ) {

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
    } = idb;

    // The db schema.
    const schema = {
        name:   'example',                  // The db name.
        version: 1,                         // The db schema version.
        stores: {                           // Object stores.
            fruit: {                        // Object store named 'fruit'.
                options: {                  // Object store inititialization options.
                    keyPath: 'name'         // The primary key path.
                },
                indexes: {                  // Other object indexes.
                    color: {                // An index named 'color'.
                        options: {          // Index options.
                            unique: false   // Index is non-unique.
                        }
                    }
                }
            }
        }
    }

    // Open the object store and start a transaction.
    let objStore = await idbOpenObjStore( schema, 'fruit', 'readwrite' );

    // Write some objects. Note that these need to happen within the same
    // process tick, in order to keep the transaction open.
    await Promise.all([
        idbWrite( objStore, { name: 'apple', color: 'green' }),
        idbWrite( objStore, { name: 'banana', color: 'yellow' }),
        idbWrite( objStore, { name: 'pineapple', color: 'yellow' })
    ]);

    // The object store transation has closed at this point, because we are
    // in a new process tick (i.e. after the preceeding 'await'). Start a 
    // new transaction and read a value.
    objStore = await idbOpenObjStore( schema, 'fruit' );
    let apple = await idbRead( objStore, 'apple');

    // We can read multiple values in a single call.
    objStore = await idbOpenObjStore( schema, 'fruit' );
    let [
        banana,
        pineapple
    ] = await idbReadAll( objStore, ['banana','pineapple']);

    // We can count the number of items on an index for a given value.
    objStore = await idbOpenObjStore( schema, 'fruit' );
    let yellowCount = await idbIndexCount( objStore, 'color','yellow');

    // We can delete items from the object store.
    objStore = await idbOpenObjStore( schema, 'fruit' );
    await idbDelete( objStore, 'apple');
}
