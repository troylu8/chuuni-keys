import { useState, createContext, useContext, useEffect } from "react";
import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

type Settings = {
    offset: number
    activation_duration: number
    hitring_duration: number
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
        activation_duration: 800,
        hitring_duration: 300
    });
    
    useEffect(() => {
        
        readTextFile("userdata\\settings.json", {baseDir: BaseDirectory.AppLocalData})
        .then(contents => {
            const settings = JSON.parse(contents) satisfies Settings;
            console.log("read", settings);
            setSettingsInner(settings);
        })
        .catch(e => {console.log(e);}); // do nothing on error, leaving the default settings
        
    }, []);
    
    function setSettings(setting: keyof Settings, value: Settings[keyof Settings]) {
        setSettingsInner(prev => {
            const next = ({...prev, [setting]: value});
            writeTextFile(
                "userdata\\settings.json", 
                JSON.stringify(next, null, 4),
                { baseDir: BaseDirectory.AppLocalData }
            );
            return next;
        });
    }
    
    return (
        <SettingsContext.Provider value={[settings, setSettings]}>
                { children }
        </SettingsContext.Provider>
    );
}