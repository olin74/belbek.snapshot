const { createClient } = require("redis");
const puppeteer = require("puppeteer");

(async () => {

	// storage
	let data = {}

	// redis
	const client = await createClient({
		url: process.env.REDIS_URL,
		password: process.env.REDIS_PASSWORD,
	})
	client.on("error", (err) => console.log("redis: client error", err))

	let syncTimeout

	// push and pull items data from re
	const syncData = async () => {
		await client.keys('*', (err, keys) => {
			if (err) return console.error(err)
			console.log('redis: loading ' + keys.length.toString() + ' entries')
			await keys.forEach(async (key) => data[key] = await client.hgetall(key))
			const dkeys = Object.keys(data)
			console.log('cache: contains ' + dkeys.length.toString() + ' entries')
			await dkeys.forEach(async (k) => !keys.includes(k) && await client.hset(k, data[k]))
		})
		console.log('redis: cache data synced')
		syncTimeout = setTimeout(syncData, everyHour)
	}
	syncData()

	// browser env
	const browser = await puppeteer.launch({
		headless: true,
		args: ["--load-extension=extensions/webrtc"],
	});
	const page = await browser.newPage();

	await page.evaluate(async () => {
		const s = document.createElement('script')
		s.async = true
		s.defer = true
		s.src = 'https://cdn.jsdelivr.net/npm/switchboard.js@1.1.0/dist/index-browser.min.js'
		s.addEventListener('load', () => {
			const p2p = new switchboard.Switchboard({
				trackers: [
					// 'wss://tracker.sloppyta.co:443/announce',
					// 'wss://tracker.files.fm:7073/announce',
					"wss://tracker.openwebtorrent.com",
					"wss://tracker.btorrent.xyz"
				],
			})

			p2p.swarm("belbekmarket");

			const peerHandler = async (peer) => {
				console.log("new peer: ", peer.id)
				// peer.on("message", (ev) => data[peer.id] = ev.data)
				peer.on('data', (peerData) => data[peer.id] = peerData)
				Object.values(data).forEach((msg) => peer.send(msg))
			}

			// bind
			p2p.once("connected", () => console.log("p2p connected"));
			p2p.on("peer", peerHandler);
			p2p.on("peer-seen", console.log);
		});
		document.body.setAttribute('style', 'background-color: lightgreen')
		document.body.appendChild(s)
	});

	page.on("console", (msg) => {
		for (let i = 0; i < msg.args().length; ++i)
			console.log(`${i}: ${msg.args()[i]}`);
	});
	page.on('close', () => {
		syncTimeout = null
	})
})();
