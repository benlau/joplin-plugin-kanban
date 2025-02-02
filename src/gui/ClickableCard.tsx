import React from "react";

import Card from "./Card";
import type { NoteData } from "../types";
import { useMainContext } from "./MainContext";
import ContextMenu from "./ContextMenu";

export default React.forwardRef<HTMLDivElement, { note: NoteData }>(
  ({ note }, ref) => {
    const {send, dispatch} = useMainContext();
    const handleClick = () => {
      send({
        type: "openNote",
        payload: { noteId: note.id },
      });
    };

    const handleMenu = React.useCallback((option: string) => {
      if (option === "Remove from Kanban") {
        dispatch({
          type: "removeNoteFromKanban",
          payload: { noteId: note.id },
        });
      }
    }, []); 

    return (
      <div ref={ref} onClick={handleClick}>
        <ContextMenu options={["Remove from Kanban"]} onSelect={handleMenu}>
            <Card note={note}/>
        </ContextMenu>
      </div>
    );
  }
);
