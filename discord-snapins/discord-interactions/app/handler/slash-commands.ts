import {
	DevrevAPIRequest,
	DiscordAPIRequest,
	checkIfTagExists,
	createDiscordTag,
    getWorkItemFromDisplayID
} from "../utils"
export async function HandleSlashCommandInteractions(event, name, discordOAuthToken, discordBotToken, devrevPATToken) {
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
	// Slash Command for ticket creation
	if (name === 'create-ticket') {
		const {
			options
		} = data;
		const ticketTitle = options[0].value;
		const ticketDescription = options[1].value;
		const ticketStage = options[2].value;
		const creatorID = member.user.id;
		const tagName = "discord-ticket";
		// Fetch `Discord` Tag DON ID
		let [tagExists, tagDON] = await checkIfTagExists(tagName, devrevPATToken);
		if (!tagExists)
			tagDON = await createDiscordTag(tagName, devrevPATToken);
		// Create DevRev Ticket and Get Response Payload
		const work_data = {
			applies_to_part: event.input_data.global_values.part_id,
			owned_by: [event.input_data.global_values.owner_id],
			stage: {
				name: ticketStage,
			},
			tags: [{
				id: tagDON,
			}],
			title: ticketTitle,
			body: ticketDescription,
			type: `ticket`,
		};
		let endpoint = `works.create`;
		let workTitle, workItemID, workOwnerDisplayName, workPartName, workStage, workDescription;
		try {
			const resp = await DevrevAPIRequest(endpoint, {
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
		const threadData = {
			name: "[devrev-tickets]",
			type: 11,
		};
		endpoint = `/channels/${channel_id}/threads`;
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
		// API endpoint to write to that thread
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
		// First follow-up Message 
		endpoint = `/webhooks/${application_id}/${token}`;
		const publicThreadInitiationMessage = {
			content: `Discussion thread initiated for ticket ${workItemID}`,
		};
		try {
			const resp = await DiscordAPIRequest(endpoint, {
				method: "POST",
				body: publicThreadInitiationMessage,
			}, bearerAccess, discordOAuthToken);
		} catch (err) {
			console.error(err);
		}
		// Embedding for displaying the created ticket in the Ephemeral Message (Second Follow Up Message)
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
				value: workStage,
			}, ],
			timestamp: new Date(),
		};
		endpoint = `/webhooks/${application_id}/${token}`;
		const ephemeralTicketReviewMessage = {
			content: "DevRev Ticket",
			flags: 64,
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
	// Slash Command to get DevRev ticket info
	if (name == 'devrev-ticket') {
        const { options } = data;
        const ticketDisplayID = "TKT-" + options.value; 
        // Using TKT-abc ID to fetch the work item
        const [ ticketExists, ticketData ] = await getWorkItemFromDisplayID(ticketDisplayID, "ticket" , devrevPATToken);
        if(ticketExists)
        {
            // make follow up
            // delete follow up
            // give ephemeral view or permanent view (ask shashank)
        }
        else
        {
            // make follow up
            // delete follow up
            // give ephemeral notice that such work item does not exist
        }
	}
	// Slash Command to get DevRev Issue info
	if (name == 'devrev-issue') {
        const { options } = data;
        const issueDisplayID = "ISS-" + options.value; 
        // Using TKT-abc ID to fetch the work item
        const [ issueExists, issueData ] = await getWorkItemFromDisplayID(issueDisplayID, "issue" , devrevPATToken);
        if(issueExists)
        {
            // make follow up
            // delete follow up
            // give ephemeral view or permanent view (ask shashank)
        }
        else
        {
            // make follow up
            // delete follow up
            // give ephemeral notice that such work item does not exist
        }
	}
}