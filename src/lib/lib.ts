import { appLocalDataDir, homeDir, resourceDir } from "@tauri-apps/api/path";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { readTextFile, exists, writeTextFile } from "@tauri-apps/plugin-fs";
import filenamify from "../deps/filenamify";

export const appWindow = getCurrentWindow();

export type Difficulty = "easy" | "normal" | "hard" | "fated";
export function compareDifficulty(a: { difficulty: Difficulty }, b: { difficulty: Difficulty }) {
    const orderedDiffs = ["easy", "normal", "hard", "fated"];
    return orderedDiffs.indexOf(a.difficulty) - orderedDiffs.indexOf(b.difficulty);
}

export type ChartMetadata = {
    id: string,
    online_id?: string,
    owner_hash?: string,
    
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


export function stringifyIgnoreNull(obj: any, spaces: number = 4) {
    return JSON.stringify(obj, (_, val) => val == null? undefined : val, spaces);
}

export function genRandStr(n: number = 10) {
    const symbols = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
    const res = [];
    for (let i = 0; i < n; i++) {
        res.push(symbols[Math.floor(Math.random() * 64)]);
    }
    return res.join("");
}

/**
 * Assumes the given element has an animation attached via className
 * https://stackoverflow.com/questions/6268508/restart-animation-in-css3-any-better-way-than-removing-the-element
*/
export function resetAnimation(element: HTMLElement) {
    
    // animation duration is sometimes dealt with in style={{...}}, 
    // so remember it before clearing animation properties defined in style={{...}}
    const duration = element.style.animationDuration;
    
    element.style.animation = "none";
    
    void element.offsetHeight;
    
    element.style.animation = "";
    element.style.animationDuration = duration;
}

export type Bind<T> = [T, (value: T) => void];


export const USERDATA_DIR = await appLocalDataDir() + "\\userdata";
export const RESOURCE_DIR = await resourceDir() + "\\resources";

export const SERVER_URL = "https://api-chuuni-keys.troylu.com";
// export const SERVER_URL = "http://localhost:44777";
export const OWNER_KEY = await getOwnerKey();

async function getOwnerKey() {
    const ownerKeyFilePath = await homeDir() + "\\.chuuni_identity";
    
    if (await exists(ownerKeyFilePath))
        return await readTextFile(ownerKeyFilePath);
    
    else {
        const ownerKey = genRandStr(32);
        await writeTextFile(ownerKeyFilePath, ownerKey);
        return ownerKey;
    }
}


type Flags = {
    lastActiveChartId?: string
    keyUnitsEnabled: boolean
    sfxVolume: number
    hitsoundVolume: number
}
export const flags: Flags = {
    keyUnitsEnabled: true,
    sfxVolume: 1,
    hitsoundVolume: 1,
};
export function getChartFolder({id, title}: {id: string, title: string}) {
    return `${USERDATA_DIR}\\charts\\${id} ${filenamify(title, {replacement: '_'})}`.trim();
}