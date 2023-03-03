import {
	AutomationEvent,
	AutomationInterface,
	AutomationMetadata
}
from "../sdk"

import {
	HandleMessageCommandInteractions,
	HandleSlashCommandInteractions,
} from "./handler/event-handler"

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
		// For details on interaction payload
		// Refer to https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-structure
		console.log(`Incoming payload : `, JSON.stringify(event));
		const {
			type,
			data,
		} = event.payload;
		// Extracting Tokens from Keyrings
		const discordOAuthToken = event.input_data.keyrings["discord"];
		const discordBotToken = event.input_data.keyrings["discord-bot-token"];
		const devrevPATToken = event.input_data.keyrings["devrev"];
		// Handling Application Command Interactions
		if (type == 2) {
			const {
				name
			} = data;
			// Handling Message Commands
			if (name in ["Create Ticket"]) {
				HandleMessageCommandInteractions(event, name, discordOAuthToken, discordBotToken, devrevPATToken);
			}
			// Handling Slash Commands
			if (name in ["create-ticket", "devrev-ticket", "devrev-issue"]) {
				HandleSlashCommandInteractions(event, name, discordOAuthToken, discordBotToken, devrevPATToken);
			}
		}
	}
}