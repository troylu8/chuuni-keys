import { readFile } from "@tauri-apps/plugin-fs";
import { USERDATA_DIR } from "./globals";
import { convertFileSrc } from "@tauri-apps/api/core";

export enum SFX { HITSOUND }


const audioContext = new AudioContext();
await audioContext.audioWorklet.addModule(convertFileSrc(USERDATA_DIR + "\\soundtouch-worklet.js"));


const sfxBuffers: Map<SFX, AudioBuffer> = new Map([
    [SFX.HITSOUND, await getAudioBuffer(USERDATA_DIR + "\\sfx\\hitsound.ogg")]
]);;

async function getAudioBuffer(filepath: string) {
    const bytes = await readFile(filepath);
    return await audioContext.decodeAudioData(bytes.buffer);
}

export default function playSfx(sfx: SFX, volume: number = 1) {
    const source = audioContext.createBufferSource();
    source.buffer = sfxBuffers.get(sfx)!;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    
    // source -> gainNode -> dest
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start();
}


export class AudioPlayer {
    
    public src?: string;
    public playing: boolean = false;
    public volume: number = 1;
    public speed: number = 1;
    
    private source?: AudioBufferSourceNode;
    private buffer?: AudioBuffer;
    private startTime?: number;
    
    public async load(src: string) {
        this.src = src;
        this.playing = false;
        
        this.buffer = await getAudioBuffer(src);
    }
    
    private playFrom(seconds: number) {
        if (this.source) this.source.stop();
        
        // source -> gainNode -> soundtouch? -> dest
        
        this.source = audioContext.createBufferSource();
        this.source.buffer = this.buffer!;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = this.volume;
        this.source.connect(gainNode);
        
        // speeding up audio with soundtouch sounds choppy
        // if speeding up, accept that the pitch will not be preserved and directly edit source.playbackRate
        if (this.speed > 1) {
            this.source.playbackRate.value = this.speed;
            gainNode.connect(audioContext.destination);
        }
        
        // if slowing down, then there is no problem with using soundtouch to slow down while preserving pitch
        else {
            const soundtouch = new AudioWorkletNode(audioContext, 'soundtouch-processor');
            soundtouch.parameters.get("tempo")!.value = this.speed;
            
            gainNode.connect(soundtouch);
            soundtouch.connect(audioContext.destination);
        }
        
        this.source.start(0, seconds);
    }
    
    public play() {
        if (this.playing) return;
        this.playFrom(0);
        
        this.playing = true;
        this.startTime = audioContext.currentTime;
    }
    
    public get position() {
        return this.startTime == undefined? 0 : audioContext.currentTime - this.startTime;
    }
    
    public setVolume(volume: number) {
        this.volume = Math.max(0, volume);
        if (this.playing)
            this.playFrom(this.position);
    }
    
    public setSpeed(speed: number) {
        this.speed = Math.max(0, speed);
        if (this.playing)
            this.playFrom(this.position);
    }
    
    
}