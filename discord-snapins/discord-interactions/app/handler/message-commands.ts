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
		guild_id,
	} = event.payload;
	// Defining Access Type
	const bearerAccess = "Bearer";
	const botAccess = "Bot";
    // Message Command for ticket creation
	if (name == "Create Ticket") {
		const {	target_id } = data;
		const messageContent = data.resolved.messages[target_id].content;
		const titleFromMessage = `[via Discord] Ticket on ${target_id}`;
		const creatorID = member.user.id;
		const tagName = "discord-ticket";
		// Fetch `Discord` Tag DON ID
		let [tagExists, tagDON] = await checkIfTagExists(tagName, devrevPATToken);
		if (!tagExists)
			tagDON = await createDiscordTag(tagName, devrevPATToken);
		// Create DevRev Ticket and Get Response Payload
		let messageLink = `https://discord.com/channels/${guild_id}/${channel_id}/${target_id}`;
		const workData = {
			applies_to_part: event.input_data.global_values.part_id,
			owned_by: [event.input_data.global_values.owner_id],
			stage: {
				name: event.input_data.global_values.stage,
			},
			tags: [{
				id: tagDON,
			}],
			title: titleFromMessage,
			body: `This ticket is created on Discord thread from this [message](${messageLink}).\n[Content] : ` + messageContent,
			type: `ticket`,
		};
		let endpoint = `works.create`;
		let workTitle, workItemID, workOwnerDisplayName, workPartName, workStage, workDescription;
		try {
			const resp = await DevrevAPIRequest(endpoint, {
				method: "POST",
				body: workData,
			}, devrevPATToken);

			// Work Data for Ephemeral Message
			workItemID = resp.work.display_id;
			workOwnerDisplayName = resp.work.created_by.display_name;
			workPartName = resp.work.applies_to_part.name;
			workStage = resp.work.stage;
			workDescription = resp.work.body;
			workTitle = resp.work.title;
			console.log("Successfully created devrev work item!");
		} catch (err) {
			console.error(err);
		}
		// Retrieve the Message Object using ID to check if it has an existing thread
		endpoint = `channels/${channel_id}/messages/${target_id}`;
		let threadExists, threadID;
		try {
			const resp = await DiscordAPIRequest(endpoint, {
				method: "GET",
			}, botAccess, discordBotToken);
			const payload = await resp.json();
			if (payload.thread == null) threadExists = false;
			else {
				threadExists = true;
				threadID = payload.thread.id;
			}
		} catch (err) {
			console.error(err);
		}
		// Discord currently allows 1 thread per post, so we must write new ticket creation notifications on the existing thread, if any.
		if (threadExists) {
			//Write to the same thread
			endpoint = `channels/${threadID}/messages`;
			const threadMessage = {
				content: `A ticket ${workItemID} has been created by <@${creatorID}>!`,
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
			let threadID;
			try {
				const resp = await DiscordAPIRequest(endpoint, {
					method: "POST",
					body: threadData,
				}, botAccess, discordBotToken);
				const payload = await resp.json();
				threadID = payload.id;
			} catch (err) {
				console.error(err);
			}
			// Writing the message to the existing or newly created thread
			endpoint = `channels/${threadID}/messages`;
			const publicMessageInThread = {
				content: `A ticket ${workItemID} has been created by <@${creatorID}>!`,
			};
			try {
				const resp = await DiscordAPIRequest(endpoint, {
					method: "POST",
					body: publicMessageInThread,
				}, botAccess, discordBotToken);
			} catch (err) {
				console.error(err);
			}
		}
		// Embedding for displaying the created ticket in the Ephemeral Message (Ephemeral Follow Up Message)
		const embed = {
			title: workItemID,
			color: 0x00ff00,
			fields: [{
				name: "Title",
				value: workTitle,
			}, {
				name: "Description",
				value: workDescription,
			}, {
				name: "Parts",
				value: workPartName,
			}, {
				name: "Owner",
				value: workOwnerDisplayName,
			}, {
				name: "Stage",
				value: workStage.name,
			}, ],
			timestamp: new Date(),
		};
		endpoint = `/webhooks/${application_id}/${token}`;
		const ephemeralTicketReviewMessage = {
			content: "DevRev Ticket",
			embeds: [embed],
			components: [{
				type: 1,
				components: [{
					type: 2,
					label: "Checkout Ticket?",
					style: 5,
					url: "https://app.dev.devrev-eng.ai/flow-test/works/" + workItemID,
				}, ],
			}, ],
		};
		try {
			const resp = await DiscordAPIRequest(endpoint, {
				method: "POST",
				body: ephemeralTicketReviewMessage,
			}, bearerAccess, discordOAuthToken);
		} catch (err) {
			console.error(err);
		}
	}
}