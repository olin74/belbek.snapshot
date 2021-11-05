import { createClient } from "redis";
import type { RedisClient } from "redis";
import { Switchboard } from "switchboard.js";
import type {
	ConnectedPeer,
	SBClientOptions,
	Switchboard as SBType,
} from "switchboard.js";
/*
interface Review {
	id: string; // TODO: generate review id
	text: string;
	item: string; // item id
}

interface Item {
	id: string; // TODO: generate item id
	my?: boolean;
	title: string;
	desc?: string;
	image?: string; // now use base64 encoded
	reviews?: Review[];
}
*/
interface Message {
	id: string; // generated uid
	body: string; // message body plain text
	timestamp: number; // on message dynamic stamp
	from: string; // author peer id
	image: string; // base64 encoded image if exists
}
/*
// any user has session
interface Session {
	peerId: string;
	timestamp: number;
	username: string;
	userpic: string;
	items?: Item[];
	lastseen: number;
}
*/
const options: SBClientOptions = {
	trackers: [
		// 'wss://tracker.sloppyta.co:443/announce',
		// 'wss://tracker.files.fm:7073/announce',
		"wss://tracker.openwebtorrent.com",
		"wss://tracker.btorrent.xyz",
	],
};

(async () => {
	let messages = {};
	// init
	const p2p: SBType = new Switchboard(options); // p2p client
	const redis: RedisClient = createClient({
		url: process.env.REDIS_URL,
		password: process.env.REDIS_PASSWORD,
	}); // redis

	redis.on("error", (err) => console.error("Redis Client Error", err));

	// connect
	await redis.connect();
	p2p.swarm("belbekmarket");

	const msgHandler = async (ev: any, peerId: string) => {
		const msg: Message = await JSON.parse(ev.data);
		// auto fields
		msg.from = peerId;
		msg.timestamp = Date.now();
		msg.id = msg.from + "-" + msg.timestamp.toString();
		messages[msg.id] = msg;
		redis.set("snapshot-back", JSON.stringify(messages));
	};

	const peerHandler = async (peer: ConnectedPeer) => {
		console.log("Connected to peer: ", peer.id);
		peer.on("message", async (ev) => await msgHandler(ev, peer.id));
		peer.send(redis.get("snapshot"));
	};

	// bind
	p2p.on("peer", peerHandler);
})();
