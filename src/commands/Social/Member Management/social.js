const { Command } = require('../../../index');

module.exports = class extends Command {

	constructor(client, store, file, directory) {
		super(client, store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_SOCIAL_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_SOCIAL_EXTENDED'),
			permissionLevel: 6,
			runIn: ['text'],
			subcommands: true,
			usage: '<add|remove|set|reset> <user:username> (amount:money{0,1000000})',
			usageDelim: ' '
		});

		this.createCustomResolver('money', (arg, possible, message, [type]) => {
			if (type === 'reset') return null;
			return this.client.arguments.get('integer').run(arg, possible, message);
		});
	}

	async add(message, [user, amount]) {
		let newAmount;
		const member = await message.guild.members.fetch(user.id).catch(() => null);
		if (member) {
			// Update from SettingsGateway
			await member.settings.sync();
			newAmount = member.settings.count + amount;
			await member.settings.update(newAmount);
		} else {
			const entry = await this._getMemberSettings(message.guild.id, user.id);
			if (!entry) throw message.language.get('COMMAND_SOCIAL_MEMBER_NOTEXISTS');

			// Update from database
			newAmount = entry.count + amount;
			await this.client.providers.default.db
				.table('localScores')
				.get(entry.id)
				.update({ count: newAmount })
				.run();
		}

		return message.sendLocale('COMMAND_SOCIAL_ADD', [user.username, newAmount, amount]);
	}

	async remove(message, [user, amount]) {
		let newAmount;
		const member = await message.guild.members.fetch(user.id).catch(() => null);
		if (member) {
			// Update from SettingsGateway
			await member.settings.sync();
			newAmount = Math.max(member.settings.count - amount, 0);
			await member.settings.update(newAmount);
		} else {
			const entry = await this._getMemberSettings(message.guild.id, user.id);
			if (!entry) throw message.language.get('COMMAND_SOCIAL_MEMBER_NOTEXISTS');

			// Update from database
			newAmount = Math.max(entry.count - amount, 0);
			await this.client.providers.default.db
				.table('localScores')
				.get(entry.id)
				.update({ count: newAmount })
				.run();
		}

		return message.sendLocale('COMMAND_SOCIAL_REMOVE', [user.username, newAmount, amount]);
	}

	async set(message, [user, amount]) {
		// If sets to zero, it shall reset
		if (amount === 0) return this.reset(message, [user]);

		let variation;
		let original;
		const member = await message.guild.members.fetch(user.id).catch(() => null);
		if (member) {
			// Update from SettingsGateway
			await member.settings.sync();
			original = member.settings.count;
			variation = amount - original;
			if (variation === 0) return message.sendLocale('COMMAND_SOCIAL_UNCHANGED', [user.username]);
			await member.settings.update(amount);
		} else {
			const entry = await this._getMemberSettings(message.guild.id, user.id);
			if (!entry) throw message.language.get('COMMAND_SOCIAL_MEMBER_NOTEXISTS');

			// Update from database
			original = entry.count;
			variation = amount - original;
			if (variation === 0) return message.sendLocale('COMMAND_SOCIAL_UNCHANGED', [user.username]);
			await this.client.providers.default.db
				.table('localScores')
				.get(entry.id)
				.update({ count: amount })
				.run();
		}

		return message.sendLocale(variation > 0 ? 'COMMAND_SOCIAL_ADD' : 'COMMAND_SOCIAL_REMOVE', [user.username, original + variation, Math.abs(variation)]);
	}

	async reset(message, [user]) {
		const member = await message.guild.members.fetch(user.id).catch(() => null);
		if (member) {
			// Update from SettingsGateway
			await member.settings.sync();
			await member.settings.update(0);
		} else {
			const entry = await this._getMemberSettings(message.guild.id, user.id);
			if (!entry) throw message.language.get('COMMAND_SOCIAL_MEMBER_NOTEXISTS');

			// Update from database
			await this.client.providers.default.db
				.table('localScores')
				.get(entry.id)
				.update({ count: 0 })
				.run();
		}

		return message.sendLocale('COMMAND_SOCIAL_RESET', [user.username]);
	}

	_getMemberSettings(guildID, userID) {
		return this.client.providers.default.db
			.table('localScores')
			.getAll([guildID, userID], { index: 'guild_user' })
			.limit(1)
			.nth(0)
			.default(null)
			.run();
	}

};