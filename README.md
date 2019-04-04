# idb
Promise based functional wrapper for IndexedDB.

## Installation

Install using _npm_:

```
npm install "@locomote.sh/idb"
```

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

On the server side, something like <https://github.com/axemclion/IndexedDBShim> can be used to provide the necessary environment.

## Basic usage

You generally start not by opening a database directly but instead by opening a named object store of the database.
You need to provide a schema object, describing the database schema (see next section) and the name of the object store to open.

```js
    const schema = { name: 'fruit-db', stores: {...} };
    const store = 'fruit-objects';

    const objStore = await idbOpenObStore( schema, store );
```

Objects can then be read from the object store using their primary key:

```js
    const appleObj = await idbRead( objStore, 'apple');
```

Multiple objects can be read at once:

```js
    const [
        appleObj,
        pearObj,
        orangeObj
    ] = await idbReadAll( objStore, ['apple','pear','orange']);
```

Objects can be written:

```js
    await idbWrite( objStore, pineappleObj );
```

Or deleted, using their primary key:

```js
    await idbDelete( objStore, 'pear');
```

Cursors can be opened on the primary key instance by providing a filter term:

```js
    const cursor = await idbOpenPK( objStore, 'apple');
```

Or on a named index by providing the index name with a filter term:

```js
    const cursor = await idbOpenIndex( objStore, 'color','yellow');
```

## Schema

The module uses a standard data format to describe a database's schema as a collection of object stores and associated indexes.
The format looks like this:

```json
{
    "name": <String>,
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

* `"name"`: Is a string providing the IndexedDB instance name;
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
    "name": "example",
    "version": 1,
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

`idbOpen( schema )`

Open an IndexedDB instance.
Creates a new DB if no DB with the specified name exists.
Upgrades the existing DB if the schema versions are different.

* `schema`: The database schema.

----

`idbInit( db, schema )`

Initialize an IndexedDB instance.

* `db`: An IndexedDB instance.
* `schema`: A database schema.

----

`idbOpenObjStore( schema, store, mode )`

Open an object store and start a new transaction.

* `schema`: A DB schema.
* `store`: The name of the object store to open.
* `mode`: The transaction mode; defaults to 'readonly'. See <https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction>

----

`idbRead( objStore, key )`

Read an object from an object store.

* `objStore`: The object store to read from.
* `key`: An object primary key.

----

`idbReadAll( objStore, keys )`

Read multiple objects from an object store.

* `objStore`: The object store to read from.
* `keys`: An array of object primary keys.

----

`idbWrite( objStore, object )`

Write an object to an object store.

* `objStore`: The object store to write to.
* `object`: The object to write.

----

`idbDelete( objStore, key )`

Delete an object from an object store.

* `objStore`: The object store to delete from.
* `key`: The primary key of the object to delete.

----

`idbOpenPk( objStore, term )`

Open a cursor on the object store's primary key index.

* `objStore`: The object store to query.
* `term`: A cursor query term; see <https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/openCursor>

----

`idbOpenIndex( objStore, index, term )`

Open a cursor on a named index.

* `objStore`: The object store to query.
* `index`: The name of the index to query.
* `term`: A cursor query term; see <https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/openCursor>

----
`idbIndexCount( objStore, index, term )`

Count the number of items in an index.

* `objStore`: The object store to query.
* `index`: The name of the index to query.
* `term`: A cursor query term; see <https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/openCursor>

