import {
	AutomationEvent,
	AutomationInterface,
	AutomationMetadata
}
from "../sdk"
import {
	SendInteractionResponse,
}
from "./utils";
import {
	HandleMessageCommandTicketCreation,
	HandleSashCommandTicketCreation,
	HandleModalSubmitInteraction,
}
from "./handler/event-handler"


// Object for inter-interaction variable exchange
let inter_Interaction = {
	message_id: null,
	newThreadRequired : null,
}

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
		console.log(`Incoming payload from discord interactions looks like : `, JSON.stringify(event.payload));
		
		// For details on interaction payload
		// Refer to https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-structure
		const {
			type,
			data,
		} = event.payload;

		// HANDLING PING PONG INTERACTION
		if (type === 1) {
			const {
				id,
				token,
			} = event.payload;
			SendInteractionResponse({
					type: 1
				},
				id, token);
		}

		// HANDLING APPLICATION COMMANDS INTERACTION
		if (type === 2) {
			const {
				name
			} = data;
			//HANDLING MESSAGE COMMANDS
			if (name === "Create Ticket") {
				await HandleMessageCommandTicketCreation(event.payload, inter_Interaction);
			}
			//HANDLING SLASH COMMANDS
			if (name === "ticket") {
				await HandleSashCommandTicketCreation(event.payload, inter_Interaction); //Needs to be updated as per PRD
			}
		}

		// HANDLING MODAL SUBMIT INTERACTION
		if (type === 5) {
			await HandleModalSubmitInteraction(event.payload, inter_Interaction);
		}
	}
}