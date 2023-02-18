#!/bin/bash


echo "-----------------------------"

# Devrev CLI Authentication
# Declare the DevRev ID variable and set its value to the user email
devrev_id="i-vedansh.srivastava@devrev.ai"\
echo "Initiating DevRev CLI Authentication for DevRev ID: ${devrev_id}"
devrev profiles authenticate --env dev --org flow-test --usr "${devrev_id}"
if [ $? -eq 0 ]; then
  echo "Authentication Success!"
else
  echo "Authentication Failed!"
fi

echo "-----------------------------"

echo "Creating compressed archive of all directories..."

# Create a compressed archive of all directories in the current directory
tar -czf output.tar.gz */

if [ $? -eq 0 ]; then
  echo "Compression successful."
else
  echo "Compression failed."
fi

echo "-----------------------------"

echo "Creating a Snap-In package..."

# Prompt the user to enter a value for the --slug option
read -p "Enter a value for the --slug option: " snap_slug

# Declare the snap-in package variables
snap_name="flow-test"
snap_desc="snap in package for devrev internal automations"

# Snap In package creation
package_creation_response=$(devrev snap_in_package create-one --slug $slug --name "$name" --description "$description" | jq '.')

if [[ $package_creation_response == *snap_in_package* ]]; then
  snap_in_package_id=$(echo $package_creation_response | jq -r '.snap_in_package.id')
  echo "Snap In Package created successfully with ID: $snap_in_package_id"
else
  debug_message=$(echo $package_creation_response | jq -r '.debug_message')
  echo "Snap In Package creation failed: $debug_message"
fi

echo "-----------------------------"

echo "Creating a Snap-In version..."

# Snap In version creation
version_creation_response=$(devrev snap_in_version create-one --manifest manifest.yaml --package $snap_in_package_id  --archive output.tar.gz | jq -r '.snap_in_version.id')

if [[ $version_creation_response == *snap_in_version* ]]; then
  snap_in_version_id=$(echo $version_creation_response | jq -r '."snap_in_version.id')
  echo "Snap In Version created successfully with ID: $snap_in_version_id"
else
  debug_message=$(echo $version_creation_response | jq -r '.debug_message')
  echo "Snap In Version creation failed: $debug_message"
fi

echo "-----------------------------"

echo "Creating a Snap-In draft..."

#Snap In draft creation
draft_creation_response=$(devrev snap_in draft --snap_in_version $snap_in_version_id | jq .)

if [[ $draft_creation_response == *snap_in* ]]; then
  snap_in_draft_id=$(echo $draft_creation_response | jq -r '."snap_in.id')
  echo "Snap In Version created successfully with ID: $snap_in_draft_id"
else
  debug_message=$(echo $draft_creation_response | jq -r '.debug_message')
  echo "Snap In Version creation failed: $debug_message"
fi

echo "-----------------------------"

echo "Updating the Snap In and estabilishing connections..."

#Snap In Updation
updation_response=$(devrev snap_in update $snap_in_draft_id)


if [[ $updation_response == *snap_in* ]]; then
  snap_in_id=$(echo "$updation_response" | jq -r '.snap_in.id')
  echo "Snap In updation successful and connections were estabilished, Snap ID: $snap_in_id"
else
  debug_message=$(echo $updation_response | jq -r '.debug_message')
  echo "Snap In updation failed: $debug_message"
fi

echo "-----------------------------"

echo "Yeeting your Snap In on Lambda"

#Snap In Deploy
devrev snap_in deploy $snap_in_id

if [ $? -eq 0 ]; then
  echo "Snap-in you made was successfully yeeeted"
else
  echo "Snap-in deployment failed"

echo "-----------------------------"
