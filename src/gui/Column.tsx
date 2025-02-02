import React, { useContext } from "react";
import styled from "styled-components";
import { IoMdAdd } from "react-icons/io";

import type { NoteData } from "../types";
import { DispatchContext } from "./index";
import ContextMenu from "./ContextMenu";
import DraggableCard from "./DraggableCard";
import { useDroppableArea } from "./DragDrop";
import { useDebouncedFunc } from "../hooks/debouncer";
import { useRefState } from "./hooks"

const dragEventDebounceTime = 100;
const clickEventThrottleTime = 500;

export default function ({ name, notes }: { name: string; notes: NoteData[] }) {
  const dispatch = useContext(DispatchContext);
  const { dropRef, handlerId, isOver } = useDroppableArea({
    colName: name,
    notesLength: notes.length,
  });

  const [isNoteDragOver, setIsNoteOver] = React.useState(false);
  const _setIsNoteOverDebounced = useDebouncedFunc(async (value: boolean) => setIsNoteOver(false), dragEventDebounceTime);
  const setIsNotOverDebounced = React.useCallback((value: boolean) => {
    _setIsNoteOverDebounced(value).catch(() => {
    });
  }, [_setIsNoteOverDebounced]);

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('text/x-jop-note-ids')) {
      e.dataTransfer.dropEffect = 'link';
      e.preventDefault();
      e.stopPropagation();
      setIsNoteOver(true);
      // For canelling previous action
      setIsNotOverDebounced(true);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsNoteOver(false);
    // For canelling previous action
    setIsNotOverDebounced(false);
    let noteIds: string[] = [];   
    try {
      noteIds = JSON.parse(e.dataTransfer.getData('text/x-jop-note-ids'));
    } catch {
      noteIds = [];
    }
  
    for (let index = noteIds.length - 1; index >= 0; index--) {
      const noteId = noteIds[index];
      await dispatch({
        type: "insertNoteToColumn",
        payload: {
          noteId,
          columnName: name,
          index: 0
        }
      });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Don't set to false immediately
    // The child item will take drag event and trigger drag leave
    // but it won't handle it and will trigger drag over again
    setIsNotOverDebounced(false);
  };

  const handleMenu = (selected: string) => {
    if (selected === "Edit")
      dispatch({ type: "settings", payload: { target: `columns.${name}` } });
    else if (selected === "Delete") {
      dispatch({ type: "deleteCol", payload: { colName: name } });
    }
  };

  const [isNewNoteDisabled, setIsNewNoteDisabled, ] = useRefState(false);

  const handleNewNote = () => {
    if (isNewNoteDisabled.current) return;
    
    setIsNewNoteDisabled(true);
    setTimeout(() => setIsNewNoteDisabled(false), clickEventThrottleTime);

    dispatch({
      type: "newNote",
      payload: {
        colName: name,
      },
    });
  };

  return (
    <Column>
      <ContextMenu options={["Edit", "Delete"]} onSelect={handleMenu}>
        <ColumnHeader>
          {name}{" "}
          <AddIconCont onClick={handleNewNote}>
            <IoMdAdd size="25px" />
          </AddIconCont>{" "}
        </ColumnHeader>
      </ContextMenu>
      <DroppableAreaContainer
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
        draggingOver={isOver || isNoteDragOver}
        >
      <DroppableArea
        ref={dropRef}
        data-handler-id={handlerId}
        isVisible={!isNoteDragOver}
      >
        {notes.map((note, idx) => (
          <DraggableCard key={note.id} colName={name} note={note} index={idx}/>
        ))}
        </DroppableArea>
      </DroppableAreaContainer>
    </Column>
  );
}

const Column = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  width: "300px",
  minWidth: "200px",
  padding: "0 15px",
  "& + &": {
    borderLeft: "1px #DDDDDD solid",
  },
});

const ColumnHeader = styled("div")({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "1.1rem",
  fontWeight: "bold",
  marginBottom: "20px",
  userSelect: "none",
});

const AddIconCont = styled("span")({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginLeft: "auto",
  borderRadius: "5px",

  "&:hover": {
    backgroundColor: "var(--joplin-background-color-hover3)",
  },
  "& > svg": {
    width: "1.5em",
    height: "1.5em",
    color: "var(--joplin-color3)",
  },
});

const DroppableAreaContainer = styled("div")<{ draggingOver: boolean }>(
  ({draggingOver}) => ({
  minHeight: "200px",
  height: "100%",
  overflowY: "auto",
  border: draggingOver ? "royalblue solid 1px" : "unset",
  boxShadow: draggingOver
  ? "0px 0px 6px 3px rgba(4, 164, 255, 0.41) inset"
  : "unset",
}));

const DroppableArea = styled("div")<{ isVisible?: boolean }>(
  ({ isVisible = true }) => ({
    height: "100%",
    borderRadius: "5px",
    transition: "box-shadow linear 0.2s",
    visibility: isVisible ? "visible" : "hidden",
    pointerEvents: isVisible ? "auto" : "none"
  })
);
