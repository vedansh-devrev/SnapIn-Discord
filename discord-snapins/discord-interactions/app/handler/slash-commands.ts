import {
	DevrevAPIRequest,
	DiscordAPIRequest,
	checkIfDevrevTagExists,
	createDevrevTag,
	getDevrevWorkItemFromDisplayID
} from "../utils"

// Defining Access Type
const BEARER_ACCESS = "Bearer";
const BOT_ACCESS = "Bot";
// DevRev Tag and Discord Thread for created work-item
const TAG_NAME = "discord-ticket";
const THREAD_NAME = "[devrev-tickets]"

export async function HandleSlashCommandInteractions(event, name, discordOAuthToken, discordBotToken, devrevPATToken) {
	const {
		data,
		token,
		application_id,
		member,
		channel_id,
	} = event.payload;
	// Slash Command for ticket creation
	if (name === 'create-ticket') {
		const { options } = data;
		// Fetch Tag DON ID for TAG_NAME
		let [tagExists, tagDON] = await checkIfDevrevTagExists(TAG_NAME, devrevPATToken);
		if (!tagExists)
			tagDON = await createDevrevTag(TAG_NAME, devrevPATToken);
		// Create DevRev Ticket and Get Response Payload
		const work_data = {
			applies_to_part: event.input_data.global_values.part_id,
			owned_by: [event.input_data.global_values.owner_id],
			stage: {
				name: options[2].value,
			},
			tags: [{
				id: tagDON,
			}],
			title: options[0].value,
			body: options[1].value,
			type: `ticket`,
		};
		let workTitle, workItemID, workOwnerDisplayName, workPartName, workStage, workDescription;
		try {
			const resp = await DevrevAPIRequest(`works.create`, {
				method: "POST",
				body: work_data,
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
		// API endpoint to create a new thread (without a message)
		// type : 11 specifies a Public Thread
		let threadID;
		try {
			const resp = await DiscordAPIRequest(`/channels/${channel_id}/threads`, {
				method: "POST",
				body: {
					name: THREAD_NAME,
					type: 11,
				},
			}, BOT_ACCESS, discordBotToken);
			threadID = resp.id;
		} catch (err) {
			console.error(err);
		}
		// API endpoint to write to that thread
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
				},],
				timestamp: new Date(),
			}],
			components: [{
				type: 1,
				components: [{
					type: 2,
					label: "Checkout Ticket?",
					style: 5,
					url: "https://app.dev.devrev-eng.ai/flow-test/works/" + workItemID,
				},],
			},],
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
	// Slash Command to get DevRev ticket info
	if (name == 'devrev-ticket') {
		const { options } = data;
		const ticketDisplayID = "TKT-" + options[0].value;
		// Using TKT-abc ID to fetch the work item
		const [ticketExists, ticketData] = await getDevrevWorkItemFromDisplayID(ticketDisplayID, "ticket", devrevPATToken);
		if (ticketExists) {
			let ticketOwnerStr = "";
			for (let owner of ticketData.owned_by)
				ticketOwnerStr += owner.display_name + " ";
			// Display an ephemeral Ticket Summary
			const ephemeralTicketReviewMessage = {
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
			};
			try {
				await DiscordAPIRequest(`/webhooks/${application_id}/${token}`, {
					method: "POST",
					body: ephemeralTicketReviewMessage,
				}, BEARER_ACCESS, discordOAuthToken);
			} catch (err) {
				console.error(err);
			}
		} else {
			// Display ephemeral message that such work item does not exist
			try {
				await DiscordAPIRequest(`/webhooks/${application_id}/${token}`, {
					method: "POST",
					body: {
						content: `There is no DevRev ticket with id ${ticketDisplayID}`,
					},
				}, BEARER_ACCESS, discordOAuthToken);
			} catch (err) {
				console.error(err);
			}
		}
	}
	// Slash Command to get DevRev Issue info
	if (name == 'devrev-issue') {
		const { options } = data;
		const issueDisplayID = "ISS-" + options[0].value;
		// Using TKT-abc ID to fetch the work item
		const [issueExists, issueData] = await getDevrevWorkItemFromDisplayID(issueDisplayID, "issue", devrevPATToken);
		if (issueExists) {
			let issueOwnerStr = "";
			for (let owner of issueData.owned_by)
				issueOwnerStr += owner.display_name + " ";
			// Display an ephemeral Issue Summary
			const ephemeralIssueReviewMessage = {
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
			};
			try {
				await DiscordAPIRequest(`/webhooks/${application_id}/${token}`, {
					method: "POST",
					body: ephemeralIssueReviewMessage,
				}, BEARER_ACCESS, discordOAuthToken);
			} catch (err) {
				console.error(err);
			}
		} else {
			// Display ephemeral message that such work item does not exist
			try {
				await DiscordAPIRequest(`/webhooks/${application_id}/${token}`, {
					method: "POST",
					body: {
						content: `There is no DevRev issue with id ${issueDisplayID}`,
					},
				}, BEARER_ACCESS, discordOAuthToken);
			} catch (err) {
				console.error(err);
			}
		}
	}
}
