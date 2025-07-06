import { useState } from "react";
import { Settings as SettingsType, useSettings } from "../../contexts/settings";
import TimingEditor from "./timing-editor";
import MuseButton from "../../components/muse-button";
import MainMenuButton from "../../components/main-menu-btn";
import { Bind } from "../../lib/globals";
import Slider from "../../components/slider";
import MuseCheckmark from "../../components/muse-checkmark";

export default function Settings() {
    const [settings, setSettings] = useSettings(); 
    const [timingEditorVisible, setTimingEditorVisible] = useState(false);
    
    if (timingEditorVisible) return <TimingEditor onClose={() => setTimingEditorVisible(false)}/>;
    
    function bindSetting<K extends keyof SettingsType>(field: K): Bind<SettingsType[K]> {
        return [settings[field], val => setSettings(field, val)];
    }
    
    return (
        <div className="absolute cover flex flex-col gap-3 p-3 overflow-auto">
            <MainMenuButton />
            
            <h1 className="my-5 text-center "> Settings </h1>
            
            <div className="flex gap-6 justify-center">
                <MuseButton onClick={() => setTimingEditorVisible(true)} > edit note timing </MuseButton>
                <MuseButton onClick={() => setTimingEditorVisible(true)} > edit hitring speed </MuseButton>
            </div>
            
            <h2> Volume </h2>
            <div 
                style={{
                    display: "grid",
                    gridTemplateColumns: "fit-content(100%) 1fr",
                }}
                className="gap-3 [&>label]:text-end"
            >
                <label> music </label>
                <AudioSlider bind={bindSetting("musicVolume")} />
                <label> sfx </label>
                <AudioSlider bind={bindSetting("sfxVolume")} />
                <label> hitsounds </label>
                <AudioSlider bind={bindSetting("hitsoundVolume")} />
            </div>
            
            <h2> Game </h2>
            <div className="flex flex-col gap-3">
                <MuseCheckmark label="show combo" bind={bindSetting("showCombo")} />
                <MuseCheckmark label="show accuracy bar" bind={bindSetting("showAccuracyBar")} />
            </div>
        </div>
    );
}

type AudioSliderProps = Readonly<{
    bind: Bind<number>
}>
function AudioSlider({ bind }: AudioSliderProps) {
    return (
        <div className="flex gap-3">
            <p className="w-5 shrink-0 text-center">
                { Math.round(bind[0] * 100) }
            </p>
            <Slider min={0} max={2} bind={bind}  />
        </div>
    )
}