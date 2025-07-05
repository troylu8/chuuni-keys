import { readFile } from "@tauri-apps/plugin-fs";
import { USERDATA_DIR } from "./globals";
import { convertFileSrc } from "@tauri-apps/api/core";

type SFX = "hitsound"


const audioContext = new AudioContext();
await audioContext.audioWorklet.addModule(convertFileSrc(USERDATA_DIR + "\\soundtouch-worklet.js"));


const sfxBuffers: Map<SFX, AudioBuffer> = new Map([
    ["hitsound", await getAudioBuffer(USERDATA_DIR + "\\sfx\\hitsound.ogg")]
]);;

async function getAudioBuffer(filepath: string) {
    const bytes = await readFile(filepath);
    return await audioContext.decodeAudioData(bytes.buffer);
}

export function playSfx(sfx: SFX, volume: number = 1) {
    const source = audioContext.createBufferSource();
    source.buffer = sfxBuffers.get(sfx)!;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    
    // source -> gainNode -> dest
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start();
}


type PosListener = (pos: number) => any

class BgmPlayer {
    
    private readonly audio = new Audio();
    
    private readonly source = audioContext.createMediaElementSource(this.audio);
    private readonly gainNode = audioContext.createGain();
    
    private readonly posListeners = new Set<PosListener>();
    private posIntervalId?: NodeJS.Timeout;
    
    private _src: string | null = null;
    
    public onPlayOrPause?: (paused: boolean) => any; 
    public onDurationChange?: (duration: number) => any; 
    public onVolumeChange?: (volume: number) => any; 
    public onSpeedChange?: (speed: number) => any; 
    
    constructor() {
        // source -> gainNode -> dest
        this.source.connect(this.gainNode);
        this.gainNode.connect(audioContext.destination);
        this.audio.crossOrigin = "anonymous";
        this.audio.preload = "auto";
        
        this.audio.onloadedmetadata = () => {
            this.onDurationChange?.call(null, this.duration);
        }
    }
    
    public get src() {
        return this._src;
    }
    public set src(value) {
        this._src = value;
        if (value == null) {
            this.audio.src = "";
            this.onDurationChange?.call(null, 0);
        }
        else {
            this.audio.src = convertFileSrc(value);    
            this.audio.load();
        }
        this.onPlayOrPause?.call(null, true);
    }
    
    private callPosListeners() {
        for (const listener of this.posListeners) {
            listener(this.pos);
        }
    }
    
    public async play() {
        if (!this.paused) return;
        
        await this.audio.play();
        this.onPlayOrPause?.call(null, false);
        
        this.posIntervalId = setInterval(() => this.callPosListeners(), 0);
    }
    public pause() {
        if (this.paused) return;
        
        this.audio.pause();
        this.onPlayOrPause?.call(null, true);
        
        clearInterval(this.posIntervalId);
        this.posIntervalId = undefined;
    }
    
    public get paused() {
        return this.audio.paused;
    }
    
    public get volume() {
        return this.gainNode.gain.value;
    }
    public set volume(value: number) {
        this.gainNode.gain.value = Math.max(0, value);
        this.onVolumeChange?.call(null, value);
    }
    
    public get pos() {
        return this.audio.currentTime * 1000;
    }
    public set pos(value) {
        this.audio.currentTime = value / 1000;
        this.callPosListeners();
    }
    public addPosListener(listener: PosListener) {
        this.posListeners.add(listener);
        return () => { this.posListeners.delete(listener); }
    }
    
    public get duration() {
        return this.audio.duration * 1000;
    }
    
    public get speed() {
        return this.audio.playbackRate;
    }
    public set speed(value: number) {
        this.audio.playbackRate = Math.max(0, value);
        this.onSpeedChange?.call(null, value);
    }
}

const bgm = new BgmPlayer();
export default bgm;