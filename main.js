const input = require("readline-async");
const _fetch = require("node-fetch");
const data = require("./data.json");

const endpoint = "https://api.spotify.com/v1";

const query = args => {
	let q = "";

	let i = 0;
	for (let key in args) {
		q += `${i > 0 ? "&" : "?"}${key}=${encodeURIComponent(args[key])}`;

		i++;
	}

	return q;
};

(async () => {
	if (!data.token) {
		console.log(`'data.json' contains no valid token! Please go to https://developer.spotify.com/console/get-users-available-devices/ generate a token, and place it in data.json, then restart.`);

		await input();
		return null;
	}
	
	const fetch = async (url, _query = {}, _options = {}) => {
		const options = Object.assign({
			headers: {
				Authorization: "Bearer " + data.token
			}
		}, _options);
	
		try {
			return await _fetch(url + query(_query), options);
		} catch (err) {
			console.error(`Failed to send '${url}' request! Reason: ${err}`);
			return null;
		}
	};

	console.log("Fetching devices list...");
	const { devices } = await (await fetch(endpoint + "/me/player/devices")).json();

	console.log(devices);
	console.log(`Which device would you like to connect to? (1-${devices.length})`);
	const device = devices[parseInt(await input()) - 1];

	console.log("What genre would you like? (leave blank for random): ");
	const genre = await input() || "everything";

	console.log("Fetching playlists...");
	const { playlists: { items: [ playlist ] } } = await (await fetch(endpoint + "/search", { q: "the sound of " + genre, type: "playlist" })).json();

	console.log("Fetching tracks...");
	const { items: tracks } = await (await fetch(endpoint + "/playlists/" + playlist.id + "/tracks", { market: "ES" })).json();
	
	while (true) {
		const { track } = tracks[Math.floor(Math.random() * tracks.length)];
		console.log(`Playing '${track.name}' by '${track.artists.map(a => a.name).join(", ")}' from album '${track.album.name}' on device '${device.name}'`);

		await fetch(endpoint + "/me/player/queue", { uri: track.uri, device_id: device.id }, { method: "post" });
		await fetch(endpoint + "/me/player/next", { device_id: device.id }, { method: "post" });

		console.log("Press the enter key to pick another random song!");
		await input();
	}
})();