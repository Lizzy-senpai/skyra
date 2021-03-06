import { DbSet } from '@lib/structures/DbSet';
import { RichDisplayCommand, RichDisplayCommandOptions } from '@lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { TOKENS } from '@root/config';
import { cutText, parseURL, toTitleCase } from '@sapphire/utilities';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors, Mime } from '@utils/constants';
import { fetch, FetchResultTypes, IMAGE_EXTENSION, pickRandom } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { KlasaMessage } from 'klasa';

@ApplyOptions<RichDisplayCommandOptions>({
	aliases: ['definition', 'defination', 'dictionary'],
	bucket: 2,
	cooldown: 20,
	description: (language) => language.get(LanguageKeys.Commands.Tools.DefineDescription),
	extendedHelp: (language) => language.get(LanguageKeys.Commands.Tools.DefineExtended),
	usage: '<input:string>'
})
export default class extends RichDisplayCommand {
	public async run(message: KlasaMessage, [input]: [string]) {
		const response = await message.sendEmbed(
			new MessageEmbed().setDescription(pickRandom(message.language.get(LanguageKeys.System.Loading))).setColor(BrandingColors.Secondary)
		);

		const result = await this.fetchApi(message, input);
		const display = await this.buildDisplay(result, message);

		await display.start(response, message.author.id);
		return response;
	}

	private async buildDisplay(results: OwlbotResultOk, message: KlasaMessage) {
		const template = new MessageEmbed().setTitle(toTitleCase(results.word)).setColor(await DbSet.fetchColor(message));

		if (results.pronunciation)
			template.addField(message.language.get(LanguageKeys.Commands.Tools.DefinePronounciation), results.pronunciation, true);

		const display = new UserRichDisplay(template).setFooterSuffix(' - Powered by Owlbot');

		for (const result of results.definitions) {
			const definition = this.content(result.definition);
			display.addPage((embed: MessageEmbed) => {
				embed
					.addField('Type', result.type ? toTitleCase(result.type) : message.language.get(LanguageKeys.Commands.Tools.DefineUnknown), true)
					.setDescription(definition);

				const imageUrl = IMAGE_EXTENSION.test(result.image_url ?? '') && parseURL(result.image_url ?? '');
				if (imageUrl) embed.setThumbnail(imageUrl.toString());

				return embed;
			});
		}

		return display;
	}

	private async fetchApi(message: KlasaMessage, word: string) {
		try {
			return await fetch<OwlbotResultOk>(
				`https://owlbot.info/api/v4/dictionary/${encodeURIComponent(word.toLowerCase())}`,
				{ headers: { Accept: Mime.Types.ApplicationJson, Authorization: `Token ${TOKENS.OWLBOT}` } },
				FetchResultTypes.JSON
			);
		} catch {
			throw message.language.get(LanguageKeys.Commands.Tools.DefineNotfound);
		}
	}

	private content(definition: string) {
		if (definition.length < 2048) return definition;
		return cutText(definition, 2048);
	}
}

export interface OwlbotResultOk {
	definitions: readonly OwlbotDefinition[];
	word: string;
	pronunciation: string | null;
}

export interface OwlbotDefinition {
	type: string | null;
	definition: string;
	example: string | null;
	image_url: string | null;
	emoji: string | null;
}
