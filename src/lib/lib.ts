import { appLocalDataDir } from "@tauri-apps/api/path";
import filenamify from "filenamify";

export enum Difficulty {
    EASY = 0,
    MEDIUM = 1,
    HARD = 2,
    FATED = 2,
}

export type ChartMetadata = {
    id: string,
    title: string,
    difficulty: Difficulty
    
    bpm: number,
    first_beat: number,
    preview_time: number,
    measure_size: number,
    snaps: number,
    
    audio_ext: string,
    img_ext?: string,
    
    credit_audio?: string,
    credit_img?: string,
    credit_chart?: string,
}


export function stringifyIgnoreNull(obj: any) {
    return JSON.stringify(obj, (_, val) => val == null? undefined : val, 4);
}

/**
 * Assumes the given element has an animation attached via className
 * https://stackoverflow.com/questions/6268508/restart-animation-in-css3-any-better-way-than-removing-the-element
*/
export function resetAnimation(element: HTMLElement) {
    element.style.animation = "none";
    void element.offsetHeight;
    element.style.animation = "";
}

export type Bind<T> = [T, (value: T) => void];

export const USERDATA_DIR = await appLocalDataDir() + "\\userdata";
export const SERVER_URL = "http://localhost:5000";


type Flags = {
    keyUnitsEnabled: boolean
    lastActiveChartId: string | null
    sfxVolume: number
    hitsoundVolume: number
}
export const flags: Flags = {
    keyUnitsEnabled: true,
    lastActiveChartId: null,
    sfxVolume: 1,
    hitsoundVolume: 1,
};
export function getChartFolder({id, title}: {id: string, title: string}) {
    return `${USERDATA_DIR}\\charts\\${id} ${filenamify(title, {replacement: '_'})}`.trim();
}
