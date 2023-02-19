import {
	SendInteractionResponse,
	DevrevAPIRequest,
	DiscordAPIRequest,
}
from "../utils";

export async function HandleModalSubmitInteraction(payload, inter_Interaction) {
	const {
		id,
		token,
		data,
		member,
		channel_id
	} = payload;
	const {
		custom_id,
		components,
	} = data;

	// Modal Submission from Message Command
	if (custom_id === "ticket_creation_message_command") {
		const ticket_title = components[0].components[0].value;
		const ticket_description = components[1].components[0].value;
		const ticket_owner_id = member.user.id;
		// console.log("TITLE IS : ", ticket_title);
		// console.log("DESCRIPTION IS : ", ticket_description);

		//Create DevRev Ticket and GET Response Payload
		const work_data = {
			applies_to_part: DEFAULT_PART,
			owned_by: [OWNER_ID],
			stage: {
				name: DEFAULT_STAGE,
			},
			tags: [{
				id: DISCORD_TAG
			}],
			title: ticket_title,
			body: ticket_description,
			type: "ticket",
		};

		// [REMOVE THIS] : TRY ADDING SEVERITY / PRIORITY IN THE WORK ITEM CREATION
		// Endpoint to Create A DevRev Work Item
		let endpoint = `works.create`;
		let work_item_id, work_owner_display_name;
		try {
			const resp = await DevrevAPIRequest(endpoint, {
				method: "POST",
				body: work_data,
			});
			work_item_id = resp.work.display_id;
			work_owner_display_name = resp.work.created_by.display_name;
			console.log("Successfully created devrev work item!");
		} catch (err) {
			console.error(err);
		}

		// Responding to the Interaction (MODAL_SUBMIT)

		// Retrieve the Message Object using ID to check if it has an existing thread
		endpoint = `channels/${channel_id}/messages/${inter_Interaction.message_id}`;
		let threadExists, thread_id;
		try {
			const resp = await DiscordAPIRequest(endpoint, {
				method: "GET",
			});
			const payload = await resp.json();
			if (payload.thread == null) threadExists = false;
			else {
				threadExists = true;
				thread_id = payload.thread.id;
			}
		} catch (err) {
			console.error(err);
		}
		// Discord currently allows 1 thread per post, so we must write new ticket creation notifications on the existing thread, if any.
		if (threadExists) {
			//Write to the same thread
			endpoint = `channels/${thread_id}/messages`;
			const threadMessage = {
				content: `A ticket ${work_item_id} has been created by <@${ticket_owner_id}>!`,
			};
			try {
				const resp = await DiscordAPIRequest(endpoint, {
					method: "POST",
					body: threadMessage,
				});
			} catch (err) {
				console.error(err);
			}
		} else {
			// Defining a new thread with basic details like name
			const threadData = {
				name: "[devrev-tickets]",
			};

			// Creating a new thread from message
			console.log("ids look like, ", channel_id, " and ", inter_Interaction.message_id);
			endpoint = `channels/${channel_id}/messages/${inter_Interaction.message_id}/threads`;

			let thread_id;
			try {
				const resp = await DiscordAPIRequest(endpoint, {
					method: "POST",
					body: threadData,
				});
				const payload = await resp.json();
				// console.log("Channel looks like : " , JSON.stringify(payload));
				thread_id = payload.id;
				// console.log("Thread Successfully created !", thread_id)
			} catch (err) {
				console.error(err);
			}

			// Writing the message to the existing or newly created thread
			endpoint = `channels/${thread_id}/messages`;
			const threadMessage = {
				content: `A ticket ${work_item_id} has been created by <@${ticket_owner_id}>!`,
			};
			try {
				const resp = await DiscordAPIRequest(endpoint, {
					method: "POST",
					body: threadMessage,
				});
			} catch (err) {
				console.error(err);
			}
		}

		// Embedding for displaying the created ticket in the Ephemeral Message
		const embed = {
			title: work_item_id,
			color: 0x00ff00,
			fields: [{
				name: "Title",
				value: ticket_title,
			}, {
				name: "Description",
				value: ticket_description,
			}, {
				name: "Parts",
				value: "Default Product 1",
			}, {
				name: "Owner",
				value: work_owner_display_name,
			}, {
				name: "Stage",
				value: DEFAULT_STAGE,
			}, ],
			timestamp: new Date(),
		};

		// Ephemeral message to main channel as a response to the ticket creation
		SendInteractionResponse({
			type: 4,
			data: {
				content: "Your ticket has been created with these default fields",
				embeds: [embed],
				flags: 64, // set the message to ephemeral
				components: [{
					type: 1,
					components: [{
						type: 2,
						label: "Checkout Ticket?",
						style: 5,
						url: "https://app.dev.devrev-eng.ai/flow-test/works/" + work_item_id,
					}, ],
				}, ],
			},
		}, id, token);
	}
	// Modal Submission from Slash Command
	if (custom_id == "ticket_creation_slash_command") {
		const ticket_title = components[0].components[0].value;
		const ticket_description = components[1].components[0].value;
		const ticket_owner_id = member.user.id;
		// console.log("TITLE IS : ", ticket_title);
		// console.log("DESCRIPTION IS : ", ticket_description);

		//Create DEVREV TICKET and GET response payload
		const work_data = {
			applies_to_part: DEFAULT_PART,
			owned_by: [OWNER_ID],
			stage: {
				name: DEFAULT_STAGE,
			},
			tags: [{
				id: DISCORD_TAG
			}],
			title: ticket_title,
			body: ticket_description,
			type: "ticket",
		};

		//TRY ADDING SEVERITY / PRIORITY IN THE WORK ITEM CREATION
		// Endpoint to create a devrev work item
		let endpoint = `works.create`;
		let work_item_id, work_owner_display_name;
		try {
			const resp = await DevrevAPIRequest(endpoint, {
				method: "POST",
				body: work_data,
			});
			work_item_id = resp.work.display_id;
			work_owner_display_name = resp.work.created_by.display_name;
			console.log("Successfully created devrev work item!");
		} catch (err) {
			console.error(err);
		}


		if (inter_Interaction.newThreadRequired) {
			const threadData = {
				name: "[devrev-tickets]",
				type: 11,
			};

			// API endpoint to create a new thread from message
			let endpoint = `/channels/${channel_id}/threads`;

			let thread_id;
			try {
				const resp = await DiscordAPIRequest(endpoint, {
					method: "POST",
					body: threadData,
				});
				const payload = await resp.json();
				thread_id = payload.id;
			} catch (err) {
				console.error(err);
			}

			// API endpoint to write to that thread
			endpoint = `channels/${thread_id}/messages`;
			const threadMessage = {
				content: `A ticket ${work_item_id} has been created by <@${ticket_owner_id}>!`,
			};
			try {
				const resp = await DiscordAPIRequest(endpoint, {
					method: "POST",
					body: threadMessage,
				});
			} catch (err) {
				console.error(err);
			}
		} else {
			// Display a public message-notification on the channel
			let endpoint = `/channels/${channel_id}/messages`;
			const channelMessage = {
				content: `A ticket ${work_item_id} has been created by <@${ticket_owner_id}>!`,
			};
			try {
				const resp = await DiscordAPIRequest(endpoint, {
					method: "POST",
					body: channelMessage,
				});
			} catch (err) {
				console.error(err);
			}
		}

		const embed = {
			title: work_item_id,
			color: 0x00ff00,
			fields: [{
					name: "Title",
					value: ticket_title,
				},
				{
					name: "Description",
					value: ticket_description,
				},
				{
					name: "Parts",
					value: "Default Product 1",
				},
				{
					name: "Owner",
					value: work_owner_display_name,
				},
				{
					name: "Stage",
					value: DEFAULT_STAGE,
				},
			],
			timestamp: new Date(),
		};

		SendInteractionResponse({
			type: 4,
			data: {
				content: "Your ticket has been created with these default fields",
				embeds: [embed],
				flags: 64, // set the message to ephemeral
				components: [{
					type: 1,
					components: [{
						type: 2,
						label: "Checkout Ticket?",
						style: 5,
						url: "https://app.dev.devrev-eng.ai/flow-test/works/" +
							work_item_id,
					}, ],
				}, ],
			},
		}, id, token);
	}
}