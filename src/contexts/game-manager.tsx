import { BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';
import { EventEmitter } from 'events';
import { useState, createContext, useContext, useEffect, useRef } from "react";
import { useBgmState } from "./bgm-state";
import { Page, usePage } from "./page";
import { getChartFolder as getChartFolder, flags, ChartMetadata } from '../lib/lib';
import bgm from '../lib/sound';
import { useSettings } from './settings';

export enum GameStage { LOADING, STARTED, ENDED };
const GameStageContext = createContext<[GameStage, (next: GameStage) => any] | null>(null);

type RestartGame = () => void;
type StopGame = () => void;
const ControlsContext = createContext<[RestartGame, StopGame] | null>(null);

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
    const contents = await readTextFile(path, {baseDir: BaseDirectory.AppLocalData});
    return contents === '' ? [] : contents.trim().split("\n").map(toMuseEvent);
}


type Props = Readonly<{
    children: React.ReactNode;
}>
export default function GameManager({ children }: Props) {
    const [[,params], setPage] = usePage();
    
    const { paused } = useBgmState();
    const [{ offset },, activationDuration] = useSettings();
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
        flags.keyUnitsEnabled = true;
        museEmitter.setMaxListeners(100);
        
        const metadata = params as ChartMetadata;
        
        (async () => {
            const chartFolder = getChartFolder(metadata);
            bgm.src = `${chartFolder}\\audio.${metadata.audio_ext}`;
            const events = await readChartFile(chartFolder + "\\chart.txt");
            
            resetEvents();
                
            const otherEvents: MuseEvent[] = [];
            const noteEvents: MuseEvent[] = [];          // arr of [activation time, :key, hit time]
            for (const event of events) {
                if (event[1].startsWith(":") || event[1].startsWith(".")) {
                    noteEvents.push([Math.max(event[0] - activationDuration, 0), event[1], event[0]]);
                }
                else {
                    otherEvents.push(event);
                }
            }
            
            eventsRef.current = joinEvents(otherEvents, noteEvents);
            
            await bgm.play();
            setGameStage(GameStage.STARTED);
        })();
    }, []);
    
    // disable key presses when paused
    useEffect(() => { flags.keyUnitsEnabled = !paused }, [paused]);
    
    // game loop
    useEffect(() => {
        if (gameStage != GameStage.STARTED || paused) return;
        
        if (i.current == 0) museEmitter.emit("start");
        
        const lastEventTime = eventsRef.current[eventsRef.current.length-1][0];
        
        const unlisten = bgm.addPosListener(pos => {
            const offsetPos = pos + offset;
            
            // send all ready muse events
            while (i.current < eventsRef.current.length) {
                const nextEvent = eventsRef.current[i.current];
                if (offsetPos >= nextEvent[0]) {
                    museEmitter.emit(nextEvent[1], nextEvent[0], nextEvent[2]);
                    i.current++;
                }
                else break;
            }
            
            if (offsetPos > lastEventTime + 5000) {
                resetEvents();
                setGameStage(GameStage.ENDED);
            }
            
        });
        
        return unlisten;
    }, [gameStage, paused]);
    
    function restartGame() {
        i.current = 0;
        bgm.pos = 0;
        bgm.play();
    }
    function stopGame() {
        setPage([Page.CHART_SELECT]);
        bgm.pause();
    }
    
    function addMuseListener(event: string, listener: (...params: any[]) => any) {
        museEmitter.addListener(event, listener);
        return () => { museEmitter.removeListener(event, listener); }
    }
    
    return (
        <GameStageContext.Provider value={[gameStage, setGameStage]}>
            <ControlsContext.Provider value={[restartGame, stopGame]}>
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