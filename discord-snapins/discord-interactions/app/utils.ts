import fetch from "node-fetch";



// Discord Util Functions
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

// Devrev Util Functions
export async function DevrevAPIRequest(endpoint, options, DEVREV_PAT) {
	// Append endpoint to root DevRev API URL
	const url = 'https://api.dev.devrev-eng.ai/' + endpoint;
	// Stringify payloads
	if (options.body) options.body = JSON.stringify(options.body);
	// Use node-fetch to make requests
	const res = await fetch(url, {
		headers: {
			Authorization: DEVREV_PAT,
			'Content-Type': 'application/json; charset=UTF-8',
		},
		...options
	})
	// Throw API errors
	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(JSON.stringify(errorData));
	}
	return await res.json();
}

export async function createDevrevTag(tagName, DEVREV_PAT) {
	// Create a Discord Tag
	const tagData = {
		name: tagName,
	}
	try {
		const resp = await DevrevAPIRequest(`tags.create`, {
			method: "POST",
			body: tagData,
		}, DEVREV_PAT);
		return resp.tag.id;
	} catch (err) {
		console.error(err);
	}
}

export async function checkIfDevrevTagExists(tagName, DEVREV_PAT) {
	let tagID, tagExists = false;
	// First Iteration Fetch
	let [tagsArray, nextCursor] = await getDevrevTagsList(undefined, DEVREV_PAT);
	if (tagsArray) {
		for (let tag of tagsArray as any[]) {
			if (tag.name == tagName) {
				[tagExists, tagID] = [true, tag.id];
				break;
			}
		}
	}

	if (tagExists)
		return [tagExists, tagID];
	// Fetching all possible iterations
	while (nextCursor != undefined && !tagExists) {
		[tagsArray, nextCursor] = await getDevrevTagsList(nextCursor, DEVREV_PAT);
		for (let tag of tagsArray) {
			if (tag.name == tagName) {
				[tagExists, tagID] = [true, tag.id];
				break;
			}
		}
	}
	return [tagExists, tagID];
}

export async function getDevrevWorkItemFromDisplayID(workDisplayID, workType, DEVREV_PAT) {
	let workObject, workExists = false;
	// First Iteration Fetch
	let [worksArray, nextCursor] = await getDevrevWorksList(workType, undefined, DEVREV_PAT);
	for (let work of worksArray) {
		if (work.display_id == workDisplayID) {
			[workExists, workObject] = [true, work];
			break;
		}
	}
	// Fetching all possible iterations
	if (workExists)
		return [workExists, workObject];
	while (nextCursor != undefined && !workExists) {
		[worksArray, nextCursor] = await getDevrevWorksList(workType, nextCursor, DEVREV_PAT);
		for (let work of worksArray) {
			if (work.display_id == workDisplayID) {
				[workExists, workObject] = [true, work];
				break;
			}
		}
	}
	return [workExists, workObject];
}

export async function getDevrevTagsList(nextCursor, DEVREV_PAT) {
	let resp, endpoint = (!nextCursor) ? `tags.list` : `tags.list?cursor=${nextCursor}`;
	try {
		resp = await DevrevAPIRequest(endpoint, {
			method: "GET",
		}, DEVREV_PAT);
	} catch (err) {
		console.error(err);
	}
	return [resp.tags, resp.next_cursor];
}

export async function getDevrevWorksList(workType, nextCursor, DEVREV_PAT) {
	let resp, endpoint = (!nextCursor) ? `works.list?type=${workType}` : `works.list?cursor=${nextCursor}&type=${workType}`;
	try {
		resp = await DevrevAPIRequest(endpoint, {
			method: "GET",
		}, DEVREV_PAT);
	} catch (err) {
		console.error(err);
	}
	return [resp.works, resp.next_cursor];
}

export async function createDevrevWorkItem () {

}

// TO DO THINGS

// devrev
// create Devrev work should be a seperate function

// discord
// threading should be checked and created in seperate functions
// channel message with source
// follow up message
// and check more