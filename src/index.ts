import React, { useState, useDebugValue, useEffect } from "react";

type StoreValue = any;
// | number
// | string
// | boolean
// | null
// | { [key: string]: StoreValue }
// | StoreValue[];

type RenderFunc = React.Dispatch<React.SetStateAction<number>>;

type Store = {
  value: StoreValue;
  renderSet: Set<RenderFunc>;
};

type Stores = {
  [key: string]: Store;
};

type PersistType = "none" | "local" | "session";

interface InitStoreOption {
  data: {
    [key: string]: StoreValue;
  };
  persist: PersistType;
}

interface IPrivateState {
  stores: Stores;
  storage: Storage | null;
  initialized: boolean;
  storageKey: string;
  [key: string]: any;
}

const privateState: IPrivateState = Object.create(null);

privateState.stores = Object.create(null);
privateState.storage = null;
privateState.storageKey = "react-rlax-store";

function createNewStore(key: string, val?: StoreValue) {
  const store: Store = {
    value: val,
    renderSet: new Set(),
  };
  privateState.stores[key] = store;
  return store;
}

export function initStore(opt: InitStoreOption) {
  if (!opt) {
    throw new Error("You need to pass an option object to initStore!");
  }
  if (!(opt instanceof Object)) {
    throw new Error("You need to pass an option as object!");
  }
  if (!opt.data) {
    throw new Error("You need to set initial data in initStore option!");
  }
  if (!(opt.data instanceof Object)) {
    throw new Error("Initial data should be an object!");
  }
  for (const [key, val] of Object.entries(opt.data)) {
    if (val === undefined) {
      throw new TypeError(`The value setting to '${key}' is undefined!`);
    }
    createNewStore(key, val);
  }
  persist(opt.persist);
}

export function setStore(
  key: string,
  setter: (prev: StoreValue) => StoreValue
): void;
export function setStore(key: string, val: StoreValue): void;
export function setStore(key: string, val: any): void {
  let store = privateState.stores[key];
  if (!store) {
    store = createNewStore(key);
  }
  const oldVal = store.value;
  const newVal = typeof val === "function" ? val(oldVal) : val;
  if (newVal === undefined) {
    throw new TypeError(`The value setting to '${key}' is undefined!`);
  }
  if (Object.is(oldVal, newVal)) {
    return;
  }
  // set new value to store.
  store.value = newVal;
  // rerender all components that use this store.
  store.renderSet.forEach(callRender);
}

function callRender(r: RenderFunc) {
  r((x) => x + 1);
}

export function useStore(key: string) {
  const render = useState(0)[1];
  useDebugValue(`Store of '${key}'`);
  let store = privateState.stores[key];
  if (!store) {
    store = createNewStore(key);
  }
  const renderSet = store.renderSet;
  renderSet.add(render);
  useEffect(
    () => () => {
      renderSet.delete(render);
    },
    [render, renderSet]
  );
  return store.value;
}

export function getStore(key: string) {
  const store = privateState.stores[key];
  if (!store) {
    return undefined;
  }
  return store.value;
}

function persist(type: PersistType) {
  switch (type) {
    case "none":
      return;

    case "local":
      privateState.storage = window.localStorage;
      break;

    case "session":
      privateState.storage = window.sessionStorage;
      break;

    default:
      throw new Error(`Unknown persist type: '${type}'!`);
  }

  // restore from web storage.
  const storeStr = privateState.storage.getItem(privateState.storageKey);
  if (storeStr) {
    const data = JSON.parse(storeStr);
    for (const [k, v] of Object.entries(data)) {
      privateState.stores[k] = {
        value: v as StoreValue,
        renderSet: new Set(),
      };
    }
  }

  // register callback to store everything before reload.
  window.addEventListener("beforeunload", persistToStorage);
}

function persistToStorage() {
  const data = Object.create(null);
  for (let k in privateState.stores) {
    data[k] = privateState.stores[k].value;
  }
  /* istanbul ignore next */
  privateState.storage?.setItem(privateState.storageKey, JSON.stringify(data));
}

export function clear() {
  privateState.stores = Object.create(null);
  privateState.storage?.removeItem(privateState.storageKey);
}

export default {
  initStore,
  setStore,
  useStore,
  getStore,
  clear,
};

export function _debugSetPrivateState(key: string, val: any) {
  /* istanbul ignore next */
  if (!(key in privateState)) {
    throw new ReferenceError(`No field named '${key}'!`);
  }
  privateState[key] = val;
}

export function _debugGetPrivateState(key: string) {
  /* istanbul ignore next */
  if (!(key in privateState)) {
    throw new ReferenceError(`No field named '${key}'!`);
  }
  return privateState[key];
}
