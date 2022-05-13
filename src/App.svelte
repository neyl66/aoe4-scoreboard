<script>
    import {onMount} from "svelte";
	import {played_matches} from "./stores.js";

    const matches_url = (profile_id) => `https://aoe4world.com/api/v0/players/${profile_id}/games`;

	let settings = {
		steam_id: "",
		civs: [],
		map_types: [],
        periodic_check: {
            timer: 0,
            interval: 20 * 1000,
        },
	};

    function get_url_info() {
		const current_url = new URL(location.href);
		const search_params = new URLSearchParams(current_url.search);

		// Available url parameters to override settings.
		const params = ["steam_id"];

		// Apply found url params to settings.
		for (let param of params) {
			if (search_params.has(param)) {
				settings[param] = search_params.get(param);
			}
		}
	}

    async function set_played_matches() {
        const saved_played_matches = $played_matches;
        const awaited_played_matches = await get_played_matches();

        const changes = diff(saved_played_matches, awaited_played_matches);
        if (changes.length > 0) {
            $played_matches = awaited_played_matches;
        }
    }

    async function get_played_matches() {
        const response = await fetch(match_url(settings.steam_id));
        const json = await response.json();

        return json;
    }

	function start_periodic_check() {
		if (settings.periodic_check.timer) {
			return;
		}

		// Refresh data on interval.
		settings.periodic_check.timer = setInterval(() => {
			set_played_matches();
		}, settings.periodic_check.interval);
	}

	window.stop_periodic_check = () => {
		clearInterval(settings.periodic_check.timer);
		settings.periodic_check.timer = 0;
	}

    onMount(async () => {
		return
		get_url_info();

        set_played_matches();
		start_periodic_check();
	});

</script>

<main>
	<div class="scoreboard">
		<span>Offico</span>
		vs
		<span>Ladder</span>

		6:4
	</div>
</main>

<style>
	.scoreboard {
		font-size: 22px;
	}
</style>