import { useEffect, useState, useCallback, useRef } from "react";

import type { BoardState } from "../types";
import type { Action } from "../actions";

interface State {
  board?: BoardState;
}

export type DispatchFn = (action: Action) => Promise<void>;

export function useRemoteBoard(): [BoardState | undefined, DispatchFn, DispatchFn] {
  const [state, setState] = useState<State>({});

  const dispatch: DispatchFn = useCallback(async (action: Action) => {
    const newBoard: BoardState = await webviewApi.postMessage(action);
    setState({ board: newBoard });
  }, []);

  const send = useCallback(async (action: Action) => {
    return webviewApi.postMessage(action);
  }, []);

  useEffect(() => {
    dispatch({ type: "load" });
  }, []);

  return [state.board, dispatch, send];
}

export function useRefState<T>(initialValue: T): [React.RefObject<T>, (value: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const ref = useRef<T>(state);

  const dispatch = useCallback((value: T) => {
    ref.current = value;
    setState(value);
  }, []);

  return [ref, dispatch];
} 
