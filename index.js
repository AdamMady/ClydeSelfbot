'use strict';

const { Client, DiscordAPIError } = require('discord.js-selfbot-v13');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = "INSERT_GEMINI_KEY";
const genAI = new GoogleGenerativeAI(apiKey);
let model = genAI.getGenerativeModel({
  model: "INSERT_GEMINI_MODEL",
});

const client = new Client();

const token = 'INSERT_USER_TOKEN';
let limit = 100;
let headerText = `you are clyde, a selfbot programmed for discord direct messages (DMs) with a user. you are helpful, mindful, and converse like a normal user. reply in lowercase to all events and generate images with the specified format when asked, without asking for any additional information. do not generate inappropriate, sexually suggestive, or illegal content. avoid repeating phrases or instructions unnecessarily. be helpful and mindful in all interactions.`;
let maxTokens = 250;
let temperature = 0.9;

let generationConfig = {
  temperature,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: maxTokens,
  responseMimeType: "text/plain",
};

let safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// Initial narrative template
const initialNarrativeTemplate = (headerText) => [
  { role: 'user', parts: [{ text: headerText }] }
];

const ownerID = 'INSERT_USERID';
let adminIDs = [ownerID];
let blacklistedChannelIDs = [];

//insert all your USERIDS that it should reply to here. Seperate each USERID with a ","
const directMessageUserIDs = [
  'INSERT_USERID', 'INSERT_USERID'
];

// Narratives storage for DMs
let narratives = {};

// Function to initialize narrative for a user
function initializeNarrative(id) {
  if (!narratives[id]) {
    narratives[id] = initialNarrativeTemplate(headerText);
    narratives[id].headerText = headerText;
    narratives[id].maxTokens = maxTokens;
    narratives[id].temperature = temperature;
    narratives[id].limit = limit;
  }
}

// Function to handle adding multiple user IDs
function handleAddUsers(commandParts, type, message) {
  const userIDs = commandParts.slice(2).join(' ').split(',').map(id => id.trim());
  const addedIDs = [];
  const existingIDs = [];

  userIDs.forEach(userID => {
    if (type === 'admin') {
      if (!adminIDs.includes(userID)) {
        adminIDs.push(userID);
        addedIDs.push(userID);
      } else {
        existingIDs.push(userID);
      }
    } else if (type === 'user') {
      if (!directMessageUserIDs.includes(userID)) {
        directMessageUserIDs.push(userID);
        addedIDs.push(userID);
      } else {
        existingIDs.push(userID);
      }
    }
  });

  message.channel.send(`Added ${type}(s): ${addedIDs.join(', ')}.`);
  if (existingIDs.length > 0) {
    message.channel.send(`These ${type}(s) were already in the list: ${existingIDs.join(', ')}.`);
  }
}

// Function to handle removing multiple user IDs
function handleRemoveUsers(commandParts, type, message) {
  const userIDs = commandParts.slice(2).join(' ').split(',').map(id => id.trim());
  const removedIDs = [];
  const notFoundIDs = [];

  userIDs.forEach(userID => {
    if (type === 'admin') {
      if (adminIDs.includes(userID) && userID !== ownerID) {
        adminIDs = adminIDs.filter(id => id !== userID);
        removedIDs.push(userID);
      } else {
        notFoundIDs.push(userID);
      }
    } else if (type === 'user') {
      const userIndex = directMessageUserIDs.indexOf(userID);
      if (userIndex !== -1) {
        directMessageUserIDs.splice(userIndex, 1);
        removedIDs.push(userID);
      } else {
        notFoundIDs.push(userID);
      }
    }
  });

  message.channel.send(`Removed ${type}(s): ${removedIDs.join(', ')}.`);
  if (notFoundIDs.length > 0) {
    message.channel.send(`These ${type}(s) were not found: ${notFoundIDs.join(', ')}.`);
  }
}

