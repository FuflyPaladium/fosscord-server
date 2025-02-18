import WebSocket from "@fosscord/gateway/util/WebSocket";
var erlpack: any;
try {
	erlpack = require("erlpack");
} catch (error) {}
import OPCodeHandlers from "../opcodes";
import { Payload, CLOSECODES, OPCODES } from "@fosscord/gateway/util/Constants";
import { instanceOf, Tuple } from "lambert-server";
import { check } from "../opcodes/instanceOf";
import WS from "ws";

const PayloadSchema = {
	op: Number,
	$d: new Tuple(Object, Number), // or number for heartbeat sequence
	$s: Number,
	$t: String,
};

export async function Message(this: WebSocket, buffer: WS.Data) {
	// TODO: compression
	var data: Payload;

	if (this.encoding === "etf" && buffer instanceof Buffer)
		data = erlpack.unpack(buffer);
	else if (this.encoding === "json" && typeof buffer === "string")
		data = JSON.parse(buffer);
	else return;

	check.call(this, PayloadSchema, data);

	// @ts-ignore
	const OPCodeHandler = OPCodeHandlers[data.op];
	if (!OPCodeHandler) {
		console.error("[Gateway] Unkown opcode " + data.op);
		// TODO: if all opcodes are implemented comment this out:
		// this.close(CLOSECODES.Unknown_opcode);
		return;
	}

	console.log("[Gateway] Opcode " + OPCODES[data.op]);

	try {
		return await OPCodeHandler.call(this, data);
	} catch (error) {
		console.error(error);
		if (!this.CLOSED && this.CLOSING)
			return this.close(CLOSECODES.Unknown_error);
	}
}
