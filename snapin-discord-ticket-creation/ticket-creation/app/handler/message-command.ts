import {
	OpenAPISummarizer
} from "../utils";
import {
	SendInteractionResponse
} from "../utils";

export async function HandleMessageCommandTicketCreation(payload, inter_Interaction) {
	const {
		id,
		token,
		data,
	} = payload;
	const {
		target_id
	} = data;
	inter_Interaction.message_id = target_id;
	const message_content = data.resolved.messages[target_id].content;
	const headingFromOPENAI = await OpenAPISummarizer(message_content, 10);
	// console.log(headingFromOPENAI)
	SendInteractionResponse({
		type: 9, //MODAL INPUT RESPONSE
		data: {
			title: "Ticket Creation Panel",
			custom_id: "ticket_creation",
			components: [{
				type: 1,
				components: [{
					type: 4,
					custom_id: "ticket_title",
					label: "Title",
					style: 1,
					min_length: 1,
					max_length: 4000,
					placeholder: "[via discord] " + headingFromOPENAI,
					required: true,
				}, ],
			}, {
				type: 1,
				components: [{
					type: 4,
					custom_id: "ticket_description",
					label: "Description",
					style: 2,
					min_length: 1,
					max_length: 4000,
					placeholder: "This ticket is created from discord... <message_interacted_with>... <thread_link>...",
					required: true,
				}, ],
			}, ],
		},
	}, id, token);
}