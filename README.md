# idb
Promise based functional wrapper for IndexedDB.

## Setup

The API is designed to be used either server-side or from within a browser,
and needs to be instantiated with a global object providing `indexedDB` and `IDBKeyRange` properties.
The `window` object can be used for this within the browser:

```js
    import idb from '@locomote.sh/idb';

    const {
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
    } = idb( window );
```

Alternatively, the `global` object within a service worker context can be used.

On the server side, something such as <https://github.com/axemclion/IndexedDBShim> can be used to provide the necessary environment.

## Basic usage

You normally start by opening an object store, providing both a DB instance name and an object store name.
Note that an object describing the DB schema is also needed (see next section):

```js
    const name = 'fruit-db';
    const schema = { ... };
    const store = 'fruit-objects';

    const objStore = await idbOpenObStore( name, schema, store );
```

Objects can then be read from the object store using their primary key:

```js
    const appleObj = await idbRead('apple', objStore );
```

Multiple objects can be read at once:

```js
    const [
        appleObj,
        pearObj,
        orangeObj
    ] = await idbReadAll(['apple','pear','orange'], objStore );
```

Objects can be written:

```js
    await idbWrite( pineappleObj, objStore );
```

Or deleted, using their primary key:

```js
    await idbDelete('pear', objStore );
```

Cursors can be opened on the primary key instance by providing a filter term:

```js
    const cursor = await idbOpenPK('apple', objStore );
```

Or on a named index by providing the index name with a filter term:

```js
    const cursor = await idbOpenIndex('color','yellow', objStore );
```

## Schema

The module uses a standard data format to describe a database's schema as a collection of object stores and associated indexes.
The format looks like this:

```json
{
    "version": <Number>,
    "stores": {
        <object-store-name>: {
            "options": { },
            "indexes": {
                <index-name>: {
                    "keyPath": <String>,
                    "options": { }
                }
            }
        }
    }
}
```

Where:

* `"version"`: Is a number describing the schema version;
* `"stores"`: Is an object containing one or more object store definitions;
* `<object-store-name>`: Is a valid object store name, mapped to that store's definition;
* `"options"`: Is an object providing valid object store creation options;
  see optional parameters described at <https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/createObjectStore>;
* `"indexes"`: Is an object providing object store index definitions;
* `<index-name>`: Is a valid object store index name;
* `"keyPath"`: Is the key path the index should use;
* `"options"`: Are additional index options; see _objectParameters_ at <https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/createIndex>;

A valid schema document looks like this:

```json
{
    "stores": {
        "files": {
            "options": {
                "keyPath": "path"
            },
            "indexes": {
                "category": {
                    "keyPath": "category",
                    "options": { "unique": false }
                },
                "status": {
                    "keyPath": "status",
                    "options": { "unique": false }
                },
                "page.collection": {
                    "keyPath": "page.collection",
                    "options": { "unique": false }
                },
                "commit": {
                    "keyPath": "commit",
                    "options": { "unique": false }
                }
            }
        }
    }
}
```

## API

Note that all functions return promises.

`idbOpen( name, schema )`

Open an IndexedDB instance.
Creates a new DB if no DB with the specified name exists.
Upgrades the existing DB if the schema versions are different.

* `name`: The name of the database to open.
* `schema`: The database's schema.

----

`idbInit( db, schema )`

Initialize an IndexedDB instance.

* `db`: An IndexedDB instance.
* `schema`: A database schema.

----

`idbOpenObjStore( name, schema, store, mode )`

Open an object store and start a new transaction.

* `name`: A DB name.
* `schema`: A DB schema.
* `store`: The name of the object store to open.
* `mode`: The transaction mode; defaults to 'readonly'. See <https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction>

----

`idbRead( key, objStore )`

Read an object from an object store.

* `key`: An object primary key.
* `objStore`: The object store to read from.

----

`idbReadAll( keys, objStore )`

Read multiple objects from an object store.

* `keys`: An array of object primary keys.
* `objStore`: The object store to read from.

----

`idbWrite( object, objStore )`

Write an object to an object store.

* `object`: The object to write.
* `objStore`: The object store to write to.

----

`idbDelete( key, objStore )`

Delete an object from an object store.

* `key`: The primary key of the object to delete.
* `objStore`: The object store to delete from.

----

`idbOpenPk( term, objStore )`

Open a cursor on the object store's primary key index.

* `term`: A cursor query term; see <https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/openCursor>
* `objStore`: The object store to query.

----

`idbOpenIndex( index, term, objStore )`

Open a cursor on a named index.

* `index`: The name of the index to query.
* `term`: A cursor query term; see <https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/openCursor>
* `objStore`: The object store to query.

----
`idbIndexCount( index, term, objStore )`

Count the number of items in an index.

* `index`: The name of the index to query.
* `term`: A cursor query term; see <https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/openCursor>
* `objStore`: The object store to query.

