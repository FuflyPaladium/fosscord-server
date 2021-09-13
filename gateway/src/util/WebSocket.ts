import { Intents, Permissions } from "@fosscord/util";
import WS from "ws";
import { Deflate } from "zlib";
import { Channel } from "amqplib";

interface WebSocket extends WS {
	version: number;
	user_id: string;
	session_id: string;
	encoding: "etf" | "json";
	compress?: "zlib-stream";
	shard_count?: bigint;
	shard_id?: bigint;
	deflate?: Deflate;
	heartbeatTimeout: NodeJS.Timeout;
	readyTimeout: NodeJS.Timeout;
	intents: Intents;
	sequence: number;
	permissions: Record<string, Permissions>;
	events: Record<string, Function>;
}

export default WebSocket;
