import { StoreApi, UseBoundStore } from "zustand";
export function createSelectors<T extends object, A extends object = object>(
  store: UseBoundStore<StoreApi<T & A>>
) {
  type UseSelectors = {
    [K in keyof T]: () => T[K];
  } & {
    [K in keyof A]: () => A[K];
  } & {
    state: <K extends Array<keyof (T & A)>>(...keys: K) => { [P in K[number]]: (T & A)[P] };
    actions: <K extends Array<keyof (T & A)>>(...keys: K) => { [P in K[number]]: (T & A)[P] };
  };

  const stateSelectors = Object.keys(store.getState()).reduce((selectors, key) => {
    const k = key as keyof (T & A);
    
    if (typeof store.getState()[k] === "function") {
      return selectors;
    }

    selectors[k as string] = () => store(state => state[k]);
    
    return selectors;
  }, {} as Record<string, () => unknown>);

  const actionSelectors = Object.keys(store.getState()).reduce((selectors, key) => {
    const k = key as keyof (T & A);
    
    if (typeof store.getState()[k] !== "function") {
      return selectors;
    }

    selectors[k as string] = () => store(state => state[k]);
    
    return selectors;
  }, {} as Record<string, () => unknown>);
  const stateSelector = <K extends Array<keyof (T & A)>>(...keys: K) => 
    store(state => {
      const result = {} as Record<K[number], unknown>;
      keys.forEach(key => {
        result[key] = state[key];
      });
      return result as { [P in K[number]]: (T & A)[P] };
    });

  const actionsSelector = <K extends Array<keyof (T & A)>>(...keys: K) => 
    store(state => {
      const result = {} as Record<K[number], unknown>;
      keys.forEach(key => {
        result[key] = state[key];
      });
      return result as { [P in K[number]]: (T & A)[P] };
    });

  return Object.assign(store, {
    use: {
      ...stateSelectors,
      ...actionSelectors,
      state: stateSelector,
      actions: actionsSelector,
    } as UseSelectors,
  });
}