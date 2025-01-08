import { createDirectus, rest, realtime, readItem, readItems } from "@directus/sdk";

const directus = createDirectus("").with(rest()).with(realtime());

directus.connect

export default defineNuxtPlugin(() => {
  return {
    provide: { directus, readItem, readItems },
  };
});
