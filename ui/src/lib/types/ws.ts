import type { Pal, Player } from './game';

export enum MessageType {
	ADD_PAL = 'add_pal',
	CLONE_PAL = 'clone_pal',
	DELETE_PALS = 'delete_pals',
	DOWNLOAD_SAVE_FILE = 'download_save_file',
	ERROR = 'error',
	GET_PLAYERS = 'get_players',
	GET_PAL_DETAILS = 'get_pal_details',
	LOAD_SAVE_FILE = 'load_save_file',
	LOAD_ZIP_FILE = 'load_zip_file',
	PROGRESS_MESSAGE = 'progress_message',
	SYNC_APP_STATE = 'sync_app_state',
	UPDATE_SAVE_FILE = 'update_save_file'
}

interface UpdateSaveFileData {
	modifiedPals: Record<string, Pal>;
	modifiedPlayers: Record<string, Player>;
}

export interface Message {
	type: MessageType;
	data?: any | UpdateSaveFileData;
}
