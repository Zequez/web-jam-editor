import type * as Pug from "pug";

type BrowserRequire = <Module>(name: string) => Module;

const browserRequire = (
  globalThis as typeof globalThis & {
    require: BrowserRequire;
  }
).require;

const pug = browserRequire<typeof Pug>("pug");

export default pug;
