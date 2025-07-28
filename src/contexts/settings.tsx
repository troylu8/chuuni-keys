import { useState, createContext, useContext, useEffect } from "react";
import { appWindow, flags } from "../lib/lib";
import bgm from "../lib/sound";

/** activation duration = hitring duration + this value */
const ACTIVATION_BUFFER = 500;

export type Settings = {
    offset: number
    hitringDuration: number
    musicVolume: number
    sfxVolume: number
    hitsoundVolume: number
    showCombo: boolean
    showAccuracyBar: boolean
    fullscreen: boolean
}

type SetSettings = (setting: keyof Settings, value: Settings[keyof Settings]) => void;
const SettingsContext = createContext<[Settings, SetSettings, number] | null>(null);

export function useSettings() {
    return useContext(SettingsContext)!;
}

type SettingsHooks = {
    [K in keyof Settings]?: (val: Settings[K]) => any
};

let maximizedBeforeFullscreen = false;

/** code to run when a setting is initialized/changed */
const SETTINGS_HOOKS: SettingsHooks = {
    "musicVolume": vol => bgm.volume = vol,
    "sfxVolume": vol => flags.sfxVolume = vol,
    "hitsoundVolume": vol => flags.hitsoundVolume = vol,
    "fullscreen": async fullscreenOn => {
        
        if (fullscreenOn) {
            maximizedBeforeFullscreen = await appWindow.isMaximized();
            
            // unmaximize first to prevent issue when turning fullscreen on while maximized 
            await appWindow.unmaximize();
            await appWindow.setFullscreen(true);
        }
        else {
            await appWindow.setFullscreen(false);
            if (maximizedBeforeFullscreen)  await appWindow.maximize();
            else                            await appWindow.unmaximize();
        }
    }
}

const initialFullscreen = await appWindow.isFullscreen();

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function SettingsProvider({ children }: Props) {
    const [settings, setSettingsInner] = useState<Settings>({
        offset: 0,
        hitringDuration: 400,
        musicVolume: 1,
        sfxVolume: 1,
        hitsoundVolume: 1,
        showCombo: true,
        showAccuracyBar: true,
        fullscreen: initialFullscreen
    });
    
    // load saved settings
    useEffect(() => {
            
        const loadedSettings: any = {...settings};
        
        for (const _key in settings) {
            const key = _key as keyof Settings;
            
            const savedVal = localStorage.getItem("settings." + key);
            if (savedVal != null) {
                switch (typeof settings[key]) {
                    case "number":
                        loadedSettings[key] = Number(savedVal);
                        break;
                    case "boolean":
                        loadedSettings[key] = savedVal === "true";
                        break;
                }
            }
            
            SETTINGS_HOOKS[key]?.call(null, loadedSettings[key]);
        }
        setSettingsInner(loadedSettings);
    }, []);
    
    function setSettings<K extends keyof Settings>(setting: K, value: Settings[K]) {
        SETTINGS_HOOKS[setting]?.call(null, value);
        
        const nextSettings = ({...settings, [setting]: value});
        setSettingsInner(nextSettings);
        localStorage.setItem("settings." + setting, value.toString());
    }
    
    return (
        <SettingsContext.Provider value={[settings, setSettings, settings.hitringDuration + ACTIVATION_BUFFER]}>
            { children }
        </SettingsContext.Provider>
    );
}