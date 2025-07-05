import { useState } from "react";
import { Settings as SettingsType, useSettings } from "../../providers/settings";
import TimingEditor from "./timing-editor";
import MuseButton from "../../components/muse-button";
import MainMenuButton from "../../components/main-menu-btn";
import { Bind } from "../../lib/globals";
import Slider from "../../components/slider";

type SettingsKey = keyof SettingsType;
type SettingsVal = SettingsType[SettingsKey];

export default function Settings() {
    const [settings, setSettings] = useSettings();  // TODO
    const [timingEditorVisible, setTimingEditorVisible] = useState(false);
    
    if (timingEditorVisible) return <TimingEditor onClose={() => setTimingEditorVisible(false)}/>;
    
    function bindSetting(field: SettingsKey): Bind<SettingsVal> {
        return [settings[field], val => setSettings(field, val)];
    }
    
    return (
        <div className="absolute cover flex flex-col gap-3 p-3">
            <MainMenuButton />
            
            <h1 className="mt-10"> settings </h1>
            <MuseButton onClick={() => setTimingEditorVisible(true)} > edit note timing </MuseButton>
            
            <h2> volume </h2>
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