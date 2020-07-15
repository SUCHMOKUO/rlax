# Rlax

[![Build Status](https://travis-ci.org/SUCHMOKUO/rlax.svg?branch=master)](https://travis-ci.org/SUCHMOKUO/rlax)
[![Coverage Status](https://coveralls.io/repos/github/SUCHMOKUO/rlax/badge.svg?branch=master)](https://coveralls.io/github/SUCHMOKUO/rlax?branch=master)
[![](https://img.shields.io/npm/v/rlax.svg)](https://www.npmjs.com/package/rlax)
![](https://img.shields.io/badge/dependencies-none-brightgreen.svg)
![](https://img.shields.io/npm/dt/rlax.svg)
![](https://img.shields.io/npm/l/rlax.svg)

Rlax is a super easy state with persistence for react.

## Why this library?

- Redux is too **complex** for a small project.
- Use react's _context api_ to make a global state is easy, however, it will **cause redundant rerender** in every component that use this context, even nothing changed.

## Why you might want this:

- It's tiny: **~200 loc**.
- It has **minimal and intuitive api**.
- You just want a global state manager with persistence **out of box**.
- **TypeScript** support.

## Why you might not want this:

- Currently only working with React 16.8.0 and above (Rlax is using React Hooks).
- The features of Rlax is not as rich as Redux's.

## Installation

```
npm install rlax --save
```

## How to use?

Initialize store In the entry file of your project.

```js
import { initStore } from "rlax";

rlax.initStore({
  // initialize your data here.
  data: {
    key1: value1,
    key2: value2,
    key3: value3,
    ...
  },

  // persistence setting.
  // you can use this to tell Rlax to automatically persist
  // your data into localStorage or sessionStorage before the reload of your page,
  // or just no persistence.
  persist: "session", // you can use "none", "local" and "session" here.
});
```

Use the data you want in your component.

```js
import { useStore } from "rlax";

function MyComponent() {
  // give a key name to the function,
  // it will return the value you want.
  const value1 = useStore("key1");

  // use your value.
  ...
}
```

Or just get the data if it's outside the component.

```js
import { getStore } from "rlax";

const value1 = getStore("key1");

if (typeof value1 !== undefined) {
  // use your value.
}
...

```

Set data when you want to change it.

```js
import { setStore } from "rlax";

// any where you want in you project.

const newValue1 = getYourNewValueSomehow();
setStore("key1", newValue1);

// or using a setter callback function to get previous value.
setStore("key1", (prev) => {
  const newValue = doSomethingWithPreviousValue(prev);
  // remember to return new value.
  return newValue;
});

// after setting new value,
// all the component that use this value will rerender automatically,
// and your view will get update.
```

If you want to clear all the things in the store, just call:

```js
import { clear } from "rlax";

// this will delete the the imformation Rlax set
// in the web storage of your browser (if persist is set),
// and all the data in memory.
clear();
```
