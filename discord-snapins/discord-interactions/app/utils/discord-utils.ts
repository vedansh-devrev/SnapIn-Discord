import fetch from "node-fetch";

export async function DiscordAPIRequest(endpoint, options, DISCORD_AUTH) {
	// Append endpoint to root API URL
	const url = 'https://discord.com/api/' + endpoint;
	// Stringify payloads
	if (options.body) options.body = JSON.stringify(options.body);
	// Use node-fetch to make requests
	const res = await fetch(url, {
		headers: {
			Authorization: DISCORD_AUTH,
			'Content-Type': 'application/json; charset=UTF-8',
		},
		...options
	});
	// throw API errors
	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(JSON.stringify(errorData));
	}
	// return original response
	return await res.json();
}

export async function createDiscordThreadOnMessage(threadData, channelID, messageID, BOT_ACCESS) {
	let threadObject;
	try {
		threadObject = await DiscordAPIRequest(`channels/${channelID}/messages/${messageID}/threads`, {
			method: "POST",
			body: threadData,
		}, BOT_ACCESS);
	} catch (err) {
		console.error(err);
	}
	return threadObject;
}

export async function createPublicDiscordThreadWithoutMessage(threadData, channelID, BOT_ACCESS) {
	let threadObject;
	try {
		threadObject = await DiscordAPIRequest(`/channels/${channelID}/threads`, {
			method: "POST",
			body: threadData,
		}, BOT_ACCESS);
	} catch (err) {
		console.error(err);
	}
	return threadObject;
}

export async function writeToDiscordThread(threadID, messageBody, BOT_ACCESS) {
	try {
		await DiscordAPIRequest(`channels/${threadID}/messages`, {
			method: "POST",
			body: messageBody,
		}, BOT_ACCESS);
	} catch (err) {
		console.error(err);
	}
}

export async function getDiscordMessageObject(channelID, messageID, BOT_ACCESS) {
	let messageObject;
	try {
		messageObject = await DiscordAPIRequest(`channels/${channelID}/messages/${messageID}`, {
			method: "GET",
		}, BOT_ACCESS);
	} catch (err) {
		console.error(err);
	}
	return messageObject;
}

// By default, the first follow up message to Discord interaction will be ephemeral.
// (flag : 64 is defined in Blubox discord apphook)
export async function sendDiscordFollowUpMessage(messageBody, APPLICATION_ID, INTERACTION_TOKEN, BEARER_ACCESS) {
	try {
		await DiscordAPIRequest(`/webhooks/${APPLICATION_ID}/${INTERACTION_TOKEN}`, {
			method: "POST",
			body: messageBody,
		}, BEARER_ACCESS);
	} catch (err) {
		console.error(err);
	}
}
