import React, { Fragment } from "react";
import { configure, shallow, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import "jest-localstorage-mock";

configure({ adapter: new Adapter() });

let windowEventHandlers = Object.create(null);

window.addEventListener = (event, cb) => {
  const listeners = windowEventHandlers[event];
  if (Array.isArray(listeners)) {
    listeners.push(cb);
  } else {
    windowEventHandlers[event] = [cb];
  }
};

window.removeEventListener = (event, cb) => {
  const listeners = windowEventHandlers[event];
  if (Array.isArray(listeners)) {
    const i = listeners.indexOf(cb);
    if (i >= 0) {
      listeners.splice(i, 1);
    }
  }
};

function clearWindowHandlers() {
  windowEventHandlers = Object.create(null);
}

import rlax, { _debugSetPrivateState, _debugGetPrivateState } from "../dist";

const storageKey = _debugGetPrivateState("storageKey");

describe("invalid option tests", () => {
  afterEach(rlax.clear);

  test("should throw when no option", () => {
    expect(() => {
      rlax.initStore();
    }).toThrowError("You need to pass an option object to initStore!");
  });

  test("should throw when option is not object", () => {
    expect(() => {
      rlax.initStore("config");
    }).toThrowError("You need to pass an option as object!");
  });

  test("should throw when no option.data", () => {
    expect(() => {
      rlax.initStore({
        persist: "none",
      });
    }).toThrowError("You need to set initial data in initStore option!");
  });

  test("should throw when option.data is not object", () => {
    expect(() => {
      rlax.initStore({
        data: "data",
        persist: "none",
      });
    }).toThrowError("Initial data should be an object!");
  });

  test("should throw when invalid persist", () => {
    const invalidType = "123";
    expect(() => {
      rlax.initStore({
        data: {},
        persist: invalidType,
      });
    }).toThrowError(`Unknown persist type: '${invalidType}'!`);
  });
});

describe("initStore tests", () => {
  afterEach(rlax.clear);

  test("should throw when initialize data with undefined", () => {
    expect(() => {
      rlax.initStore({
        data: {
          n: undefined,
        },
        persist: "none",
      });
    }).toThrowError("The value setting to 'n' is undefined!");
  });

  test("should init data", () => {
    rlax.initStore({
      data: {
        n: 0,
      },
      persist: "none",
    });

    expect(_debugGetPrivateState("stores").n.value).toBe(0);
  });

  test("should init once", () => {
    rlax.initStore({
      data: {
        n: 1,
      },
      persist: "none",
    });

    rlax.initStore({
      data: {
        n: 2,
      },
      persist: "none",
    });

    expect(_debugGetPrivateState("stores").n.value).toBe(1);
  });
});

describe("setStore tests", () => {
  beforeEach(() => {
    rlax.initStore({
      data: {
        n: 0,
        m: 1,
      },
      persist: "none",
    });
  });
  afterEach(rlax.clear);

  test("should throw when set undefined", () => {
    expect(() => {
      rlax.setStore("n", undefined);
    }).toThrowError("The value setting to 'n' is undefined!");
  });

  test("should throw when setter returned undefined", () => {
    expect(() => {
      rlax.setStore("n", () => undefined);
    }).toThrowError("The value setting to 'n' is undefined!");
  });

  test("should throw when set new store after init", () => {
    expect(() => {
      rlax.setStore("new store");
    }).toThrowError("No store named 'new store'!");
  });

  test("should set store", () => {
    rlax.setStore("n", 2);
    expect(_debugGetPrivateState("stores").n.value).toBe(2);
  });

  test("should set store using callback", () => {
    rlax.setStore("n", (prev) => prev + 3);
    expect(_debugGetPrivateState("stores").n.value).toBe(3);
  });

  test("should update component that use store", () => {
    const render = jest.fn();
    const n = _debugGetPrivateState("stores").n;
    n.renderList.push(render);
    rlax.setStore("n", 123);
    expect(n.value).toBe(123);
    expect(render).toHaveBeenCalledTimes(1);
  });

  test("should not update component when state not change", () => {
    const render = jest.fn();
    const n = _debugGetPrivateState("stores").n;
    n.renderList.push(render);
    rlax.setStore("n", 0);
    expect(render).not.toHaveBeenCalled();
  });

  test("should only update related component", () => {
    const renderN = jest.fn();
    const n = _debugGetPrivateState("stores").n;
    n.renderList.push(renderN);
    const renderM = jest.fn();
    const m = _debugGetPrivateState("stores").m;
    m.renderList.push(renderM);
    rlax.setStore("n", 123);
    rlax.setStore("n", 231);
    rlax.setStore("n", 41);
    rlax.setStore("m", 41);
    expect(renderN).toHaveBeenCalledTimes(3);
    expect(renderM).toHaveBeenCalledTimes(1);
  });
});

describe("useStore tests", () => {
  function componentUseStore(key, spy) {
    let val = {};
    function TestComponent() {
      val[key] = rlax.useStore(key);
      spy && spy();
    }
    return { val, wrapper: shallow(<TestComponent />) };
  }

  beforeEach(() => {
    rlax.initStore({
      data: {
        n: 233,
        m: 1,
      },
      persist: "none",
    });
  });
  afterEach(rlax.clear);

  test("should throw when use uninitial store", () => {
    expect(() => {
      componentUseStore("s");
    }).toThrowError("No store named 's'!");
  });

  test("should get store in component", () => {
    expect(componentUseStore("n").val.n).toBe(233);
  });

  test("should rerender component when set new value", () => {
    const spy = jest.fn();
    const val = componentUseStore("n", spy).val;
    expect(val.n).toBe(233);
    expect(spy).toHaveBeenCalledTimes(1);
    rlax.setStore("n", 321);
    expect(val.n).toBe(321);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test("should only rerender related component", () => {
    const spyN = jest.fn();
    const spyM = jest.fn();
    const valN = componentUseStore("n", spyN).val;
    const valM = componentUseStore("m", spyM).val;
    expect(valN.n).toBe(233);
    expect(spyN).toHaveBeenCalledTimes(1);
    expect(valM.m).toBe(1);
    expect(spyM).toHaveBeenCalledTimes(1);
    rlax.setStore("n", 123);
    rlax.setStore("n", 231);
    rlax.setStore("n", 41);
    rlax.setStore("m", 41);
    expect(valN.n).toBe(41);
    expect(spyN).toHaveBeenCalledTimes(4);
    expect(valM.m).toBe(41);
    expect(spyM).toHaveBeenCalledTimes(2);
  });

  test("should remove render function after component unmounted", () => {
    function TestComponent() {
      rlax.useStore("n");
      return <Fragment></Fragment>;
    }
    const wrapper = mount(<TestComponent />);
    const renderList = _debugGetPrivateState("stores").n.renderList;
    expect(renderList).toHaveLength(1);
    wrapper.unmount();
    expect(renderList).toHaveLength(0);
  });
});

describe("persist tests", () => {
  function reload() {
    const listener = windowEventHandlers["beforeunload"];
    if (Array.isArray(listener)) {
      listener.forEach((l) => l());
    }
    _debugSetPrivateState("stores", Object.create(null));
    _debugSetPrivateState("storage", null);
    _debugSetPrivateState("initialized", false);
    clearWindowHandlers();
  }

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    localStorage.setItem.mockClear();
    localStorage.getItem.mockClear();
    sessionStorage.setItem.mockClear();
    sessionStorage.getItem.mockClear();
    clearWindowHandlers();
  });

  afterEach(rlax.clear);

  test("should not persist when set to none", () => {
    rlax.initStore({
      data: {
        n: 0,
      },
      persist: "none",
    });
    expect(windowEventHandlers["beforeunload"]).toBe(undefined);
  });

  test("should persist to sessionStorage", () => {
    const data = {
      n: 0,
    };
    const init = () => {
      rlax.initStore({
        data,
        persist: "session",
      });
    };
    init();
    reload();
    init();
    expect(sessionStorage.setItem).toHaveBeenLastCalledWith(
      storageKey,
      JSON.stringify(data)
    );
  });

  test("should persist to localStorage", () => {
    const data = {
      n: 0,
    };
    const init = () => {
      rlax.initStore({
        data,
        persist: "local",
      });
    };
    init();
    reload();
    init();
    expect(localStorage.setItem).toHaveBeenLastCalledWith(
      storageKey,
      JSON.stringify(data)
    );
  });

  test("should restore from sessionStorage", () => {
    const init = () => {
      rlax.initStore({
        data: {
          n: 0,
        },
        persist: "session",
      });
    };
    init();
    rlax.setStore("n", 123);
    reload();
    init();
    expect(_debugGetPrivateState("stores").n.value).toBe(123);
  });

  test("should restore from localStorage", () => {
    const init = () => {
      rlax.initStore({
        data: {
          n: 0,
        },
        persist: "local",
      });
    };
    init();
    rlax.setStore("n", 123);
    reload();
    init();
    expect(_debugGetPrivateState("stores").n.value).toBe(123);
  });
});

describe("clear tests", () => {
  beforeEach(() => {
    localStorage.removeItem.mockClear();
    sessionStorage.removeItem.mockClear();
  });

  test("should clear", () => {
    rlax.initStore({
      data: {
        n: 0,
      },
      persist: "none",
    });
    rlax.clear();
    expect(_debugGetPrivateState("stores").n).toBe(undefined);

    rlax.clear();
    rlax.initStore({
      data: {
        n: 0,
      },
      persist: "local",
    });
    rlax.clear();
    expect(localStorage.removeItem).toHaveBeenLastCalledWith(storageKey);

    rlax.clear();
    rlax.initStore({
      data: {
        n: 0,
      },
      persist: "session",
    });
    rlax.clear();
    expect(sessionStorage.removeItem).toHaveBeenLastCalledWith(storageKey);
  });

  test("should remove unload listener after clear", () => {
    rlax.initStore({
      data: {
        n: 0,
      },
      persist: "session",
    });
    rlax.clear();
    expect(windowEventHandlers["beforeunload"]).toHaveLength(0);
  });
});
