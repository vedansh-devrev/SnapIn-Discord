import fetch from 'node-fetch';
//Get DISCORD_TOKEN and DEVREV_PAT from Keyrings

export async function DiscordAPIRequest(endpoint, options) {
  // Append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use node-fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function DevrevAPIRequest(endpoint, options) {
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
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // parse response as JSON and return it
  return await res.json();
}

//Declaring a seperate function for this on purpose
export async function SendInteractionResponse (data, id, token)
{
    //CALLBACK URL
    const url = `https://discord.com/api/v10/interactions/${id}/${token}/callback`;
    const res = await fetch(url, {
        headers: {
          Authorization: `Bot ${DISCORD_TOKEN}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(data),
        method: "POST"
      });
      // throw API errors
      if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
      }
      // return original response
      return await res.json();
}


export async function OpenAPISummarizer(passage, maxTokens) {
    const url = "https://api.openai.com/v1/completions";
    const prompt = "Please summarize the following text in one line:";
  
    const data = {
      prompt: `${prompt}\n${passage}`,
      max_tokens: maxTokens,
      temperature: 0,
      n: 1,
      "model": "text-davinci-003"
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.openAPIKEY}`,
      },
      body: JSON.stringify(data),
    });
    // throw API errors
    if (!res.ok) {
      const data = await res.json();
      console.log(res.status);
      throw new Error(JSON.stringify(data));
    }
    // parse response as JSON and return it
    const result = await res.json();
    console.log(result);
    const heading = result.choices[0].text.trim();
    console.log(heading)
    return heading;
  }
  
  