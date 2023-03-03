export type Value = boolean | number | string | undefined;
type Patch = { [k: string]: any } | Value;

export function clone(o: any) {
  if (typeof o === "object" && o !== null) {
    const ret = Array.isArray(o) ? [...o] : { ...o };
    for (let k in ret) {
      ret[k] = clone(ret[k]);
    }
    return ret;
  }
  return o;
}

export function diff<T extends Value | object>(a: T, b: T): Patch {
  if (a === b) {
    return null;
  }
  if (a === undefined || typeof b !== "object" || typeof b !== typeof a) {
    return b;
  }
  let oldA: { [k: string]: Value } = a as { [k: string]: Value };
  let newA: { [k: string]: Value } = b as { [k: string]: Value };
  if (typeof b === "object" && typeof a !== "object") {
    throw `type mismatch, ${typeof a} vs ${typeof b}`;
  }
  let ret: { [k: string]: any } = {};
  let entries = 0;
  Object.entries(oldA).forEach((e) => {
    const d = diff(oldA[e[0]], newA[e[0]]);
    if (d !== null) {
      ++entries;
      ret[e[0]] = d === undefined ? null : d;
    }
  });
  Object.entries(b)
    .filter((e) => oldA[e[0]] === undefined)
    .forEach((e) => {
      ++entries;
      ret[e[0]] = newA[e[0]];
    });
  if (entries === 0) return null;
  return clone(ret);
}

export function patch(a: Patch, p: Patch): Patch {
  if (p === null) {
    return a;
  }
  if (typeof a !== typeof p) {
    if (typeof p === "object") {
      return clone(p);
    }
    return p;
  }
  if (typeof p !== "object") return p;
  let newA: { [k: string]: Patch } = a as { [k: string]: Patch };
  Object.keys(p).forEach((key) => {
    const value = p[key];
    if (value === null) {
      delete newA[key];
    } else {
      newA[key] = patch(newA[key], value);
    }
  });
  if (Array.isArray(newA)) {
    return newA.filter((x: any) => x !== undefined);
  }
  return newA;
}
