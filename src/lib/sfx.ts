import { BaseDirectory } from "@tauri-apps/api/path";
import { readFile } from "@tauri-apps/plugin-fs";

export enum SFX { HITSOUND }


const audioContext = new AudioContext();
let audioBuffers: Map<SFX, AudioBuffer> | null = null;

async function getAudioBuffer(path: string) {
    const bytes = await readFile(path, {baseDir: BaseDirectory.AppLocalData});
    return await audioContext.decodeAudioData(bytes.buffer);
}

(async () => {
    audioBuffers = new Map([
        [SFX.HITSOUND, await getAudioBuffer("userdata\\sfx\\hitsound.ogg")]
    ]);
})();

export default function playSfx(sfx: SFX) {
    if (!audioBuffers) return;
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffers.get(sfx)!;
    source.connect(audioContext.destination);
    source.start();
}