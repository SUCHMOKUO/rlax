import React, { useState, useDebugValue, useEffect } from "react";

type StoreValue =
  | number
  | string
  | boolean
  | null
  | { [key: string]: StoreValue }
  | StoreValue[];

type Store = {
  value: StoreValue;
  renderList: React.Dispatch<React.SetStateAction<number>>[];
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
privateState.initialized = false;
privateState.storageKey = "react-rlax-store";

export function initStore(opt: InitStoreOption) {
  if (privateState.initialized) {
    return;
  }
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
    privateState.stores[key] = {
      value: val,
      renderList: [],
    };
  }
  persist(opt.persist);
  privateState.initialized = true;
}

export function setStore(
  key: string,
  setter: (prev: StoreValue) => StoreValue
): void;
export function setStore(key: string, val: StoreValue): void;
export function setStore(key: string, val: any): void {
  const store = privateState.stores[key];
  if (!store) {
    throw new Error(`No store named '${key}'!`);
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
  for (const render of store.renderList) {
    render(add);
  }
}

function add(x: number) {
  return x + 1;
}

export function useStore(key: string) {
  const render = useState(0)[1];
  useDebugValue(`Store of '${key}'`);
  const store = privateState.stores[key];
  if (!store) {
    throw new Error(`No store named '${key}'!`);
  }
  const renderList = store.renderList;
  if (!renderList.includes(render)) {
    renderList.push(render);
  }
  useEffect(
    () => () => {
      const index = renderList.indexOf(render);
      if (index >= 0) {
        renderList.splice(index, 1);
      }
    },
    [render, renderList]
  );
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
        renderList: [],
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
  privateState.storage?.setItem(privateState.storageKey, JSON.stringify(data));
}

export function clear() {
  privateState.initialized = false;
  privateState.stores = Object.create(null);
  privateState.storage?.removeItem(privateState.storageKey);
  privateState.storage = null;
  window.removeEventListener("beforeunload", persistToStorage);
}

export default {
  initStore,
  setStore,
  useStore,
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
