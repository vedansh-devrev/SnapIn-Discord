import fetch from 'node-fetch';

export async function DiscordAPIRequest(endpoint, options, TOKEN_TYPE, DISCORD_TOKEN) {
	// Append endpoint to root API URL
	const url = 'https://discord.com/api/v10/' + endpoint;
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
	return res;
}

export async function DevrevAPIRequest(endpoint, options, DEVREV_PAT) {
	// append endpoint to root API URL
	const url = 'https://api.dev.devrev-eng.ai/' + endpoint;
	// Stringify payloads
	if (options.body) options.body = JSON.stringify(options.body);
	// Use node-fetch to make requests
	const res = await fetch(url, {
		headers: {
			Authorization: `${DEVREV_PAT}`,
			'Content-Type': 'application/json; charset=UTF-8',
		},
		...options
	});
	// throw API errors
	if (!res.ok) {
		const data = await res.json();
		throw new Error(JSON.stringify(data));
	}
	return await res.json();
}

export async function createDiscordTag(tagName, DEVREV_PAT) {
	// Create a Discord Tag
	const tag_data = {
		name: tagName,
	}
	let endpoint = `tags.create`;
	let tagID;
	try {
		const resp = await DevrevAPIRequest(endpoint, {
			method: "POST",
			body: tag_data,
		}, DEVREV_PAT);
		tagID = resp.tag.id;
	} catch (err) {
		console.error(err);
	}
	return tagID;
}

export async function checkIfTagExists(tagName, DEVREV_PAT) {
	let endpoint = `tags.list`
	let nextCursor, tagsArray, tagID;
	// First Iteration Fetch
	try {
		const resp = await DevrevAPIRequest(endpoint, {
			method: "GET",
		}, DEVREV_PAT);
		nextCursor = resp.next_cursor;
		tagsArray = resp.tags;
	} catch (err) {
		console.error(err);
	}
	let tagExists = false;
	for (const tag of tagsArray) {
		if (tag.name === tagName) {
			tagID = tag.id;
			tagExists = true;
			break;
		}
	}
	// Fetching all possible iterations
	if (!tagExists) {
		while (nextCursor != undefined) {
			endpoint = `tags.list?cursor=${nextCursor}`;
			try {
				const resp = await DevrevAPIRequest(endpoint, {
					method: "GET",
				}, DEVREV_PAT);
				nextCursor = resp.next_cursor;
				tagsArray = resp.tags;
			} catch (err) {
				console.error(err);
			}
			for (const tag of tagsArray) {
				if (tag.name === tagName) {
					tagID = tag.id;
					tagExists = true;
					break;
				}
			}
			if (tagExists == true)
				break;
		}
	}
	return [tagExists, tagID];
}

export async function getWorkItemFromDisplayID(workDisplayID, workType , devrevPATToken)
{
	let endpoint = `works.list?type=${workType}`
	let nextCursor, worksArray;
	// // First Iteration Fetch
	try {
		const resp = await DevrevAPIRequest(endpoint, {
			method: "GET",
		}, devrevPATToken);
		nextCursor = resp.next_cursor;
		worksArray = resp.works;
	} catch (err) {
		console.error(err);
	}
	// workObject is the final work-item which is sent (if it exists for a given work display ID)
	let workExists = false, workObject;
	for (const work of worksArray) {
		if (work.display_id === workDisplayID) {
			workObject = work;
			workExists = true;
			break;
		}
	}
	// Fetching all possible iterations
	if (!workExists) {
		while (nextCursor != undefined) {
			endpoint = `works.list?cursor=${nextCursor}&type=${workType}`;
			try {
				const resp = await DevrevAPIRequest(endpoint, {
					method: "GET",
				}, devrevPATToken);
				nextCursor = resp.next_cursor;
				worksArray = resp.works;
			} catch (err) {
				console.error(err);
			}
			for (const work of worksArray) {
				if (work.display_id === workDisplayID) {
					workObject = work;
					workExists = true;
					break;
				}
			}
			if (workExists == true)
				break;
		}
	}
	return [workExists, workObject];
}