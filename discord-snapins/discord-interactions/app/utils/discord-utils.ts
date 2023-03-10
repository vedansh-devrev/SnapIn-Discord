import fetch from "node-fetch";

export async function DiscordAPIRequest(endpoint, options, TOKEN_TYPE, DISCORD_TOKEN) {
	// Append endpoint to root API URL
	const url = 'https://discord.com/api/' + endpoint;
	// Stringify payloads
	if (options.body) options.body = JSON.stringify(options.body);
	// Use node-fetch to make requests
	const res = await fetch(url, {
		headers: {
			Authorization: `${TOKEN_TYPE} ${DISCORD_TOKEN}`,
			'Content-Type': 'application/json; charset=UTF-8',
		},
		...options
	});
	// throw API errors
	if (!res.ok) {
		const data = await res.json();
		throw new Error(JSON.stringify(data));
	}
	// return original response
	return await res.json();
}

export async function createDiscordThreadOnMessage(threadData, channelID, messageID, BOT_ACCESS, DISCORD_BOT_TOKEN) {
	let threadObject;
	try {
		threadObject = await DiscordAPIRequest(`channels/${channelID}/messages/${messageID}/threads`, {
			method: "POST",
			body: threadData,
		}, BOT_ACCESS, DISCORD_BOT_TOKEN);
	} catch (err) {
		console.error(err);
	}
	return threadObject;
}

export async function createPublicDiscordThreadWithoutMessage(threadName, channelID, BOT_ACCESS, DISCORD_BOT_TOKEN) {
	// API endpoint to create a new thread (without a message)
	// type : 11 specifies a Public Thread	
	let threadObject;
	try {
		threadObject = await DiscordAPIRequest(`/channels/${channelID}/threads`, {
			method: "POST",
			body: {
				name: threadName,
				type: 11,
			},
		}, BOT_ACCESS, DISCORD_BOT_TOKEN);
	} catch (err) {
		console.error(err);
	}
	return threadObject;
}

export async function writeToDiscordThread(threadID, messageBody, BOT_ACCESS, DISCORD_BOT_TOKEN) {
	try {
		await DiscordAPIRequest(`channels/${threadID}/messages`, {
			method: "POST",
			body: messageBody,
		}, BOT_ACCESS, DISCORD_BOT_TOKEN);
	} catch (err) {
		console.error(err);
	}
}

export async function sendDiscordFollowUpMessage(messageBody, APPLICATION_ID, INTERACTION_TOKEN, BEARER_ACCESS, DISCORD_OAUTH_TOKEN) {
	try {
		await DiscordAPIRequest(`/webhooks/${APPLICATION_ID}/${INTERACTION_TOKEN}`, {
			method: "POST",
			body: messageBody,
		}, BEARER_ACCESS, DISCORD_OAUTH_TOKEN);
	} catch (err) {
		console.error(err);
	}
}

export async function getDiscordMessageObject(channelID, messageID, BOT_ACCESS, DISCORD_BOT_TOKEN) {
	let messageObject;
	try {
		messageObject = await DiscordAPIRequest(`channels/${channelID}/messages/${messageID}`, {
			method: "GET",
		}, BOT_ACCESS, DISCORD_BOT_TOKEN);
	} catch (err) {
		console.error(err);
	}
	return messageObject;
}
