import { readTextFile } from '@tauri-apps/plugin-fs';
import { EventEmitter } from 'events';
import Queue from 'yocto-queue';
import { useState, createContext, useContext, useEffect, useRef } from "react";
import { usePlayback } from "./playback";
import { GameInfo, Page, usePage } from "./page";

export const HITRING_DURATION = 400;

export enum GameState { LOADING, STARTED, ENDED };
const GameStateContext = createContext<[GameState, (next: GameState) => any] | null>(null);

type TogglePauseGame = () => void;
type StopGame = () => void;
const ControlsContext = createContext<[boolean, TogglePauseGame, StopGame] | null>(null);

type RemoveMuseListener = () => void;
type AddMuseListener = (event: string, listener: (params: any) => any) => RemoveMuseListener;
const MuseEventsContext = createContext<AddMuseListener | null>(null);

export function useGameState() {
    return useContext(GameStateContext)!;
}

export function useGameControls() {
    return useContext(ControlsContext)!;
}

export function useMuseEvents() {
    return useContext(MuseEventsContext)!;
}

type MuseEvent = [number, string];
function toMuseEvent(str: string): MuseEvent {
    const arr = str.trim().split(" ");
    return (arr[1].startsWith(":"))?
        [Number(arr[0]) - HITRING_DURATION, arr[1]] :   // send hitring events before the actual hit
        [Number(arr[0]), arr[1]];
}




type Props = Readonly<{
    children: React.ReactNode;
}>
export default function GameStateProvider({ children }: Props) {
    const [pageParams, setPage] = usePage();
    
    const [playing, loadAudio, setAudioPlaying, getPosition] = usePlayback();
    const [gameState, setGameState] = useState(GameState.LOADING);
    
    const museEmitter = useRef(new EventEmitter()).current;
    
    const eventQueue = useRef<Queue<MuseEvent>>(new Queue()).current;
    
    const rafId = useRef<number | null>(null);
    
    useEffect(() => {
        const { audioPath, chartPath } = pageParams[1] as GameInfo;
        
        loadAudio(audioPath);
        readTextFile(chartPath)
        .then(contents => {
            eventQueue.clear();
            for (const line of contents.trim().split("\n")) {
                eventQueue.enqueue(toMuseEvent(line));
            }
            
            setGameState(GameState.STARTED);
            setAudioPlaying(true);
        });
        
        return () => {
            eventQueue.clear();
        }
    }, []);
    
    // game loop
    useEffect(() => {
        if (gameState != GameState.STARTED) return;
        if (!playing) return stop();
        
        function stop() {
            if (rafId.current) cancelAnimationFrame(rafId.current);
            rafId.current = null;
        }
        
        function update() {
            
            museEmitter.emit("update");
            
            // send all ready muse events
            let nextEvent;
            while (nextEvent = eventQueue.peek()) {
                if (getPosition() >= nextEvent[0]) {
                    
                    if (nextEvent[1] == "end") {
                        console.log(nextEvent);
                        setGameState(GameState.ENDED);
                        eventQueue.clear();
                    }
                    else {
                        museEmitter.emit(nextEvent[1], nextEvent[0]);
                        eventQueue.dequeue();
                    }
                    
                }
                else break;
            }
            
            if (rafId.current) rafId.current = requestAnimationFrame(update);
        }
        rafId.current = requestAnimationFrame(update);
        
        return stop;
    }, [gameState, playing]);
    
    async function togglePauseGame() {
        await setAudioPlaying(!playing);
    }
    function stopGame() {
        setPage([Page.SONG_SELECT]);
    }
    
    function addEventListener(event: string, listener: (time: number) => any) {
        museEmitter.addListener(event, listener);
        museEmitter.setMaxListeners(200);
        return () => { museEmitter.removeListener(event, listener); }
    }
    
    return (
        <GameStateContext.Provider value={[gameState, setGameState]}>
            <ControlsContext.Provider value={[playing, togglePauseGame, stopGame]}>
                <MuseEventsContext.Provider value={addEventListener}>
                    { children }
                </MuseEventsContext.Provider>
            </ControlsContext.Provider>
        </GameStateContext.Provider>
    );
}
