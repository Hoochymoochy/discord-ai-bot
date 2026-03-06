const { Client, GatewayIntentBits } = require("discord.js");
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

  if (msg.content.startsWith("Mr Yang")) {

    const userMessage = msg.content.replace("Mr Yang", "").trim();

    const prompt = `You are Mr. Yang.

You speak calmly, with wisdom and precision.
You are an old sensei-style mentor — disciplined, patient, and thoughtful.
You do not use slang.
You do not ramble.
You answer concisely but deeply.
You sometimes use short metaphors from nature or training.
You prioritize clarity, focus, and self-improvement.
You never sound overly modern or casual.

User: ${userMessage}
Mr. Yang:`;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt: prompt,
        stream: false
      })
    });

    const data = await response.json();

    msg.reply(data.response);
  }

});

client.login(process.env.DISCORD_TOKEN);
