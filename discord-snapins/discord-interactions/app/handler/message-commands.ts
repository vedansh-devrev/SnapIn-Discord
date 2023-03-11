import {
	writeToDiscordThread,
	getDiscordMessageObject,
	createDiscordThreadOnMessage,
	sendDiscordFollowUpMessage
} from "../utils/discord-utils"

import {
	checkIfDevrevTagExists,
	createDevrevTag,
	createDevrevWorkItem,
} from "../utils/devrev-utils"

// DevRev Tag and Discord Thread for created work-item
const TAG_NAME = "discord-ticket";
const THREAD_NAME = "[devrev-tickets]"

export async function HandleMessageCommandInteractions(event, name, BEARER_ACCESS, BOT_ACCESS, DEVREV_PAT) {
	const {
		payload : {
		data : {
			target_id,
			resolved : {
				messages,
			},
		},
		token,
		application_id,
		member,
		channel_id,
		guild_id,
		},
		input_data: {
			global_values: { part_id, owner_id, stage },
		}
	} = event;
	// Message Command for ticket creation
	if (name == "Create Ticket") {
		// Fetch Tag DON ID for TAG_NAME
		let [tagExists, tagDON] = await checkIfDevrevTagExists(TAG_NAME, DEVREV_PAT);
		if (!tagExists)
			tagDON = (await createDevrevTag({
				name: TAG_NAME,
			}, DEVREV_PAT)).tag.id;
		// Create DevRev Ticket and Get Work Object
		let messageLink = `https://discord.com/channels/${guild_id}/${channel_id}/${target_id}`;
		const workItemCreated = await createDevrevWorkItem({
			applies_to_part: part_id,
			owned_by: [owner_id],
			stage: {
				name: stage,
			},
			tags: [{
				id: tagDON,
			}],
			title: `[via Discord] Ticket on ${target_id}`,
			body: `This ticket is created on Discord thread from this [message](${messageLink}).\n[Content] : ` + messages[target_id].content,
			type: `ticket`,
		}, DEVREV_PAT);
		// Retrieve the Message Object to check if it has an existing thread
		let threadExists, threadID;
		const messageObject = await getDiscordMessageObject(channel_id, target_id, BOT_ACCESS);
		
		if (messageObject.thread == null) threadExists = false;
		else [threadExists, threadID] = [true, messageObject.thread.id];
		// Discord currently allows 1 thread per post, so we must write new ticket creation notifications on the existing thread, if any.
		if (messageObject.thread) {
			await writeToDiscordThread(messageObject.thread.id, {
				content: `A ticket ${workItemCreated.work.display_id} has been created by <@${member.user.id}>!`,
			}, BOT_ACCESS);
		} else {
			const thread = await createDiscordThreadOnMessage({
				name: THREAD_NAME,
			}, channel_id, target_id, BOT_ACCESS);
			await writeToDiscordThread(thread.id, {
				content: `A ticket ${workItemCreated.work.display_id} has been created by <@${member.user.id}>!`,
			}, BOT_ACCESS);
		}
		// Embedding for displaying the created ticket in the Ephemeral Message (Ephemeral Follow Up Message)
		await sendDiscordFollowUpMessage({
			content: "DevRev Ticket",
			embeds: [{
				title: workItemCreated.work.display_id,
				color: 0x00ff00,
				fields: [{
					name: "Title",
					value: workItemCreated.work.title,
				}, {
					name: "Description",
					value: workItemCreated.work.body,
				}, {
					name: "Parts",
					value: workItemCreated.work.applies_to_part.name,
				}, {
					name: "Owner",
					value: workItemCreated.work.created_by.display_name,
				}, {
					name: "Stage",
					value: workItemCreated.work.stage.name,
				}, ],
				timestamp: new Date(),
			}],
			components: [{
				type: 1,
				components: [{
					type: 2,
					label: "Checkout Ticket?",
					style: 5,
					url: "https://app.dev.devrev-eng.ai/flow-test/works/" + workItemCreated.work.display_id,
				}, ],
			}, ],
		}, application_id, token, BEARER_ACCESS);
	}
}
