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

let stores: Stores = Object.create(null);
let storage: Storage;
let initStoreCalled = false;

function initStore(opt: InitStoreOption) {
  if (initStoreCalled) {
    return;
  }
  initStoreCalled = true;
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

function setStore(key: string, val: any) {
  const store = stores[key];
  if (!store) {
    stores[key] = {
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

function useStore(key: string) {
  const render = useState(0)[1];
  useDebugValue(`Store of ${String(key)}`);
  const store = stores[key];
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

const storageKey = "react-rlax-store";

function persist(type: PersistType) {
  switch (type) {
    case "none":
      return;

    case "local":
      storage = window.localStorage;
      break;

    case "session":
      storage = window.sessionStorage;
      break;

    default:
      throw new Error(`Unknown persist type: ${type}!`);
  }

  // restore from web storage.
  const storeStr = storage.getItem(storageKey);
  if (storeStr) {
    Object.assign(stores, JSON.parse(storeStr));
  }

  // register callback to store everything before reload.
  window.addEventListener("beforeunload", () => {
    storage.setItem(storageKey, JSON.stringify(stores, jsonReplacer));
  });
}

function jsonReplacer(name: string, val: any) {
  if (name === "renderList") {
    return [];
  }
  return val;
}

function clear() {
  initStoreCalled = false;
  stores = Object.create(null);
  if (storage) {
    storage.removeItem(storageKey);
  }
}

export default {
  initStore,
  setStore,
  useStore,
  clear,
};
