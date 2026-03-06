const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const GITHUB_TOOL_URL = process.env.GITHUB_TOOL_URL || "http://localhost:3001";
const ARCHITECT_URL = process.env.ARCHITECT_URL || "http://localhost:3002";

client.on("ready", () => {
  console.log("AI bot ready");
});

client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  // Mr Yang character
  if (msg.content.startsWith("Mr Yang")) {
    await handleMrYang(msg);
  }

  // Process GitHub file upload (with auto-trigger Architect Agent)
  if (msg.content.startsWith("!github") && msg.attachments.size > 0) {
    await handleGitHubFile(msg);
  }

});

async function handleMrYang(msg) {
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

  try {
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
  } catch (error) {
    msg.reply("Error: Could not reach AI service");
    console.error("AI error:", error);
  }
}

async function handleGitHubFile(msg) {
  try {
    const attachment = msg.attachments.first();
    if (!attachment) {
      return msg.reply("Attach a file with the command.");
    }

    // Download and parse (don't check filename)
    const response = await fetch(attachment.url);
    const text = await response.text();
    
    let jsonData;
    try {
      jsonData = JSON.parse(text);
    } catch (err) {
      return msg.reply("Invalid JSON format in file.");
    }
    
    // Validate structure
    if (!jsonData.project || !Array.isArray(jsonData.items)) {
      return msg.reply("Invalid format. Expected { project: string, items: array }");
    }

    // Step 1: Send to GitHub Tool
    await msg.reply("📂 Setting up GitHub structure...");
    
    const githubResponse = await fetch(`${GITHUB_TOOL_URL}/process-github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonData)
    });

    const result = await githubResponse.json();

    if (result.success) {
      let summary = `✅ GitHub Setup Complete!\n\n`;
    
      result.results.forEach((item) => {
        if (item.success) {
          if (item.type === "issue") {
            summary += `📋 Issue #${item.number}: ${item.title}\n`;
          } else if (item.type === "branch") {
            summary += `🌿 Branch: \`${item.name}\`\n`;
          } else if (item.type === "task") {
            summary += `✓ Task: ${item.title}\n`;
          }
        } else {
          summary += `❌ ${item.type} failed: ${item.error}\n`;
        }
      });
    
      await msg.reply(summary);

      // Step 2: Auto-trigger Architect Agent
      console.log("🏗️ Auto-triggering Architect Agent...");
      await msg.reply("🏗️ Architect Agent is designing your system... (this may take a minute)");

      const architectResponse = await fetch(`${ARCHITECT_URL}/design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonData)
      });

      const architectResult = await architectResponse.json();

      if (architectResult.success) {
        let architectSummary = `✅ Architecture Designed!\n\n`;
        architectSummary += `**Project:** ${architectResult.project}\n`;
        architectSummary += `**Branch:** \`${architectResult.branch}\`\n\n`;
        
        architectSummary += `**📚 Documentation Generated:**\n`;
        architectResult.documentation.forEach((doc) => {
          architectSummary += `  📄 ${doc}\n`;
        });
        
        architectSummary += `\n**🤖 Agent Tasks Created:**\n`;
        architectResult.agentTasks.forEach((task) => {
          architectSummary += `  ✓ ${task}\n`;
        });
        
        architectSummary += `\n**Tech Stack:**\n`;
        architectSummary += `  Frontend: ${architectResult.architecture.system_layers.frontend}\n`;
        architectSummary += `  Backend: ${architectResult.architecture.system_layers.backend}\n`;
        architectSummary += `  Database: ${architectResult.architecture.system_layers.database}\n`;
        
        architectSummary += `\n**Next Step:** ${architectResult.nextStep}`;
        
        await msg.reply(architectSummary);
      } else {
        await msg.reply(`❌ Architect Error: ${architectResult.error}`);
      }

    } else {
      msg.reply(`Error: ${result.error}`);
    }

  } catch (error) {
    console.error(error);
    msg.reply("File processing failed.");
  }
}

client.login(process.env.DISCORD_TOKEN);