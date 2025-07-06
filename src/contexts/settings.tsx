import { useState, createContext, useContext, useEffect } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { flags, stringifyIgnoreNull, USERDATA_DIR } from "../lib/globals";
import bgm from "../lib/sound";

/** activation duration = hitring duration + this value */
const ACTIVATION_BUFFER = 500;

export type Settings = {
    offset: number
    hitringDuration: number
    musicVolume: number
    sfxVolume: number
    hitsoundVolume: number
}

type SetSettings = (setting: keyof Settings, value: Settings[keyof Settings]) => void;
const SettingsContext = createContext<[Settings, SetSettings, number] | null>(null);

export function useSettings() {
    return useContext(SettingsContext)!;
}

/** code to run when a setting is initialized/changed */
const SETTINGS_HOOKS: Record<string, (val: Settings[keyof Settings]) => any> = {
    "musicVolume": vol => bgm.volume = vol,
    "sfxVolume": vol => flags.sfxVolume = vol,
    "hitsoundVolume": vol => flags.hitsoundVolume = vol,
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function SettingsProvider({ children }: Props) {
    const [settings, setSettingsInner] = useState<Settings>({
        offset: 0,
        hitringDuration: 300,
        musicVolume: 1,
        sfxVolume: 1,
        hitsoundVolume: 1
    });
    
    // load saved settings
    useEffect(() => {
        readTextFile(USERDATA_DIR + "\\settings.json")
        .then(contents => {
            const parsedSettings = JSON.parse(contents);
            
            // verify validity of parsed settings
            for (const key in settings) {
                if (typeof parsedSettings[key] !== typeof settings[key as keyof Settings]) {
                    throw new Error("value of settings.json is invalid"); 
                }
            }
            
            // call setting hooks
            for (const key in parsedSettings) {
                SETTINGS_HOOKS[key]?.call(null, parsedSettings[key]);
            }
            
            setSettingsInner(parsedSettings);
        })
        .catch(console.error); // do nothing on error, leaving the default settings
    }, []);
    
    function setSettings(setting: keyof Settings, value: Settings[keyof Settings]) {
        SETTINGS_HOOKS[setting]?.call(null, value);
        
        const nextSettings = ({...settings, [setting]: value});
        setSettingsInner(nextSettings);
        writeTextFile(USERDATA_DIR + "\\settings.json", stringifyIgnoreNull(nextSettings));
    }
    
    return (
        <SettingsContext.Provider value={[settings, setSettings, settings.hitringDuration + ACTIVATION_BUFFER]}>
            { children }
        </SettingsContext.Provider>
    );
}