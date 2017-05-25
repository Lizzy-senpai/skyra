/* eslint-disable no-throw-literal */
exports.run = async (client, msg, [search, ...reason]) => {
  /* Initialize Search */
  const user = await client.search.User(search, msg.guild, true);
  const member = msg.guild.member(user) || null;

  if (user.id === msg.author.id) {
    throw "Ey! Why would you ban yourself?";
  } else if (member) {
    if (member.highestRole.position >= msg.member.highestRole.position) throw "The selected member has higher or equal role position than you.";
    else if (!member.bannable) throw "The selected member is not bannable.";
  }

  user.action = "ban";
  await msg.guild.ban(user, { days: 1, reason: `${reason ? reason.join(" ") : null}` });
  msg.send(`|\`🔨\`| **BANNED**: ${user.tag} (${user.id})${reason ? `\nReason: ${reason.join(" ")}` : ""}`).catch(console.error);

  /* Handle Moderation Logs */
  const moderation = new client.Moderation(msg);
  await moderation.send(user, "ban", reason);
};

exports.conf = {
  enabled: true,
  runIn: ["text"],
  aliases: [],
  permLevel: 2,
  botPerms: ["BAN_MEMBERS"],
  requiredFuncs: [],
  spam: false,
  mode: 2,
  cooldown: 5,
};

exports.help = {
  name: "ban",
  description: "Ban the mentioned user.",
  usage: "<SearchMember:string> [reason:str] [...]",
  usageDelim: " ",
};
