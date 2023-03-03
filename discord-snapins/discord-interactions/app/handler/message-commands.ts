import {
	DevrevAPIRequest,
	DiscordAPIRequest,
	checkIfTagExists,
	createDiscordTag
} from "../utils"
export async function HandleMessageCommandInteractions(event, name, discordOAuthToken, discordBotToken, devrevPATToken) {
	const {
		data,
		token,
		application_id,
		member,
		channel_id,
	} = event.payload;
	// Defining Access Type
	const bearerAccess = "Bearer";
	const botAccess = "Bot";
    // Message Command for ticket creation
	if (name === "Create Ticket") {
		const {
			target_id,
			guild_id
		} = data;
		const message_content = data.resolved.messages[target_id].content;
		const message_title = `[via Discord] Ticket on ${target_id}`;
		const creator_id = member.user.id;
		const tagName = "discord-ticket";
		// Fetch `Discord` Tag DON ID
		let [tagExists, tagDON] = await checkIfTagExists(tagName, devrevPATToken);
		if (!tagExists)
			tagDON = await createDiscordTag(tagName, devrevPATToken);

		// Create DevRev Ticket and Get Response Payload
		let message_link = `https://discord.com/channels/${guild_id}/${channel_id}/${target_id}`;
		const work_data = {
			applies_to_part: event.input_data.global_values.part_id,
			owned_by: [event.input_data.global_values.owner_id],
			stage: {
				name: event.input_data.global_values.stage,
			},
			tags: [{
				id: tagDON,
			}],
			title: message_title,
			body: `This ticket is created on Discord thread from this [message](${message_link}).\n[Content] : ` + message_content,
			type: `ticket`,
		};
		let endpoint = `works.create`;
		let work_title, work_item_id, work_owner_display_name, work_part_name, work_stage, work_description;
		try {
			const resp = await DevrevAPIRequest(endpoint, {
				method: "POST",
				body: work_data,
			}, devrevPATToken);

			// Work Data for Ephemeral Message
			work_item_id = resp.work.display_id;
			work_owner_display_name = resp.work.created_by.display_name;
			work_part_name = resp.work.applies_to_part.name;
			work_stage = resp.work.stage;
			work_description = resp.work.body;
			work_title = resp.work.title;
			console.log("Successfully created devrev work item!");
		} catch (err) {
			console.error(err);
		}
		// Retrieve the Message Object using ID to check if it has an existing thread
		endpoint = `channels/${channel_id}/messages/${target_id}`;
		let threadExists, thread_id;
		try {
			const resp = await DiscordAPIRequest(endpoint, {
				method: "GET",
			}, botAccess, discordBotToken);
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
				content: `A ticket ${work_item_id} has been created by <@${creator_id}>!`,
			};
			try {
				const resp = await DiscordAPIRequest(endpoint, {
					method: "POST",
					body: threadMessage,
				}, botAccess, discordBotToken);
			} catch (err) {
				console.error(err);
			}
		} else {
			// Defining a new thread with basic details like name
			const threadData = {
				name: "[devrev-tickets]",
			};
			// Creating a new thread from message
			endpoint = `channels/${channel_id}/messages/${target_id}/threads`;
			let thread_id;
			try {
				const resp = await DiscordAPIRequest(endpoint, {
					method: "POST",
					body: threadData,
				}, botAccess, discordBotToken);
				const payload = await resp.json();
				thread_id = payload.id;
			} catch (err) {
				console.error(err);
			}
			// Writing the message to the existing or newly created thread
			endpoint = `channels/${thread_id}/messages`;
			const threadMessage = {
				content: `A ticket ${work_item_id} has been created by <@${creator_id}>!`,
			};
			try {
				const resp = await DiscordAPIRequest(endpoint, {
					method: "POST",
					body: threadMessage,
				}, botAccess, discordBotToken);
			} catch (err) {
				console.error(err);
			}
		}
		// First follow-up Message 
		endpoint = `/webhooks/${application_id}/${token}`;
		const followUp1 = {
			content: `Discussion thread initiated for ticket ${work_item_id}`,
		};
		try {
			const resp = await DiscordAPIRequest(endpoint, {
				method: "POST",
				body: followUp1,
			}, bearerAccess, discordOAuthToken);
		} catch (err) {
			console.error(err);
		}
		// Embedding for displaying the created ticket in the Ephemeral Message (Second Follow Up Message)
		const embed = {
			title: work_item_id,
			color: 0x00ff00,
			fields: [{
				name: "Title",
				value: work_title,
			}, {
				name: "Description",
				value: work_description,
			}, {
				name: "Parts",
				value: work_part_name,
			}, {
				name: "Owner",
				value: work_owner_display_name,
			}, {
				name: "Stage",
				value: work_stage,
			}, ],
			timestamp: new Date(),
		};
		endpoint = `/webhooks/${application_id}/${token}`;
		const followUp2 = {
			content: "DevRev Ticket",
			flags: 64,
			embeds: [embed],
			components: [{
				type: 1,
				components: [{
					type: 2,
					label: "Checkout Ticket?",
					style: 5,
					url: "https://app.dev.devrev-eng.ai/flow-test/works/" + work_item_id,
				}, ],
			}, ],
		};
		try {
			const resp = await DiscordAPIRequest(endpoint, {
				method: "POST",
				body: followUp2,
			}, bearerAccess, discordOAuthToken);
		} catch (err) {
			console.error(err);
		}
	}
}