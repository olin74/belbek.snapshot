import { createClient } from "redis";
import { Switchboard } from "switchboard.js";

const options = {
	trackers: [
		// 'wss://tracker.sloppyta.co:443/announce',
		// 'wss://tracker.files.fm:7073/announce',
		"wss://tracker.openwebtorrent.com",
		"wss://tracker.btorrent.xyz",
	],
};

let messages = {}; // storage

function adaptMessages(data) {
	console.debug(data); // FIXME: testing only
	return [];
}

(async () => {
	const p2p = new Switchboard(options);

	// console.info(p2p);

	const client = createClient({
		url: process.env.REDIS_URL,
		password: process.env.REDIS_PASSWORD,
	});

	client.on("error", (err) => console.log("Redis Client Error", err));
	await client.connect();
	console.log("redis connected");
	p2p.swarm("belbekmarket");

	const peerHandler = (peer) => {
		console.log("new peer: ", peer.id);
		const ts = Date.now();
		const today = (ts - (ts % (3600 * 24))).toString();
		const data = client.get("snapshot-" + today);
		// peer.on("message", (ev) => msgHandler(ev, peer.id));
		adaptMessages(data).forEach((msg) => peer.send(msg));
	};

	// bind
	p2p.once("connected", () => console.log("p2p connected"));
	p2p.on("peer", peerHandler);
	p2p.on("peer-seen", console.log);
})();
