// src/lib/states/appState.svelte.ts
import { goto } from '$app/navigation';
import type { AppSettings, GamepassSave, Guild, ItemContainerSlot } from '$types';
import { EntryState, MessageType, type Pal, type Player, type SaveFile } from '$types';
import { getToastState } from './toastState.svelte';
import { getSocketState } from './websocketState.svelte';

const ws = getSocketState();
const toast = getToastState();

interface ModifiedData {
	modified_pals?: Record<string, Pal>;
	modified_players?: Record<string, Player>;
}

export function createAppState() {
	let players: Record<string, Player> = $state({});
	let guilds: Record<string, Guild> = $state({});
	let selectedPlayerUid: string = $state('');
	let selectedPlayer: Player | undefined = $state(undefined);
	let selectedPal: Pal | undefined = $state(undefined);
	let saveFile: SaveFile | undefined = $state(undefined);
	let playerSaveFiles: SaveFile[] = $state([]);
	let modifiedPals: Record<string, Pal> = $state({});
	let modifiedPlayers: Record<string, Player> = $state({});
	let clipboardItem: ItemContainerSlot | null = $state(null);
	let progressMessage: string = $state('');
	let version: string = $state('');
	let settings: AppSettings = $state({ language: 'en' });
	let gamepassSaves: Record<string, GamepassSave> = $state({});

	function resetState() {
		players = {};
		guilds = {};
		selectedPlayerUid = '';
		selectedPlayer = undefined;
		selectedPal = undefined;
		saveFile = undefined;
		playerSaveFiles = [];
		modifiedPals = {};
		modifiedPlayers = {};
	}

	// Handle selected player/pal updates
	function setSelectedPal(pal: Pal | undefined) {
		selectedPal = pal;
		if (pal) {
			modifiedPals[pal.instance_id] = pal;
		}
	}

	function setSelectedPlayer(player: Player | undefined) {
		selectedPlayer = player;
		selectedPal = undefined;
		if (player) {
			modifiedPlayers[player.uid] = player;
		}
	}

	async function saveState() {
		let modifiedData: ModifiedData = {};
		let modifiedPals: [string, Pal][] = [];
		let modifiedPlayers: [string, Player][] = [];

		for (const player of Object.values(appState.modifiedPlayers)) {
			if (player.state === EntryState.MODIFIED) {
				const { pals, ...playerWithoutPals } = player;
				playerWithoutPals.state = EntryState.NONE;
				modifiedPlayers = [...modifiedPlayers, [player.uid, playerWithoutPals]];
			}
			if (player.pals) {
				for (const pal of Object.values(player.pals)) {
					if (pal.state === EntryState.MODIFIED) {
						modifiedPals = [...modifiedPals, [pal.instance_id, pal]];
						pal.state = EntryState.NONE;
					}
				}
			}
		}

		for (const guild of Object.values(appState.guilds)) {
			if (guild.bases) {
				for (const base of Object.values(guild.bases)) {
					if (base.pals) {
						for (const pal of Object.values(base.pals)) {
							if (pal.state === EntryState.MODIFIED) {
								modifiedPals = [...modifiedPals, [pal.instance_id, pal]];
								pal.state = EntryState.NONE;
							}
						}
					}
				}
			}
		}

		if (modifiedPals.length === 0 && modifiedPlayers.length === 0) {
			console.log('No modifications to save');
			toast.add('No modifications to save', undefined, 'info');
			return;
		}

		if (modifiedPals.length > 0) {
			modifiedData.modified_pals = Object.fromEntries(modifiedPals);
		}

		if (modifiedPlayers.length > 0) {
			modifiedData.modified_players = Object.fromEntries(modifiedPlayers);
		}

		await goto('/loading');

		const data = {
			type: MessageType.UPDATE_SAVE_FILE,
			data: modifiedData
		};

		ws.send(JSON.stringify(data));

		const entityTypes = Object.keys(modifiedData).map((key) =>
			key.replace('modified', '').toLowerCase()
		);
		const entityMessage = entityTypes.join(' and ');
		ws.message = { type: MessageType.PROGRESS_MESSAGE, data: `Updating modified ${entityMessage}` };
	}

	return {
		get clipboardItem() {
			return clipboardItem;
		},
		set clipboardItem(item: ItemContainerSlot | null) {
			clipboardItem = item;
		},
		get players() {
			return players;
		},
		set players(newPlayers: Record<string, Player>) {
			players = newPlayers;
		},
		get guilds() {
			return guilds;
		},
		set guilds(newGuilds: Record<string, Guild>) {
			guilds = newGuilds;
		},

		get selectedPlayerUid() {
			return selectedPlayerUid;
		},
		set selectedPlayerUid(uid: string) {
			selectedPlayerUid = uid;
		},

		get selectedPlayer() {
			return selectedPlayer as Player;
		},
		set selectedPlayer(player: Player | undefined) {
			setSelectedPlayer(player);
		},

		get selectedPal() {
			return selectedPal;
		},
		set selectedPal(pal: Pal | undefined) {
			setSelectedPal(pal);
		},

		get saveFile() {
			return saveFile;
		},
		set saveFile(file: SaveFile | undefined) {
			saveFile = file;
		},

		get playerSaveFiles() {
			return playerSaveFiles;
		},
		set playerSaveFiles(files: SaveFile[]) {
			playerSaveFiles = files;
		},

		get progressMessage() {
			return progressMessage;
		},
		set progressMessage(message: string) {
			progressMessage = message;
		},

		get modifiedPals() {
			return modifiedPals;
		},

		get modifiedPlayers() {
			return modifiedPlayers;
		},

		get version() {
			return version;
		},
		set version(ver: string) {
			version = ver;
		},

		get settings() {
			return settings;
		},
		set settings(newSettings: AppSettings) {
			settings = newSettings;
		},
		get gamepassSaves() {
			return gamepassSaves;
		},
		set gamepassSaves(saves: Record<string, GamepassSave>) {
			gamepassSaves = saves;
		},
		resetState,
		saveState,
		resetModified() {
			modifiedPlayers = {};
			modifiedPals = {};
		}
	};
}

let appState: ReturnType<typeof createAppState>;

export function getAppState() {
	if (!appState) {
		appState = createAppState();
	}
	return appState;
}
