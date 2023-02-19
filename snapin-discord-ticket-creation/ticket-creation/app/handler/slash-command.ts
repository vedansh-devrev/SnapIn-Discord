import {
	SendInteractionResponse
}
from "../utils";

export async function HandleSashCommandTicketCreation(payload) {
	const {
		id,
		token,
	} = payload;
	SendInteractionResponse({
		type: 4,
		data: {
			content: "Your ticket has been created with these default fields",
		},
	}, id, token);
}