#!/bin/bash
# Run it like you mean it 
# --Vedansh

# ------------------------------------------------------------
# HOW TO RUN THIS IF YOU ARE USING THIS FOR THE FIRST TIME 
# set your own `devrev_id` variable
# run `bash runsnap.sh` in terminal if you dont want errors
# Every ----- partition is a step of snap-in deployment in https://docs.google.com/document/d/1IcD_Tm3d8s9NRv4A-3RdGz58rdd2lQwOcp8xTAdWtj8/edit
# What Errors ?
# running `sh runsnap.sh` will most likely give an error
# ------------------------------------------------------------

set -e # because why not ?

echo "-----------------------------"

# Devrev CLI Authentication
# Declare the DevRev ID variable and set its value to the user email
devrev_id="i-vedansh.srivastava@devrev.ai"
echo "Initiating DevRev CLI Authentication for DevRev ID: ${devrev_id}"
devrev profiles authenticate --env dev --org flow-test --usr ${devrev_id}
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
read -p "Enter a value for the --slug option: " slug

# Declare the snap-in package variables
name="flow-test"
description="snap in package for devrev internal automations"

# Snap In package creation
package_creation_response=$(devrev snap_in_package create-one --slug $slug --name "$name" --description "$description")

if [[ $package_creation_response == *snap_in_package* ]] && [[ $? -eq 0 ]]; then
  snap_in_package_id=$(echo $package_creation_response | jq -r '.snap_in_package.id')
  echo "Snap In Package created successfully with ID: $snap_in_package_id"
else
  debug_message=$(echo $package_creation_response | jq -r '.debug_message')
  echo "Snap In Package creation failed: $debug_message"
  exit 1
fi

echo "-----------------------------"

echo "Creating a Snap-In version..."

# Snap In version creation
version_creation_response=$(devrev snap_in_version create-one --manifest manifest.yaml --package $snap_in_package_id  --archive output.tar.gz)

if [[ $version_creation_response == *snap_in_version* ]] && [[ $? -eq 0 ]]; then
  snap_in_version_id=$(echo $version_creation_response | jq -r '.snap_in_version.id')
  echo "Snap In Version created successfully with ID: $snap_in_version_id"
else
  debug_message=$(echo $version_creation_response | jq -r '.debug_message')
  echo "Snap In Version creation failed: $debug_message"
  exit 1
fi

echo "-----------------------------"

echo "Creating a Snap-In draft..."

#Snap In draft creation
draft_creation_response=$(devrev snap_in draft --snap_in_version $snap_in_version_id)

if [[ $draft_creation_response == *snap_in* ]] && [[ $? -eq 0 ]]; then
  snap_in_draft_id=$(echo $draft_creation_response | jq -r '.snap_in.id')
  echo "Snap In Draft created successfully with ID: $snap_in_draft_id"
else
  debug_message=$(echo $draft_creation_response | jq -r '.debug_message')
  echo "Snap In Draft creation failed: $debug_message"
  exit 1
fi

echo "-----------------------------"

echo "Updating the Snap In and estabilishing connections..."

#Snap In Updation
devrev snap_in update $snap_in_draft_id

if [[ $? -eq 0 ]]; then
  echo "Snap In updation successful and connections were estabilished"
else
  echo "Snap In updation failed: $debug_message"
  exit 1
fi

echo "-----------------------------"
echo " "
echo " DEPLOYMENT TIME "
echo " "
echo "I know its supposed to be script but can you please :)"
echo " "
read -p "Enter the snap_in id : " snap_in_id
echo " "
echo " "
echo "Attempting yeet on your Snap In"

#Snap In Deploy
devrev snap_in deploy $snap_in_id

if [ $? -eq 0 ]; then
  echo "Snap-in you made was successfully yeeeted on Lambda"
else
  echo "Snap-in deployment failed"
  exit 1
fi

echo "-----------------------------"
