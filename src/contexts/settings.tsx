import { useState, createContext, useContext, useEffect } from "react";
import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { stringifyIgnoreNull } from "../lib/globals";

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
        readTextFile("userdata\\settings.json", {baseDir: BaseDirectory.AppLocalData})
        .then(contents => {
            const parsed = JSON.parse(contents);
            for (const key in settings) {
                if (typeof parsed[key] === typeof settings[key as keyof Settings]) {
                    throw new Error("value of settings.json is invalid"); 
                }
            }
            setSettingsInner(settings);
        })
        .catch(console.error); // do nothing on error, leaving the default settings
    }, []);
    
    function setSettings(setting: keyof Settings, value: Settings[keyof Settings]) {
        const nextSettings = ({...settings, [setting]: value});
        setSettingsInner(nextSettings);
        writeTextFile(
            "userdata\\settings.json", 
            stringifyIgnoreNull(nextSettings),
            { baseDir: BaseDirectory.AppLocalData }
        );
    }
    
    return (
        <SettingsContext.Provider value={[settings, setSettings]}>
            { children }
        </SettingsContext.Provider>
    );
}