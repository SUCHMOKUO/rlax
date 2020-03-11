import React, { useState, useDebugValue, useEffect } from "react";

type Store = {
  value: any;
  renderList: React.Dispatch<React.SetStateAction<number>>[];
};

type Stores = {
  [key: string]: Store;
};

type PersistType = "none" | "local" | "session";

interface InitStoreOption {
  data: {
    [key: string]: any;
  };
  persist: PersistType;
}

interface IPrivateState {
  stores: Stores;
  storage: Storage | null;
  initStoreCalled: boolean;
  storageKey: string;
  [key: string]: any;
}

const privateState: IPrivateState = Object.create(null);

privateState.stores = Object.create(null);
privateState.storage = null;
privateState.initStoreCalled = false;
privateState.storageKey = "react-rlax-store";

export function initStore(opt: InitStoreOption) {
  if (privateState.initStoreCalled) {
    return;
  }
  privateState.initStoreCalled = true;
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
    setStore(key, val);
  }
  persist(opt.persist);
}

export function setStore(key: string, val: any) {
  const store = privateState.stores[key];
  if (!store) {
    privateState.stores[key] = {
      value: val,
      renderList: [],
    };
    return;
  }
  if (store.value === val) {
    return;
  }
  // set new value to store.
  store.value = val;
  // rerender all components that use this store.
  for (const render of store.renderList) {
    render((prev) => prev + 1);
  }
}

export function useStore(key: string) {
  const render = useState(0)[1];
  useDebugValue(`Store of ${String(key)}`);
  const store = privateState.stores[key];
  if (!store) {
    throw new Error(`No store named ${String(key)}!`);
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
      throw new Error(`Unknown persist type: ${type}!`);
  }

  // restore from web storage.
  const storeStr = privateState.storage.getItem(privateState.storageKey);
  if (storeStr) {
    const data = JSON.parse(storeStr);
    for (const [k, v] of Object.entries(data)) {
      privateState.stores[k] = {
        value: v,
        renderList: [],
      };
    }
  }

  // register callback to store everything before reload.
  window.addEventListener("beforeunload", () => {
    const data = Object.create(null);
    for (let k in privateState.stores) {
      data[k] = privateState.stores[k].value;
    }
    privateState.storage?.setItem(
      privateState.storageKey,
      JSON.stringify(data)
    );
  });
}

export function clear() {
  privateState.initStoreCalled = false;
  privateState.stores = Object.create(null);
  privateState.storage?.removeItem(privateState.storageKey);
  privateState.storage = null;
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
    throw new ReferenceError(`No field named ${key}!`);
  }
  privateState[key] = val;
}

export function _debugGetPrivateState(key: string) {
  /* istanbul ignore next */

  if (!(key in privateState)) {
    throw new ReferenceError(`No field named ${key}!`);
  }
  return privateState[key];
}
