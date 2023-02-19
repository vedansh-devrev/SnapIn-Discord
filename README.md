# Snap-in to Automate Ticket Creation on Discord 
DevRev currently supports various mediums for our customers to receive inquiries from their customers. These include PLuG, email, and Slack. We call this omnichannel support. There is currently an ask to support more channels, Discord is one of the most frequently requested new channels.

## Currently Supported Use-cases
#### Use Case 1
```
As a DevUser, I want to be able to open a ticket from Discord, so that I don’t have to jump back and forth between the apps when I am already in Discord. So I want to create a ticket on Discord (and simultaneously on DevRev) through message and slash commands.
```
## Steps to run the snap-in:

[Refer this Documentation for basic requirements and setup](https://docs.google.com/document/d/1U7_6TgE9P18NGkz_9Zb9bQiukQ0-KdjayvOxG28H4qU/edit#heading=h.ufym6jrip4vw)

* `Discord Webhook` and `Devrev-PAT` connections is required for this snap in to install and deploy.
* Implement the Automation Interface, to receive `discord interaction` events.
* Use Datadog and Cloudwatch logs for debugging purposes.
	
For a demo snap-in code (automation which creates a notification on github branch creation), refer to this repository.
[Let's go to the repository](https://github.com/devrev/flow-lambda-poc)

Since there is no dedicated documentation for incoming web-hook events payload from Devrev, use Cloudwatch logs (with `JSON.stringify()`) to view the JSON structure of the incoming event payloads. However for incoming events from Discord Interactions, refer to the [OG Discord Documentation](https://discord.com/developers/docs/interactions/receiving-and-responding#interactions)

## CLI Commands to install and deploy a snap-in:
[Link to Commands](https://docs.google.com/document/d/1IcD_Tm3d8s9NRv4A-3RdGz58rdd2lQwOcp8xTAdWtj8/edit?usp=sharing)

<details>
<summary markdown="span">If you dont wanna go there</summary>

#### Devrev-CLI Authentication
devrev profiles authenticate --env dev --org flow-test --usr i-vedansh.srivastava@devrev.ai (only once for a single session)

#### Create tar.gz Archive of the Files
tar -cvzf output.tar.gz ticket-status-update/

#### Create Snap In Package
devrev snap_in_package create-one --slug dev0_snapin --name Dev0  --description "discord ticket creation" | jq .

*(choose a unique slug)*

#### Create Snap In Version 
devrev snap_in_version create-one --manifest manifest.yaml --package don:integration:dvrv-us-1:devo/fOFb0IdZ:snap_in_package/5b55aae8-daa2-49e2-b8d2-8cb939a90ef0 --archive output.tar.gz | jq . 

*(package id “don:integration:dvrv-us-1:devo/fOFb0IdZ:snap_in_package/5b55aae8-daa2-49e2-b8d2-8cb939a90ef0” is received as an output from snap in package creation)*

#### Snap in draft
devrev snap_in draft --snap_in_version don:integration:dvrv-us-1:devo/fOFb0IdZ:snap_in_package/5b55aae8-daa2-49e2-b8d2-8cb939a90ef0:snap_in_version/723ed6f8-6f27-4f71-9d6f-533887a49773 | jq . 

*(version id “don:integration:dvrv-us-1:devo/fOFb0IdZ:snap_in_package/5b55aae8-daa2-49e2-b8d2-8cb939a90ef0:snap_in_version/723ed6f8-6f27-4f71-9d6f-533887a4977” is received as an output from snap in version creation)*

#### Updating Snap-in with global inputs (if any)
devrev snap_in update don:integration:dvrv-us-1:devo/fOFb0IdZ:snap_in/092dac20-f8b5-46ba-92a0-8ff59a21cf74 (to establish connections with Devrev and third-party applications)

*(“don:integration:dvrv-us-1:devo/fOFb0IdZ:snap_in/092dac20-f8b5-46ba-92a0-8ff59a21cf74” is received from draft creation)*

#### Snap In deployment
devrev snap_in deploy don:integration:dvrv-us-1:devo/fOFb0IdZ:snap_in/092dac20-f8b5-46ba-92a0-8ff59a21cf74 

*(“don:integration:dvrv-us-1:devo/fOFb0IdZ:snap_in/092dac20-f8b5-46ba-92a0-8ff59a21cf74” is received post updating the snap in)*

</details>

<details>
<summary markdown="span">Or just do this</summary>
<br>

Open `snapin-DiscordTicketCreation/snapin-discord-ticket-creation/runsnap.sh` in your text editor and set your own `devrev_id` variable.
```
cd snapin-discord-ticket-creation/
bash runsnap.sh
```
Every partition in script is a step of snap-in deployment in this [doc](https://docs.google.com/document/d/1IcD_Tm3d8s9NRv4A-3RdGz58rdd2lQwOcp8xTAdWtj8/edit)

Running it like _sh runsnap.sh_ will most likely give an error.
</details>
