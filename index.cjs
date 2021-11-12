const { createClient } = require("redis");

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
	const client = createClient({
		url: process.env.REDIS_URL,
		password: process.env.REDIS_PASSWORD,
	});

	client.on("error", (err) => console.log("Redis Client Error", err));
	console.log(client);

	// await client.connect();

	const browser = await puppeteer.launch({
		headless: false,
		args: ["--load-extension=extensions/webrtc"],
	});
	const page = await browser.newPage();

	await page.evaluate(async () => {
		const { Switchboard } = require("switchboard.js");
		const p2p = new Switchboard(options);

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
	});

	page.on("console", (msg) => {
		for (let i = 0; i < msg.args().length; ++i)
			console.log(`${i}: ${msg.args()[i]}`);
	});
})();
