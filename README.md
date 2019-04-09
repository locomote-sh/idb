# idb
Promise based functional wrapper for IndexedDB.

Similar to, but different from <https://github.com/jakearchibald/idb>

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
        idbConnect
    } = idb( window );
```

Alternatively, the `global` object within a service worker context can be used.

On the server side, something like <https://github.com/axemclion/IndexedDBShim> can be used to provide the necessary environment.

## Motivation

This library has two primary motivations:

1. To provide a functional, promise-based wrapper around _IndexedDB_'s rather idiosyncratic [IDBRequest](https://developer.mozilla.org/en-US/docs/Web/API/IDBRequest)  based API;
2. To provide automatic transaction management across asychronous code boundaries.

Both aspects greatly improve IndexedDB's ease of use, particularly automatic transaction management which is designed to completely avoid `TransactionInactiveError: Failed to execute 'get' on 'IDBObjectStore': The transaction is inactive or finished` errors, caused by the transaction being automatically closed when it is used across asynchronous code boundaries and all its pending operations are completed.

## Basic usage

The library's API first has to be initialized on a global object providing the IndexedDB API (see _Setup_ above).
Once the API is initialized, you can then use its `idbConnect(...)` function to open a connection to a named object store of a particular database instance.
The connection is composed of a number of functions for reading and writing to and from the object store (see the _Connection API_ documentation below).

```js
    const { idbConnect } = idb( window );
    const {
        read,
        write,
        remove,
        openPK,
        openIndex,
        indexCount
    } = await idbConnect( schema, 'fruits' );
```

When connecting, you need to provide a schema object describing the database schema (see _Schema_ below).
The schema includes the name of the required database, and the `idbConnect` function will connect to the database with that name if any exists,
otherwise it will create a new database and populate it with the object stores and indexes described in the schema.
(Note also that `idbConnect` is an asynchronous function, so you must either use the `await` keyword or chain a promise continuation using `.then` after the function call).

Once the connection is open, objects can be written directly to the object store:

```js
    await write({ name: 'apple', color: 'green' });
```

They can be read from the object store using their primary key:

```js
    const orange = await read('orange');
```

And they can be deleted using the `remove()` function:

```js
    await remove( orange );
```

There are also functions for reading multiple objects at once and for opening cursors on object store indexes.

A connection's functions can be used across asynchronous code boundaries without any problems with transactions;
behind the scenes, the connection will attempt to reuse any open object store transaction, but detects when a transaction has completed (which happens automatically when it has no pending operations) and will automatically open a new transaction as and when it's needed:

```js
    const pear = await read('pear');
    const grape = await read('grape');
    pear.color = 'yellow';
    grape.color = 'purple';
    await write( grape );
    await write( pear );
```

### Multiple connections

If you need to open connections to multiple object stores then you will probably want to keep the functions attached to their connection object:

```js
    const fruitCx = await idbConnect( schema, 'fruits');
    const foodCx  = await idbConnect( schema, 'foods');
    const pear = await fruitCx.read('pear');
    await foodCx.write( pear );
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

`idbOpen( schema )`

(Asynchronous). Open an IndexedDB instance.
Creates a new database if no database with the specified name exists.
Upgrades the existing database if the schema versions are different.

* `schema`: The database schema.

----

`idbInit( db, schema )`

(Asynchronous). Initialize an IndexedDB instance.

* `db`: An IndexedDB instance.
* `schema`: A database schema.

----

`idbConnect( schema, store )`

(Asynchronous). Open a connection to a named object store using the provided database schema.

* `schema`: A DB schema.
* `store`: The name of the object store to open.

Returns the functions described below in the _Connection API_ section.

----

## Connection API

`read( key )`

(Asynchronous). Read an object from an object store.

* `key`: An object primary key.

----

`readAll( keys )`

(Asynchronous). Read multiple objects from an object store.

* `keys`: An array of object primary keys.

----

`write( object )`

(Asynchronous). Write an object to an object store.

* `object`: The object to write.

----

`remove( key )`

(Asynchronous). Remove (delete) an object from an object store.

* `key`: The primary key of the object to delete.

----

`openPK( term )`

Open a cursor on the object store's primary key index.

* `term`: A cursor query term; see <https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/openCursor>

----

`openIndex( index, term )`

Open a cursor on a named index.

* `index`: The name of the index to query.
* `term`: A cursor query term; see <https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/openCursor>

----

`indexCount( index, term )`

(Asynchronous). Count the number of items in an index.

* `index`: The name of the index to query.
* `term`: A cursor query term; see <https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/openCursor>


