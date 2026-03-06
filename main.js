const { Client, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log("AI bot ready");
});

client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  if (msg.content.startsWith("!ai")) {

    const prompt = msg.content.replace("!ai", "").trim();

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: prompt,
        stream: false
      })
    });

    const data = await response.json();

    msg.reply(data.response);
  }

});

client.login(process.env.DISCORD_TOKEN);