// Function to list admins, users, or blacklisted channels
function handleList(message, type) {
  let list = [];
  let header = '';

  if (type === 'admins') {
    list = adminIDs.map(id => `<@${id}> \`${id}\``);
    header = `There are ${adminIDs.length} admins.`;
  } else if (type === 'users') {
    list = directMessageUserIDs.map(id => `<@${id}> \`${id}\``);
    header = `There are ${directMessageUserIDs.length} users.`;
  } else if (type === 'blacklisted') {
    list = blacklistedChannelIDs.map(id => `\`${id}\``);
    header = `There are ${blacklistedChannelIDs.length} blacklisted channel IDs.`;
  }

  const chunkSize = 10; // Number of users per message to avoid mention limit
  const listChunks = [];

  for (let i = 0; i < list.length; i += chunkSize) {
    listChunks.push(list.slice(i, i + chunkSize).join('\n- '));
  }

  listChunks.forEach((chunk, index) => {
    try {
      message.channel.send(`${index === 0 ? header : ''}\n\n- ${chunk}`);
    } catch (error) {
      console.error(`Error sending list chunk: ${error}`);
      message.channel.send("Failed to send the list. Please try again later.");
    }
  });
}

// Command handler function
function handleCommand(message, commandParts, narrative, isGlobal = false) {
  const scope = isGlobal ? "global" : "local";

  if (commandParts[1] === 'temperature' && !isNaN(commandParts[2])) {
    const newTemperature = parseFloat(commandParts[2]);
    if (isGlobal) {
      temperature = newTemperature;
      generationConfig.temperature = newTemperature;
    } else {
      narrative.temperature = newTemperature;
    }
    message.channel.send(`Temperature ${scope}ly set to ${newTemperature}.`);
  } else if (commandParts[1] === 'maxtokens' && !isNaN(commandParts[2])) {
    const newMaxTokens = parseInt(commandParts[2]);
    if (isGlobal) {
      maxTokens = newMaxTokens;
      generationConfig.maxOutputTokens = newMaxTokens;
    } else {
      narrative.maxTokens = newMaxTokens;
    }
    message.channel.send(`Max tokens ${scope}ly set to ${newMaxTokens}.`);
  } else if (commandParts[1] === 'model') {
    const newModel = commandParts.slice(2).join('-');
    if (isGlobal) {
      model = genAI.getGenerativeModel({ model: newModel });
    } else {
      narrative.model = genAI.getGenerativeModel({ model: newModel });
    }
    message.channel.send(`Model ${scope}ly changed to ${newModel}.`);
  } else if (commandParts[1] === 'limit' && !isNaN(commandParts[2])) {
    const newLimit = parseInt(commandParts[2]);
    if (isGlobal) {
      limit = newLimit;
    } else {
      narrative.limit = newLimit;
    }
    message.channel.send(`Limit ${scope}ly set to ${newLimit}.`);
  } else if (commandParts[1] === 'headertext') {
    const newHeaderText = commandParts.slice(2).join(' ');
    if (isGlobal) {
      headerText = newHeaderText;
    } else {
      narrative.headerText = newHeaderText;
      narrative[0].parts[0].text = newHeaderText; // update the initial narrative part with the new header text
    }
    message.channel.send(`Header text ${scope}ly set to: ${newHeaderText}`);
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  const isDM = directMessageUserIDs.includes(message.author.id);
  const isBlacklistedChannel = blacklistedChannelIDs.includes(message.channel.id);

  if (!isDM || isBlacklistedChannel) return;

  const isReplyToBot = message.reference && message.reference.messageId && (await message.channel.messages.fetch(message.reference.messageId)).author.id === client.user.id;
  const isMentionToBot = message.content.includes(`<@${client.user.id}>`);
  const userMessage = message.content.replace(`<@${client.user.id}>`, '').trim();
  const formattedMessage = `${message.author.username}: ${userMessage}`;

  initializeNarrative(message.channel.id);
  let narrative = narratives[message.channel.id];

  const commandParts = userMessage.toLowerCase().split(' ');

  if (adminIDs.includes(message.author.id) || message.channel.type === 'dm') {
    if (commandParts[0] === 'reset') {
      const currentSettings = {
        headerText: narrative.headerText,
        maxTokens: narrative.maxTokens,
        temperature: narrative.temperature,
        limit: narrative.limit
      };
      narratives[message.channel.id] = initialNarrativeTemplate(currentSettings.headerText);
      narratives[message.channel.id].headerText = currentSettings.headerText;
      narratives[message.channel.id].maxTokens = currentSettings.maxTokens;
      narratives[message.channel.id].temperature = currentSettings.temperature;
      narratives[message.channel.id].limit = currentSettings.limit;
      message.channel.send('Narrative has been reset.');
    } else if (commandParts[0] === 'set') {
      handleCommand(message, commandParts, narrative);
      return;
    } else if (commandParts[0] === 'gset') {
      handleCommand(message, commandParts, narrative, true);
      return;
    } else if (commandParts[0] === 'add') {
      if (commandParts[1] === 'admin') {
        handleAddUsers(commandParts, 'admin', message);
      } else if (commandParts[1] === 'user') {
        handleAddUsers(commandParts, 'user', message);
      }
    } else if (commandParts[0] === 'remove') {
      if (commandParts[1] === 'admin') {
        handleRemoveUsers(commandParts, 'admin', message);
      } else if (commandParts[1] === 'user') {
        handleRemoveUsers(commandParts, 'user', message);
      }
    } else if (commandParts[0] === 'blacklist') {
      const channelIdToBlacklist = commandParts[1];
      const blacklistIndex = blacklistedChannelIDs.indexOf(channelIdToBlacklist);
      if (blacklistIndex !== -1) {
        blacklistedChannelIDs.splice(blacklistIndex, 1);
        message.channel.send(`Channel ${channelIdToBlacklist} has been removed from the blacklist.`);
      } else {
        blacklistedChannelIDs.push(channelIdToBlacklist);
        message.channel.send(`Channel ${channelIdToBlacklist} has been added to the blacklist.`);
      }
    } else if (commandParts[0] === 'list') {
      if (commandParts[1] === 'admins') {
        handleList(message, 'admins');
      } else if (commandParts[1] === 'users') {
        handleList(message, 'users');
      } else if (commandParts[1] === 'blacklisted') {
        handleList(message, 'blacklisted');
      }
    }
  }

  if ((isReplyToBot || isMentionToBot) && message.author.id !== client.user.id && !blacklistedChannelIDs.includes(message.channel.id)) {
    narrative.push({ role: 'user', parts: [{ text: formattedMessage }] });

    const validNarrative = narrative.filter(entry => entry.parts && entry.parts.length > 0 && entry.parts[0].text);
    if (validNarrative.length > 0 && validNarrative[0].role !== 'user') {
      validNarrative.unshift({ role: 'user', parts: [{ text: "hello" }] });
    }

    try {
      await message.channel.sendTyping();  // Clyde starts typing

      const chatSession = model.startChat({
        generationConfig,
        safetySettings,
        history: validNarrative,
      });

      try {
        const gptResponse = await chatSession.sendMessage("");
        const responseText = gptResponse.response.text();
        if (responseText) {
          await sendMessageInChunks(message.channel, responseText, message.id);
          narrative.push({ role: 'model', parts: [{ text: responseText }] });
        }
      } catch (error) {
        console.error(`Error sending message to Gemini API: ${error}`);
      }
    } catch (error) {
      console.error(`Unexpected error: ${error}`);
      if (error instanceof DiscordAPIError) {
        if (error.code === 50001 || error.code === 50013) {
          try {
            await message.channel.send("Failed to send message due to permission issues. Please check the bot's permissions.");
          } catch (sendError) {
            console.error(`Error sending permission issue message: ${sendError}`);
          }
        } else {
          console.error(`Discord API error code: ${error.code}`);
        }
      }
    }
  }

  if (narrative.length > limit) {
    narrative.splice(1, 1); // Remove the second element to keep headerText always at the start
  }
});

function sendMessageInChunks(channel, text, replyTo) {
  const chunkSize = 2000; // Discord's message character limit
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.substring(i, i + chunkSize);
    channel.send({ content: chunk, reply: { messageReference: replyTo } })
      .catch(error => console.error(`Failed to send chunk: ${error}`));
  }
}

client.login(token);
