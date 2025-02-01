import joplin from 'api';
import { tryWaitUntilTimeout } from '../utils/timer';
import { JoplinTag, NoteData, NoteDataMonad } from '../types';

type NoteChangeListener = (noteId: string) => Promise<boolean>;

const DEFAULT_TIMEOUT = 500;

export class JoplinService {
    onNoteChangeListeners: NoteChangeListener[] = [];
    onNoteSelectionChangeListeners: NoteChangeListener[] = [];

    start() {
        joplin.workspace.onNoteChange(async ({ id }) => {
            this.onNoteChangeListeners = (await Promise.all(
              this.onNoteChangeListeners.map(listener => listener(id))
            )).map((keep, i) => keep ? this.onNoteChangeListeners[i] : null)
            .filter((listener) => listener !== null) as NoteChangeListener[];
        });

        joplin.workspace.onNoteSelectionChange(async ({ value } : {value: [string?]}) => {
            this.onNoteSelectionChangeListeners = (await Promise.all(
              this.onNoteSelectionChangeListeners.map(listener => listener(value?.[0] as string))
            )).map((keep, i) => keep ? this.onNoteSelectionChangeListeners[i] : null)
            .filter((listener) => listener !== null) as NoteChangeListener[];
        });
    }

    async getSelectedNotebookId(): Promise<string> {
        const selectedFolder = await joplin.workspace.selectedFolder();
        return selectedFolder.id;
    }

    async createUntitledNote(): Promise<string> {
        const selectedNote = await joplin.workspace.selectedNote();
        joplin.commands.execute("newNote");
        return await new Promise(resolve => {
            let isResolved = false;
            const func = async (id: string) => {
                if (isResolved) {
                    return false;
                } else if (id !== selectedNote.id) {
                    isResolved = true;
                    resolve(id);
                    return false;
                } else {
                    return true;
                }
            }

            this.onNoteChange(func);
            this.onNoteSelectionChange(func);
        });
    }

    async getNoteDataById(noteId: string): Promise<NoteData> {
        const note = await joplin.data.get(["notes", noteId]);
        const tags = await joplin.data.get(["notes", noteId, "tags"]);
        const noteData = NoteDataMonad.fromJoplinNote(
            note).setTagsFromJoplinTagList(tags.items).data;
        return noteData;
    }

    openNote(noteId: string) {
        joplin.commands.execute("openNote", noteId);
    }

    onNoteChange(listener: NoteChangeListener) {
        this.onNoteChangeListeners.push(listener);
    }

    onNoteSelectionChange(listener: NoteChangeListener) {
        this.onNoteSelectionChangeListeners.push(listener);
    }

    async waitUntilNoteAvailable(noteId: string, timeout: number = DEFAULT_TIMEOUT) {
        try {
            const promise = new Promise((resolve) => {
                tryWaitUntilTimeout(async () => {
                    const query = `id:${noteId}`;
                    const note = await joplin.data.get(["search"], { query });
                    if (note.items.length > 0) {
                        resolve(note.items[0]);
                        return true;
                    } else {
                        return false;
                    }
                }, timeout);           
            });
            return await promise;
        } catch (e) {
            return null;
        }
    }
}
