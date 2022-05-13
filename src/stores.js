import {writable} from "svelte/store";

export const played_matches = writable([]);

export let wins = writable(0);
export let losses = writable(0);
