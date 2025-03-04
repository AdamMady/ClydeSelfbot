# About
A simple discord selfbot that you can run on your groupchats through the Google Generative API (Gemini).

# How to setup
Install [NodeJS](https://nodejs.org/en) 16.6.0 or newer.

Install Source Code as ZIP and download

Extract the ZIP in a safe folder. (not your desktop)

Adjust the index.js "INSERT_GEMINI_KEY", 'INSERT_USER_TOKEN' and 'INSERT_USERID' all accordingly.

# How to get the "INSERT" variables.
## INSERT_GEMINI_KEY
Go to google's [AI Studio](https://aistudio.google.com/app/apikey) and login using your google account, Then generate an API Key and copy it.

## INSERT_USER_TOKEN
Run the following on your browser console on your preferred account then it will copied to your clipboard:

```
window.webpackChunkdiscord_app.push([
  [Math.random()],
  {},
  req => {
    if (!req.c) return;
    for (const m of Object.keys(req.c)
      .map(x => req.c[x].exports)
      .filter(x => x)) {
      if (m.default && m.default.getToken !== undefined) {
        return copy(m.default.getToken());
      }
      if (m.getToken !== undefined) {
        return copy(m.getToken());
      }
    }
  },
]);
window.webpackChunkdiscord_app.pop();
console.log('%cWorked!', 'font-size: 50px');
console.log(`%cYou now have your token in the clipboard!`, 'font-size: 16px');
```

## INSERT_USERID
1. Make sure [developer mode](https://discord.com/developers/docs/activities/building-an-activity#step-0-enable-developer-mode) is enabled.
2. Right click on your main account's profile picture on any message that you sent.
3. Click "Copy User ID".
4. Replace INSERT_USERID in the owner id as that.
5. Add it also in the direct message ids.
6. Do the same for any other users you want to add to the list.

# How to run
Open command prompt

Run the command `cd ` followed by the file path of your folder.

Run the command `npm install`

After it's done installing all modules run the command `node index.js`

Then you should be good to go!

# Credits
[discord.js-selfbot-v13](https://github.com/aiko-chan-ai/discord.js-selfbot-v13)

### I don't take any responsibility for blocked Discord accounts that used this .
### Using this on a user account is prohibited by the Discord TOS and can lead to the account block.
