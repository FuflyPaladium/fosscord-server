import WS from "ws";
import WebSocket from "@fosscord/gateway/util/WebSocket";
import { IncomingMessage } from "http";
import { Close } from "./Close";
import { Message } from "./Message";
import { setHeartbeat } from "@fosscord/gateway/util/setHeartbeat";
import { Send } from "@fosscord/gateway/util/Send";
import { CLOSECODES, OPCODES } from "@fosscord/gateway/util/Constants";
import { createDeflate } from "zlib";
import { URL } from "url";
import { Session } from "@fosscord/util";
var erlpack: any;
try {
	erlpack = require("erlpack");
} catch (error) {}

// TODO: check rate limit
// TODO: specify rate limit in config
// TODO: check msg max size

export async function Connection(
	this: WS.Server,
	socket: WebSocket,
	request: IncomingMessage
) {
	try {
		socket.on("close", Close);
		// @ts-ignore
		socket.on("message", Message);

		const { searchParams } = new URL(`http://localhost${request.url}`);
		// @ts-ignore
		socket.encoding = searchParams.get("encoding") || "json";
		if (!["json", "etf"].includes(socket.encoding)) {
			if (socket.encoding === "etf" && erlpack)
				throw new Error("Erlpack is not installed: 'npm i -D erlpack'");
			return socket.close(CLOSECODES.Decode_error);
		}

		// @ts-ignore
		socket.version = Number(searchParams.get("version")) || 8;
		if (socket.version != 8)
			return socket.close(CLOSECODES.Invalid_API_version);

		// @ts-ignore
		socket.compress = searchParams.get("compress") || "";
		if (socket.compress) {
			if (socket.compress !== "zlib-stream")
				return socket.close(CLOSECODES.Decode_error);
			socket.deflate = createDeflate({ chunkSize: 65535 });
			socket.deflate.on("data", (chunk) => socket.send(chunk));
		}

		socket.events = {};
		socket.permissions = {};
		socket.sequence = 0;

		setHeartbeat(socket);

		await Send(socket, {
			op: OPCODES.Hello,
			d: {
				heartbeat_interval: 1000 * 30,
			},
		});

		socket.readyTimeout = setTimeout(() => {
			Session.delete({ session_id: socket.session_id }); //should we await?
			return socket.close(CLOSECODES.Session_timed_out);
		}, 1000 * 30);
	} catch (error) {
		console.error(error);
		Session.delete({ session_id: socket.session_id }); //should we await?
		return socket.close(CLOSECODES.Unknown_error);
	}
}
