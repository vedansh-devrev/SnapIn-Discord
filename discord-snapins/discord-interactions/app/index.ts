import {
	AutomationEvent,
	AutomationInterface,
	AutomationMetadata
}
from "../sdk"

const MessageCommands = ["Create Ticket"];
const SlashCommands = ["create-ticket", "devrev-ticket", "devrev-issue"];

import {
	HandleMessageCommandInteractions
} from "./handler/message-commands";
import {
	HandleSlashCommandInteractions
} from "./handler/slash-commands";

export class App implements AutomationInterface {

	GetMetadata(): AutomationMetadata {
		return {
			name: "E2E SnapIn for Ticket Creation on Discord",
			version: "0.1"
		}
	}

	async Run(events: AutomationEvent[]) {
		console.log("E2E SnapIn for Ticket Creation on Discord");
		await this.EventListener(events[0]);
	}

	async EventListener(event: AutomationEvent) {
		// For details on interaction payload from Discord
		// Refer to https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-structure
		console.log("Incoming Payload : ", JSON.stringify(event));
		const {
			payload:{
				type,
				data,
			},		
			input_data : { keyrings },
		} = event;
		// Authorization for Discord
		const BEARER_ACCESS = `Bearer ${keyrings["discord"]}`;
		const BOT_ACCESS = `Bot ${keyrings["discord-bot-token"]}`;
		// Authorization for DevRev
		const DEVREV_PAT = keyrings["devrev"];
		// Handling Application Command Interactions
		if (type == 2) {
			const {
				name
			} = data;
			// Handling Message Commands
			if (MessageCommands.includes(name)) {
				await HandleMessageCommandInteractions(event, name, BEARER_ACCESS, BOT_ACCESS, DEVREV_PAT);
			}
			// Handling Slash Commands
			if (SlashCommands.includes(name)) {
				await HandleSlashCommandInteractions(event, name, BEARER_ACCESS, BOT_ACCESS, DEVREV_PAT);
			}
		}
	}
}
