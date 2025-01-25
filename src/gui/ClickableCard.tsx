import React from "react";

import Card from "./Card";
import type { NoteData } from "../types";
import { useMainContext } from "./MainContext";

export default React.forwardRef<HTMLDivElement, { note: NoteData }>(
  ({ note }, ref) => {
    const {send} = useMainContext();
    const handleClick = () => {
      send({
        type: "openNote",
        payload: { noteId: note.id },
      });
    };

    return (
      <div ref={ref} onClick={handleClick}>
        <Card note={note} />
      </div>
    );
  }
);
