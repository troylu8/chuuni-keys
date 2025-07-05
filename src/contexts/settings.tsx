import { useState, createContext, useContext, useEffect } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { stringifyIgnoreNull, USERDATA_DIR } from "../lib/globals";

export type Settings = {
    offset: number
    activationDuration: number
    hitringDuration: number
    musicVolume: number
    sfxVolume: number
    hitsoundVolume: number
}

type SetSettings = (setting: keyof Settings, value: Settings[keyof Settings]) => void;
const SettingsContext = createContext<[Settings, SetSettings] | null>(null);

export function useSettings() {
    return useContext(SettingsContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function SettingsProvider({ children }: Props) {
    const [settings, setSettingsInner] = useState<Settings>({
        offset: 0,
        activationDuration: 800,
        hitringDuration: 300,
        musicVolume: 1,
        sfxVolume: 1,
        hitsoundVolume: 1
    });
    
    // load saved settings
    useEffect(() => {
        readTextFile(USERDATA_DIR + "\\settings.json")
        .then(contents => {
            const parsed = JSON.parse(contents);
            for (const key in settings) {
                if (typeof parsed[key] !== typeof settings[key as keyof Settings]) {
                    throw new Error("value of settings.json is invalid"); 
                }
            }
            setSettingsInner(parsed);
        })
        .catch(console.error); // do nothing on error, leaving the default settings
    }, []);
    
    function setSettings(setting: keyof Settings, value: Settings[keyof Settings]) {
        const nextSettings = ({...settings, [setting]: value});
        setSettingsInner(nextSettings);
        writeTextFile(USERDATA_DIR + "\\settings.json", stringifyIgnoreNull(nextSettings));
    }
    
    return (
        <SettingsContext.Provider value={[settings, setSettings]}>
            { children }
        </SettingsContext.Provider>
    );
}