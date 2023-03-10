import {
	writeToDiscordThread,
	createPublicDiscordThreadWithoutMessage,
	sendDiscordFollowUpMessage,
} from "../utils/discord-utils"

import {
	checkIfDevrevTagExists,
	createDevrevTag,
	getDevrevWorkItemFromDisplayID,
	createDevrevWorkItem
} from "../utils/devrev-utils"

// Defining Access Type
const BEARER_ACCESS = "Bearer";
const BOT_ACCESS = "Bot";
// DevRev Tag and Discord Thread for created work-item
const TAG_NAME = "discord-ticket";
const THREAD_NAME = "[devrev-tickets]"

export async function HandleSlashCommandInteractions(event, name, discordOAuthToken, discordBotToken, devrevPATToken) {
	const {
		payload: {
			data: { options },
			token,
			application_id,
			member,
			channel_id,
		},
		input_data: {
			global_values: { part_id, owner_id },
		}
	} = event;
	// Slash Command for ticket creation
	if (name === 'create-ticket') {
		// Fetch Tag DON ID for TAG_NAME
		let [tagExists, tagDON] = await checkIfDevrevTagExists(TAG_NAME, devrevPATToken);
		if (!tagExists)
			tagDON = await createDevrevTag(TAG_NAME, devrevPATToken);
		// Create DevRev Ticket and Get Work Object
		const workItemCreated = await createDevrevWorkItem({
			applies_to_part: part_id,
			owned_by: [owner_id],
			stage: {
				name: options[2].value,
			},
			tags: [{
				id: tagDON,
			}],
			title: options[0].value,
			body: options[1].value,
			type: `ticket`,
		}, devrevPATToken);
		const thread = await createPublicDiscordThreadWithoutMessage(THREAD_NAME, channel_id, BOT_ACCESS, discordBotToken);
		await writeToDiscordThread(thread.id, {
			content: `A ticket ${workItemCreated.work.display_id} has been created by <@${member.user.id}>!`,
		}, BOT_ACCESS, discordBotToken);
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
				},],
				timestamp: new Date(),
			}],
			components: [{
				type: 1,
				components: [{
					type: 2,
					label: "Checkout Ticket?",
					style: 5,
					url: "https://app.dev.devrev-eng.ai/flow-test/works/" + workItemCreated.work.display_id,
				},],
			},],
		}, application_id, token, BEARER_ACCESS, discordOAuthToken);
	}
	// Slash Command to get DevRev ticket info
	if (name == 'devrev-ticket') {
		const ticketDisplayID = "TKT-" + options[0].value;
		// Using TKT-abc ID to fetch the work item
		const [ticketExists, ticketData] = await getDevrevWorkItemFromDisplayID(ticketDisplayID, "ticket", devrevPATToken);
		if (ticketExists) {
			let ticketOwnerStr = "";
			for (let owner of ticketData.owned_by)
				ticketOwnerStr += owner.display_name + " ";
			await sendDiscordFollowUpMessage({
				content: "DevRev Ticket",
				embeds: [{
					title: ticketData.display_id,
					color: 0x00ff00,
					fields: [{
						name: "Title",
						value: ticketData.title,
					}, {
						name: "Description",
						value: ticketData.body,
					}, {
						name: "Parts",
						value: ticketData.applies_to_part.display_id,
					}, {
						name: "Owner",
						value: ticketOwnerStr,
					}, {
						name: "Stage",
						value: ticketData.stage.name,
					}, {
						name: "Severity",
						value: ticketData.severity,
					},],
				}],
				components: [{
					type: 1,
					components: [{
						type: 2,
						label: "Checkout Ticket?",
						style: 5,
						url: "https://app.dev.devrev-eng.ai/flow-test/works/" + ticketData.display_id,
					},],
				},],
			}, application_id, token, BEARER_ACCESS, discordOAuthToken);
		} else {
			await sendDiscordFollowUpMessage({
				content: `There is no DevRev ticket ${ticketDisplayID}`,
			}, application_id, token, BEARER_ACCESS, discordOAuthToken);
		}
	}
	// Slash Command to get DevRev Issue info
	if (name == 'devrev-issue') {
		const issueDisplayID = "ISS-" + options[0].value;
		// Using TKT-abc ID to fetch the work item
		const [issueExists, issueData] = await getDevrevWorkItemFromDisplayID(issueDisplayID, "issue", devrevPATToken);
		if (issueExists) {
			let issueOwnerStr = "";
			for (let owner of issueData.owned_by)
				issueOwnerStr += owner.display_name + " ";
			await sendDiscordFollowUpMessage({
				content: "DevRev Issue",
				embeds: [{
					title: issueData.display_id,
					color: 0x00ff00,
					fields: [{
						name: "Title",
						value: issueData.title,
					}, {
						name: "Description",
						value: issueData.body,
					}, {
						name: "Parts",
						value: issueData.applies_to_part.display_id,
					}, {
						name: "Owner",
						value: issueOwnerStr,
					}, {
						name: "Stage",
						value: issueData.stage.name,
					}, {
						name: "Priority",
						value: issueData.priority,
					},],
				}],
				components: [{
					type: 1,
					components: [{
						type: 2,
						label: "Checkout Issue?",
						style: 5,
						url: "https://app.dev.devrev-eng.ai/flow-test/works/" + issueData.display_id,
					},],
				},],
			}, application_id, token, BEARER_ACCESS, discordOAuthToken);
		} else {
			await sendDiscordFollowUpMessage({
				content: `There is no DevRev issue with id ${issueDisplayID}`,
			}, application_id, token, BEARER_ACCESS, discordOAuthToken);
		}
	}
}
