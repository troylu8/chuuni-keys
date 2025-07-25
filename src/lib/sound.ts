import { readFile } from "@tauri-apps/plugin-fs";
import { appWindow, flags, RESOURCE_DIR } from "./lib";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getBeatDuration } from "../pages/editor/inspector";
import { useEffect } from "react";
import { useBgmState } from "../contexts/bgm-state";




const audioContext = new AudioContext();

type SFX = "hitsound"


const sfxBuffers: Map<SFX, AudioBuffer> = new Map([
    ["hitsound", await getAudioBuffer(RESOURCE_DIR + "\\sfx\\hitsound.ogg")]
]);


async function getAudioBuffer(filepath: string) {
    const bytes = await readFile(filepath);
    return await audioContext.decodeAudioData(bytes.buffer);
}

export function playSfx(sfx: SFX) {
    const source = audioContext.createBufferSource();
    source.buffer = sfxBuffers.get(sfx)!;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = sfx == "hitsound" ? flags.hitsoundVolume : flags.sfxVolume;
    
    // source -> gainNode -> dest
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start();
}


type PosListener = (pos: number) => any
type BeatListener = (beat: number) => any
type BgmInfo = {
    title?: string
    credit_audio?: string
    bpm?: number
    first_beat?: number
}

class BgmPlayer {
    
    private readonly audio = new Audio();
    
    private readonly source = audioContext.createMediaElementSource(this.audio);
    private readonly gainNode = audioContext.createGain();
    
    private readonly posListeners = new Set<PosListener>();
    private readonly beatListeners = new Set<BeatListener>();
    private playingLoop?: NodeJS.Timeout;
    
    private _src: string | null = null;
    private _volume = 1;
    private _bpm?: number;
    private _first_beat?: number;
    
    public onLoad?: (info?: BgmInfo) => any;
    public onPlayOrPause?: (paused: boolean) => any; 
    public onDurationChange?: (duration: number) => any; 
    public onVolumeChange?: (volume: number) => any; 
    public onSpeedChange?: (speed: number) => any; 
    public onEnd?: () => any;
    
    constructor() {
        // source -> gainNode -> dest
        this.source.connect(this.gainNode);
        this.gainNode.connect(audioContext.destination);
        this.audio.crossOrigin = "anonymous";
        this.audio.preload = "auto";
        
        this.audio.onloadedmetadata = () => {
            this.onDurationChange?.call(null, this.duration);
        }
        this.audio.onended = () => {
            this.onPlayOrPause?.call(null, true);
            this.onEnd?.call(null);
        }
        
        appWindow.onResized(async () => {
            this.gainNode.gain.value = await appWindow.isMinimized() ? 0 : this._volume;
        });
    }
    
    public get src() {
        return this._src;
    }
    public load(src: string | null, info?: BgmInfo) {
        this._src = src;
        if (src == null) {
            this.audio.src = "";
            this.onDurationChange?.call(null, 0);
        }
        else {
            this.audio.src = convertFileSrc(src);    
            this.audio.load();
        }
        this._bpm = info?.bpm;
        this._first_beat = info?.first_beat;
        this.onLoad?.call(null, info);
        this.onPlayOrPause?.call(null, true);
    }
    
    public clear() {
        this.load(null);
    }
    
    private callPosListeners() {
        for (const listener of this.posListeners) {
            listener(this.pos);
        }
    }
    private callBeatListeners(beat: number) {
        for (const listener of this.beatListeners) {
            listener(beat);
        }
    }
    
    public async play() {
        if (!this.paused || this.src === null) return;
        
        await this.audio.play();
        this.onPlayOrPause?.call(null, false);
        
        let prevBeat: number | null = null;
        this.playingLoop = setInterval(() => {
            this.callPosListeners();
            
            if (this._bpm != undefined && this._first_beat != undefined) {
                const beat = Math.floor((this.pos - this._first_beat) / getBeatDuration(this._bpm));
                
                if (prevBeat !== null && beat === prevBeat + 1) 
                    this.callBeatListeners(beat);
                
                prevBeat = beat;
            }
        }, 0);
    }
    public pause() {
        if (this.paused) return;
        
        this.audio.pause();
        this.onPlayOrPause?.call(null, true);
        
        clearInterval(this.playingLoop);
        this.playingLoop = undefined;
    }
    
    public get paused() {
        return this.audio.paused;
    }
    
    public get volume() {
        return this._volume;
    }
    public set volume(value: number) {
        this._volume = Math.max(0, value);
        this.gainNode.gain.value = this._volume;
        this.onVolumeChange?.call(null, this._volume);
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
    
    public addBeatListener(listener: BeatListener) {
        this.beatListeners.add(listener);
        return () => { this.beatListeners.delete(listener); }
    }
}

const bgm = new BgmPlayer();
export default bgm;

/** returns the duration of one beat */
export function useOnBeat(onBeat: BeatListener) {
    const { bpm } = useBgmState();
    
    
    useEffect(() => {
        const unlisten = bgm.addBeatListener(onBeat);
        return unlisten;
    }, []);
    
    return bpm && getBeatDuration(bpm);
}