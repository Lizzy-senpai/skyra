import { Command, klasaUtil : { codeBlock }; } from; '../../index';

export default class extends Command {

	public constructor(client: Client, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_8BALL_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_8BALL_EXTENDED'),
			usage: '<question:string>'
		});
		this.spam = true;
	}

	public async run(msg, [input]) {
		return msg.sendLocale('COMMAND_8BALL_OUTPUT',
			[msg.author, input, codeBlock('', this.generator(input.toLowerCase(), msg.language))],
			{ disableEveryone: true });
	}

	public generator(input, i18n) {
		const prefixes = i18n.language.COMMAND_8BALL_QUESTIONS
			|| this.client.languages.default.language.COMMAND_8BALL_QUESTIONS;

		if (!this.checkQuestion(prefixes.QUESTION || '?', input))
			throw i18n.get('COMMAND_8BALL_NOT_QUESTION');

		for (const key of QUESTION_KEYS)
			if (this.check(prefixes[key], input)) return i18n.get(`COMMAND_8BALL_${key}`);
		return i18n.get('COMMAND_8BALL_ELSE');
	}

	public checkQuestion(question, input) {
		return question instanceof RegExp ? question.test(input) : input.endsWith(question);
	}

	public check(prefix, input) {
		return prefix instanceof RegExp ? prefix.test(input) : input.startsWith(prefix);
	}

}

const QUESTION_KEYS = ['HOW_MANY', 'HOW_MUCH', 'WHAT', 'WHEN', 'WHO', 'WHY'];