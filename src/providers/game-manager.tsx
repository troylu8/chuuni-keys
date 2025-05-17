import { readTextFile } from '@tauri-apps/plugin-fs';
import { EventEmitter } from 'events';
import { useState, createContext, useContext, useEffect, useRef } from "react";
import { usePlayback } from "./playback";
import { GamePaths, Page, usePage } from "./page";

export const HITRING_DURATION = 300;

export enum GameState { LOADING, STARTED, ENDED };
const GameStateContext = createContext<[GameState, (next: GameState) => any] | null>(null);

type TogglePauseGame = () => void;
type RestartGame = () => void;
type StopGame = () => void;
const ControlsContext = createContext<[boolean, TogglePauseGame, RestartGame, StopGame] | null>(null);

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
export default function GameManager({ children }: Props) {
    const [pageParams, setPage] = usePage();
    
    const [playing, loadAudio, setAudioPlaying, getPosition, seekAudio] = usePlayback();
    const [gameState, setGameState] = useState(GameState.LOADING);
    
    const museEmitter = useRef(new EventEmitter()).current;
    
    const eventsRef = useRef<MuseEvent[]>([]);
    const i = useRef(0);
    function resetEvents() {
        console.log("reset");
        i.current = 0;
        eventsRef.current = [];
    }
    
    
    useEffect(() => {
        
        const { audioPath, chartPath } = pageParams[1] as GamePaths;
        
        loadAudio(audioPath);
        readTextFile(chartPath)
        .then(contents => {
            resetEvents();
            for (const line of contents.trim().split("\n")) {
                eventsRef.current.push(toMuseEvent(line));
            }
            setGameState(GameState.STARTED);
            setAudioPlaying(true);
        });
        
    }, []);
    
    // game loop
    useEffect(() => {
        if (gameState != GameState.STARTED || !playing) return;
        
        let intervalId = setInterval(update, 0);
        
        museEmitter.emit("start");
        
        function update() {
            
            museEmitter.emit("update", getPosition());
            
            
            // send all ready muse events
            while (i.current < eventsRef.current.length) {
                const nextEvent = eventsRef.current[i.current];
                if (getPosition() >= nextEvent[0]) {
                    
                    if (nextEvent[1] == "end") {
                        setGameState(GameState.ENDED);
                        resetEvents();
                    }
                    else {
                        museEmitter.emit(nextEvent[1], nextEvent[0]);
                        i.current++;
                    }
                    
                }
                else break;
            }
            
        }
        
        return () => clearInterval(intervalId);
    }, [gameState, playing]);
    
    async function togglePauseGame() {
        await setAudioPlaying(!playing);
    }
    function restartGame() {
        i.current = 0;
        seekAudio(0);
        setAudioPlaying(true);
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
            <ControlsContext.Provider value={[playing, togglePauseGame, restartGame, stopGame]}>
                <MuseEventsContext.Provider value={addEventListener}>
                    { children }
                </MuseEventsContext.Provider>
            </ControlsContext.Provider>
        </GameStateContext.Provider>
    );
}

