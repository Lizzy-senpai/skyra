import { Command, util : { fetchAvatar }, assetsFolder; } from; '../../index';
import { Canvas } from 'canvas-constructor';
import { readFile } from 'fs-nextra';
import { join } from 'path';

export default class extends Command {

	public constructor(client: Client, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			requiredPermissions: ['ATTACH_FILES'],
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_SHINDEIRU_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_SHINDEIRU_EXTENDED'),
			runIn: ['text'],
			usage: '<user:username>'
		});

		this.template = null;
	}

	public async run(msg, [user]) {
		const attachment = await this.generate(user, msg.author);
		return msg.channel.send({ files: [{ attachment, name: 'Shindeiru.png' }] });
	}

	public async generate(target, author) {
		if (target === author) author = this.client.user;

		/* Get the buffers from both profile avatars */
		const [theAliveOne, theDeadOne] = await Promise.all([
			fetchAvatar(author, 128),
			fetchAvatar(target, 256)
		]);

		return new Canvas(500, 668)
			.addImage(this.template, 0, 0, 500, 668)
			.addImage(theDeadOne, 96, 19, 113, 113, { type: 'round', radius: 56.5, restore: true })
			.addImage(theAliveOne, 310, 135, 128, 128, { type: 'round', radius: 64, restore: true })
			.addImage(theDeadOne, 109, 364, 256, 256, { type: 'round', radius: 128, restore: true })
			.toBufferAsync();
	}

	public async init() {
		this.template = await readFile(join(assetsFolder, '/images/memes/Shindeiru.png'));
	}

}