import fetch from "node-fetch";

export async function DevrevAPIRequest(endpoint, options, DEVREV_PAT) {
	// Append endpoint to root DevRev API URL (DEV)
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

export async function createDevrevTag(tagData, DEVREV_PAT) {
	let tagObject;
	try {
		tagObject = await DevrevAPIRequest(`tags.create`, {
			method: "POST",
			body: tagData,
		}, DEVREV_PAT);
	} catch (err) {
		console.error(err);
	}
	return tagObject;
}

export async function checkIfDevrevTagExists(tagName, DEVREV_PAT) {
	let tagID, tagExists = false;
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
	let [worksArray, nextCursor] = await getDevrevWorksList(workType, undefined, DEVREV_PAT);
	for (let work of worksArray) {
		if (work.display_id == workDisplayID) {
			[workExists, workObject] = [true, work];
			break;
		}
	}
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
	let tagsListObject, endpoint = (!nextCursor) ? `tags.list` : `tags.list?cursor=${nextCursor}`;
	try {
		tagsListObject = await DevrevAPIRequest(endpoint, {
			method: "GET",
		}, DEVREV_PAT);
	} catch (err) {
		console.error(err);
	}
	return [tagsListObject.tags, tagsListObject.next_cursor];
}

export async function getDevrevWorksList(workType, nextCursor, DEVREV_PAT) {
	let worksListObject, endpoint = (!nextCursor) ? `works.list?type=${workType}` : `works.list?cursor=${nextCursor}&type=${workType}`;
	try {
		worksListObject = await DevrevAPIRequest(endpoint, {
			method: "GET",
		}, DEVREV_PAT);
	} catch (err) {
		console.error(err);
	}
	return [worksListObject.works, worksListObject.next_cursor];
}

export async function createDevrevWorkItem(workData, DEVREV_PAT) {
	let workItemCreated;
	try {
		workItemCreated = await DevrevAPIRequest(`works.create`, {
			method: "POST",
			body: workData,
		}, DEVREV_PAT);
	} catch (err) {
		console.error(err);
	}
	return workItemCreated;
}
