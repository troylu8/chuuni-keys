import { readTextFile } from '@tauri-apps/plugin-fs';
import { EventEmitter } from 'events';
import { useState, createContext, useContext, useEffect, useRef } from "react";
import { usePlayback } from "./playback";
import { ChartParams, Page, usePage } from "./page";

export const ACTIVATION_DURATION = 2000;
export const HITRING_DURATION = 300;

export enum GameStage { LOADING, STARTED, ENDED };
const GameStageContext = createContext<[GameStage, (next: GameStage) => any] | null>(null);

type TogglePauseGame = () => void;
type RestartGame = () => void;
type StopGame = () => void;
const ControlsContext = createContext<[boolean, TogglePauseGame, RestartGame, StopGame] | null>(null);

type RemoveMuseListener = () => void;
type AddMuseListener = (event: string, listener: (...params: any[]) => any) => RemoveMuseListener;
const MuseEventsContext = createContext<AddMuseListener | null>(null);

export function useGameStage() {
    return useContext(GameStageContext)!;
}

export function useGameControls() {
    return useContext(ControlsContext)!;
}

export function useMuseEvents() {
    return useContext(MuseEventsContext)!;
}

export type MuseEvent = [number, string, number?];
function toMuseEvent(str: string): MuseEvent {
    const arr = str.trim().split(" ");
    return [Number(arr[0]), arr[1]];
}
export async function readChartFile(path: string) {
    const contents = await readTextFile(path);
    return contents.trim().split("\n").map(toMuseEvent);
}


type Props = Readonly<{
    children: React.ReactNode;
}>
export default function GameManager({ children }: Props) {
    const [pageParams, setPage] = usePage();
    
    const aud = usePlayback();
    const [gameStage, setGameStage] = useState(GameStage.LOADING);
    
    const museEmitter = useRef(new EventEmitter()).current;
    
    const i = useRef(0);
    const eventsRef = useRef<MuseEvent[]>([]);
    function resetEvents() {
        i.current = 0;
        eventsRef.current = [];
    }
    
    // initialize
    useEffect(() => {
        const { audio, chart } = pageParams[1] as ChartParams;
        
        aud.loadAudio(audio);
        readChartFile(chart).then(events => {
            resetEvents();
            
            const otherEvents: MuseEvent[] = [];
            const noteEvents: MuseEvent[] = [];          // arr of [activation time, :key, hit time]
            for (const event of events) {
                if (event[1].includes(":")) {
                    noteEvents.push([Math.max(event[0] - ACTIVATION_DURATION, 0), event[1], event[0]]);
                }
                else {
                    otherEvents.push(event);
                }
            }
            eventsRef.current = joinEvents(otherEvents, noteEvents);
            console.log(eventsRef, otherEvents, noteEvents);
            setGameStage(GameStage.STARTED);
            aud.setPlaying(true);
        });
    }, []);
    
    
    // game loop
    useEffect(() => {
        if (gameStage != GameStage.STARTED || !aud.playing) return;
        
        
        if (i.current == 0) {
            museEmitter.emit("start");
            console.log(eventsRef);
        }
        
        let intervalId = setInterval(update, 0);
        function update() {
            museEmitter.emit("pos-change", aud.getPosition());
            
            // send all ready muse events
            while (i.current < eventsRef.current.length) {
                const nextEvent = eventsRef.current[i.current];
                if (aud.getPosition() >= nextEvent[0]) {
                    console.log("emitting", nextEvent);
                    museEmitter.emit(nextEvent[1], nextEvent[0], nextEvent[2]);
                    i.current++;
                }
                else break;
            }
            
            if (i.current == eventsRef.current.length) {
                resetEvents();
                clearInterval(intervalId);
                console.log("ending soon at", aud.getPosition());
                setTimeout(() => setGameStage(GameStage.ENDED), 5000);
                
                //TODO why doesnt last ring appear?
            }
        }
        
        return () => clearInterval(intervalId);
    }, [gameStage, aud.playing]);
    
    async function togglePauseGame() {
        await aud.togglePlaying();
    }
    function restartGame() {
        i.current = 0;
        aud.seek(0);
        aud.setPlaying(true);
    }
    function stopGame() {
        setPage([Page.SONG_SELECT]);
    }
    
    function addMuseListener(event: string, listener: (...params: any[]) => any) {
        museEmitter.addListener(event, listener);
        museEmitter.setMaxListeners(200);
        return () => { museEmitter.removeListener(event, listener); }
    }
    
    return (
        <GameStageContext.Provider value={[gameStage, setGameStage]}>
            <ControlsContext.Provider value={[aud.playing, togglePauseGame, restartGame, stopGame]}>
                <MuseEventsContext.Provider value={addMuseListener}>
                    { children }
                </MuseEventsContext.Provider>
            </ControlsContext.Provider>
        </GameStageContext.Provider>
    );
}

function joinEvents(a: MuseEvent[], b: MuseEvent[]) {
    const res = [];
    let p1 = 0;
    let p2 = 0;
    
    while (p1 < a.length || p2 < b.length) {
        if (p2 == b.length || (p1 < a.length && a[p1][0] < b[p2][0])) {
            res.push(a[p1]);
            p1++;
        }
        else {
            res.push(b[p2]);
            p2++;
        }
    }
    
    return res;
}