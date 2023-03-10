import {
	DevrevAPIRequest,
	DiscordAPIRequest,
	checkIfDevrevTagExists,
	createDevrevTag
} from "../utils"

// Defining Access Type
const BEARER_ACCESS = "Bearer";
const BOT_ACCESS = "Bot";
// DevRev Tag and Discord Thread for created work-item
const TAG_NAME = "discord-ticket";
const THREAD_NAME = "[devrev-tickets]"

export async function HandleMessageCommandInteractions(event, name, discordOAuthToken, discordBotToken, devrevPATToken) {
	const {
		data,
		token,
		application_id,
		member,
		channel_id,
		guild_id,
	} = event.payload;
	// Message Command for ticket creation
	if (name == "Create Ticket") {
		const {	target_id } = data;
		// Fetch Tag DON ID for TAG_NAME
		let [tagExists, tagDON] = await checkIfDevrevTagExists(TAG_NAME, devrevPATToken);
		if (!tagExists)
			tagDON = await createDevrevTag(TAG_NAME, devrevPATToken);
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
			title: `[via Discord] Ticket on ${target_id}`,
			body: `This ticket is created on Discord thread from this [message](${messageLink}).\n[Content] : ` + data.resolved.messages[target_id].content,
			type: `ticket`,
		};
		let workTitle, workItemID, workOwnerDisplayName, workPartName, workStage, workDescription;
		try {
			const resp = await DevrevAPIRequest(`works.create`, {
				method: "POST",
				body: workData,
			}, devrevPATToken);
			// Work Data for review message
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
		let threadExists, threadID;
		try {
			const resp = await DiscordAPIRequest(`channels/${channel_id}/messages/${target_id}`, {
				method: "GET",
			}, BOT_ACCESS, discordBotToken);
			if (resp.thread == null) threadExists = false;
			else [threadExists, threadID] = [true, resp.thread.id];
		} catch (err) {
			console.error(err);
		}
		// Discord currently allows 1 thread per post, so we must write new ticket creation notifications on the existing thread, if any.
		if (threadExists) {
			//Write to the same thread
			try {
				await DiscordAPIRequest(`channels/${threadID}/messages`, {
					method: "POST",
					body: {
						content: `A ticket ${workItemID} has been created by <@${member.user.id}>!`,
					},
				}, BOT_ACCESS, discordBotToken);
			} catch (err) {
				console.error(err);
			}
		} else {
			// Creating a new thread from message
			let threadID;
			try {
				const resp = await DiscordAPIRequest(`channels/${channel_id}/messages/${target_id}/threads`, {
					method: "POST",
					body: {
						name: THREAD_NAME,
					},
				}, BOT_ACCESS, discordBotToken);
				threadID = resp.id;
			} catch (err) {
				console.error(err);
			}
			// Writing the message to the existing or newly created thread
			try {
				await DiscordAPIRequest(`channels/${threadID}/messages`, {
					method: "POST",
					body: {
						content: `A ticket ${workItemID} has been created by <@${member.user.id}>!`,
					},
				}, BOT_ACCESS, discordBotToken);
			} catch (err) {
				console.error(err);
			}
		}
		// Embedding for displaying the created ticket in the Ephemeral Message (Ephemeral Follow Up Message)
		const ephemeralTicketReviewMessage = {
			content: "DevRev Ticket",
			embeds: [{
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
			}],
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
			await DiscordAPIRequest(`/webhooks/${application_id}/${token}`, {
				method: "POST",
				body: ephemeralTicketReviewMessage,
			}, BEARER_ACCESS, discordOAuthToken);
		} catch (err) {
			console.error(err);
		}
	}
}
