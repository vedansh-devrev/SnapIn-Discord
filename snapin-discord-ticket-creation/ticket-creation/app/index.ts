import fetch from "node-fetch"
import {
	AutomationEvent,
	AutomationInterface,
	AutomationMetadata
} from "../sdk"
import {
	DiscordAPIRequest,
	DevrevAPIRequest,
	SendInteractionResponse,
	OpenAPISummarizer,
  } from "./utils.js";

// For inter-interaction variable exchange
let message_id;

export class App implements AutomationInterface {

	GetMetadata(): AutomationMetadata {
		return {
			name: "E2E SnapIn for Ticket Creation on Discord",
			version: "0.1"
		}
	}

	async Run(events: AutomationEvent[]) {
		console.log("E2E SnapIn for Ticket Creation on Discord");
		await this.EventListener(events[0]);
	}

	async EventListener(event: AutomationEvent) {
		console.log(`Incoming payload from discord interactions looks like : `, JSON.stringify(event.payload));

		// Refer to https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-structure
		// For details on interaction payload
		const { type, id, token, data, member, channel_id } = event.payload;

		// HANDLING PING PONG INTERACTION
		if (type === 1) {
			SendInteractionResponse({
				type : 1
			},
			id, token);
		}
	  
		// HANDLING APPLICATION COMMANDS INTERACTION
		if (type === 2)
		{
			const { name, target_id } = data;
			message_id = target_id;
			const message_content = data.resolved.messages[target_id].content;
			const headingFromOPENAI = await OpenAPISummarizer(message_content, 10);
			 console.log(headingFromOPENAI)
			if (name === "Create Ticket") {
			  SendInteractionResponse({
				type: 9, //POPUP_TYPE RESPONSE
				data: {
				  title: "Ticket Creation Panel",
				  custom_id: "ticket_creation",
				  components: [
					{
					  type: 1,
					  components: [
						{
						  type: 4,
						  custom_id: "ticket_title",
						  label: "Title",
						  style: 1,
						  min_length: 1,
						  max_length: 4000,
						  placeholder: "[via discord] " + headingFromOPENAI,
						  required: true,
						},
					  ],
					},
					{
					  type: 1,
					  components: [
						{
						  type: 4,
						  custom_id: "ticket_description",
						  label: "Description",
						  style: 2,
						  min_length: 1,
						  max_length: 4000,
						  placeholder:
							"This ticket is created from discord... <message_interacted_with>... <thread_link>...",
						  required: true,
						},
					  ],
					},
				  ],
				},
			  }, id, token);
			}
		}

		// HANDLING MODAL SUBMIT INTERACTION
		if (type === 5) {
			const { custom_id, components } = data;
			// Checking the Custom_ID from Modal Submission
			if (custom_id === "ticket_creation") {
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
				tags: [{ id: DISCORD_TAG }],
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
			  endpoint = `channels/${channel_id}/messages/${message_id}`;
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
				console.log("ids look like, ", channel_id, " and ", message_id);
				endpoint = `channels/${channel_id}/messages/${message_id}/threads`;
		
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
				fields: [
				  {
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
		
			  // Ephemeral message to main channel as a response to the ticket creation
			  SendInteractionResponse({
				type: 4,
				data: {
				  content: "Your ticket has been created with these default fields",
				  embeds: [embed],
				  flags: 64, // set the message to ephemeral
				  components: [
					{
					  type: 1,
					  components: [
						{
						  type: 2,
						  label: "Checkout Ticket?",
						  style: 5,
						  url:
							"https://app.dev.devrev-eng.ai/flow-test/works/" +	work_item_id,
						},
					  ],
					},
				  ],
				},
			  }, id, token);
			}
		  }
	}
}
