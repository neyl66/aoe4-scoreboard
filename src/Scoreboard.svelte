<script>
    import {onMount} from "svelte";
	import {played_matches, player_name, wins, losses} from "./stores.js";

    const player_url = (profile_id) => `https://aoe4world.com/api/v0/players/${profile_id}`;
    const matches_url = (profile_id, since) => `https://aoe4world.com/api/v0/players/${profile_id}/games?since=${since}`;
	const matches_against_enemy_url = (profile_id, enemy_profile_id) => `https://aoe4world.com/api/v0/players/${profile_id}/games?opponent_profile_id=${enemy_profile_id}`;

	let settings = {
		steam_id: "",
		profile_id: "",
		since: "",
		civs: [],
        periodic_check: {
            timer: 0,
            interval: 20 * 1000,
        },
	};

    function get_url_info() {
		const current_url = new URL(location.href);
		const search_params = new URLSearchParams(current_url.search);

		// Available url parameters to override settings.
		const params = ["steam_id", "profile_id"];

		// Apply found url params to settings.
		for (let param of params) {
			if (search_params.has(param)) {
				settings[param] = search_params.get(param);
			}
		}
	}

	async function set_player_info() {
        const player_info = await get_player_info();

		settings.profile_id = player_info.profile_id;
		$player_name = player_info.name;
	}

    async function get_player_info() {
		const response = await fetch(player_url(settings.profile_id || settings.steam_id));
		const json = await response.json();

        return json;
    }

	async function set_score() {
		$played_matches = [];
		await set_played_matches();
		$wins = 0;
		$losses = 0;


		$played_matches.forEach((match) => {
			const {ongoing, teams, started_at, updated_at} = match;

			// Skip game that has not yet ended.
			if (ongoing) return;

			teams.forEach((team) => {
				team.forEach(({player}) => {
					const {profile_id, name, result} = player;
					
					if (profile_id !== settings.profile_id) {
						return;
					}

					if (result === "win") {
						$wins += 1;
					} else if (result === "loss") {
						$losses += 1;
					}
				});
			});
		});
	}

    async function set_played_matches() {
		$played_matches = await get_played_matches();
    }


    async function get_played_matches() {
        const response = await fetch(matches_url(settings.profile_id, settings.since));
        const json = await response.json();

        return json.games;
    }

	function start_periodic_check() {
		if (settings.periodic_check.timer) return;

		// Refresh data on interval.
		settings.periodic_check.timer = setInterval(() => {
			set_score();
		}, settings.periodic_check.interval);
	}

	window.stop_periodic_check = () => {
		clearInterval(settings.periodic_check.timer);
		settings.periodic_check.timer = 0;
	}

    onMount(async () => {
		const date = new Date();
		date.setHours(date.getHours() - 16);
		settings.since = date.toISOString();

		get_url_info();
        
        if (!settings.steam_id && !settings.profile_id) return;

        await set_player_info();
		
		set_score();
		start_periodic_check();
	});

</script>

<main>
	<div class="scoreboard">
		<span>{$player_name}</span>
		vs
		<span>Ladder</span>

		{$wins}:{$losses}
	</div>
</main>

<style>
	.scoreboard {
		font-size: 28px;
	}
</style>