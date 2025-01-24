import joplin from 'api';

type NoteChangeListener = (noteId: string) => Promise<boolean>;

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

    openNote(noteId: string) {
        joplin.commands.execute("openNote", noteId);
    }

    onNoteChange(listener: NoteChangeListener) {
        this.onNoteChangeListeners.push(listener);
    }

    onNoteSelectionChange(listener: NoteChangeListener) {
        this.onNoteSelectionChangeListeners.push(listener);
    }   

}
