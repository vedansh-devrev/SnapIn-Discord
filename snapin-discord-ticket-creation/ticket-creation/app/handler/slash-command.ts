import {
	SendInteractionResponse
}
from "../utils";

export async function HandleSashCommandTicketCreation(payload, inter_Interaction) {
	const {
		id,
		token,
		data,
	} = payload;
	inter_Interaction.newThreadRequired = data.options[0].value;
	SendInteractionResponse({
		type: 9, //POPUP_TYPE RESPONSE
		data: {
			title: "Ticket Creation Panel",
			custom_id: "ticket_creation_slash_command",
			components: [{
					type: 1,
					components: [{
						type: 4,
						custom_id: "ticket_title",
						label: "Title",
						style: 1,
						min_length: 1,
						max_length: 4000,
						placeholder: "[via discord] :",
						required: true,
					}, ],
				},
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: "ticket_description",
						label: "Description",
						style: 2,
						min_length: 1,
						max_length: 4000,
						placeholder: "This ticket is created from discord",
						required: true,
					}, ],
				},
			],
		},
	}, id, token);
}