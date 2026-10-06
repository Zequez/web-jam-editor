import { getContext, setContext } from "svelte";

const PREVIEW_URL = Symbol("preview-url");

export function previewUrlStore() {
  let url = $state<null | string>(null);

  return {
    get url() {
      return url;
    },
    updateUrl(newUrl: string | null) {
      url = newUrl;
    },
  };
}

export function setPreviewUrlStore() {
  const store = previewUrlStore();
  setContext(PREVIEW_URL, store);
  return store;
}

export function getPreviewUrlStore() {
  return getContext<ReturnType<typeof previewUrlStore>>(PREVIEW_URL);
}
