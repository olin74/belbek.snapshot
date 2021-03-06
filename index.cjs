const { createClient } = require("redis");
const puppeteer = require("puppeteer");

(async () => {
	const everyHour = 1000 * 60 * 60
	let data = {} // memory storage
	let messages = {}
	// redis
	const client = await createClient({
		url: process.env.REDIS_URL_SNAPSHOT,
		password: process.env.REDIS_PASSWORD,
	})
	client.on("error", (err) => console.log("redis: client error", err))

	let syncTimeout // 
	// push and pull items data from re
	const syncData = async () => {
		await client.connect()
		// console.dir(client)
		client.keys('*', (err, keys) => {
			if (err) return console.error(err)
			// const dkeys = Object.keys(data)
			// dkeys.forEach((k) => client.hset(k, data[k]) )
			// console.log('redis: sync updated ' + dkeys.length.toString() + ' entries')
			keys.forEach((key) => client.hgetall(key).then( v => data[key] = v))
			console.log('redis: sync loaded ' + keys.length.toString() + ' entries')
		}).then(() => {
			console.log('redis: cache data synced')
			syncTimeout = setTimeout(syncData, everyHour)
		})
		await client.quit()
	}

	syncData()


	// browser env
	const browser = await puppeteer.launch({
		headless: true,
		executablePath: '/usr/bin/chromium-browser',
		args: ["--no-sandbox", "--load-extension=extensions/webrtc"],
	})

	// browser opens the default page
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

			p2p.swarm("belbekmarket")

			const peerHandler = async (peer) => {
				console.log("new peer: ", peer.id)
				peer.on("message", (ev) => {
					// TODO: POST <api-server-address>/items
					console.log('msg: ... not implemented yet')
				})
				/*
				peer.on('data', (peerData) =>  {
					console.debug(peerData)
					messages[peer.id] = messages[peer.id] ? { ...messages[peer.id], ...peerData} : peerData
				})
				*/
				peer.send('my name is @belbekspacebot')
				// TODO: peer.send('my userpic is ' + userpic)
				Object.values(data).forEach((item) => {
					const msg = `check this out ${item.desc} ${item?.image || ''}`
					peer.send(msg)
				})
			}

			// bind
			p2p.once("connected", () => console.log("p2p connected"));
			p2p.on("peer", peerHandler)
			p2p.on("peer-seen", console.log)
		})
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
