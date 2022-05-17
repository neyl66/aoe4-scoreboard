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
        enemy: {
            profile_id: "",
            name: "",
            wins_against: 0,
            losses_against: 0,
        },
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

        settings.enemy.profile_id = "";
        settings.enemy.name = "";
        settings.enemy.wins_against = 0;
        settings.enemy.losses_against = 0;

        if ($played_matches.length > 0) {
            for (const team of $played_matches[0].teams) {
                for (const {player} of team) {
                    if (player.profile_id !== settings.profile_id) {
                        settings.enemy.profile_id = player.profile_id;
                        settings.enemy.name = player.name;
                        break;
                    }
                }
            }
            
            if (settings.enemy.profile_id) {
                const response = await fetch(matches_against_enemy_url(settings.profile_id, settings.enemy.profile_id))
                const json = await response.json();

                json.games.forEach((match) => {
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
                                settings.enemy.wins_against += 1;
                            } else if (result === "loss") {
                                settings.enemy.losses_against += 1;
                            }
                        });
                    });
                });
            }
        }
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
        {#if settings.enemy.profile_id}
            <div class="scoreboard-item -enemy">
                <span>{$player_name}</span>
                vs
                <span>{settings.enemy.name}</span>

                <span class="win">{settings.enemy.wins_against}</span>
                :
                <span class="loss">{settings.enemy.losses_against}</span>
            </div>
        {/if}

        <div class="scoreboard-item">
            <span>{$player_name}</span>
            vs
            <span>Ladder</span>
    
            <span class="win">{$wins}</span>
            :
            <span class="loss">{$losses}</span>
        </div>
	</div>
</main>

<style>
	.scoreboard {
		font-size: 28px;
        text-shadow: black 0px 0px 3px;
	}

    .scoreboard-item {
        margin-bottom: 5px;
    }
    .scoreboard-item.-enemy {
        font-size: 22px;
    }

    .win {
        color: rgb(34 197 94);
    }

    .loss {
        color: rgb(239 68 68);
    }
</style>