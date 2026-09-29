import indexPug from "../../default-webjam/index.pug?raw";
import gaiaUrl from "../../default-webjam/assets/gaia.webp?inline";

export const defaultFiles = {
  "index.pug": indexPug,
  "assets/gaia.webp": fetch(gaiaUrl)
    .then((response) => response.arrayBuffer())
    .then((buffer) => new Uint8Array(buffer)),
};
