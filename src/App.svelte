<script>
	import Scoreboard from "./Scoreboard.svelte";
	import Search from "./Search.svelte";

	const url = new URL(location);
	const is_search = !url.search
	
</script>

{#if is_search}
	<Search />
{:else}
	<Scoreboard />
{/if}
