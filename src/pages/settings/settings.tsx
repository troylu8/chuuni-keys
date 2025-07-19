import { useEffect, useState } from "react";
import { Settings as SettingsType, useSettings } from "../../contexts/settings";
import TimingEditor from "./timing-editor";
import MuseButton from "../../components/muse-button";
import { Bind } from "../../lib/lib";
import Slider from "../../components/slider";
import MuseCheckbox from "../../components/muse-checkbox";
import { AppWindow, ArrowLeft, Volume2 } from "lucide-react";
import { Page, usePage } from "../../contexts/page";
import NowPlaying from "../../components/now-playing";

export default function Settings() {
    const [settings, setSettings] = useSettings(); 
    const [timingEditorVisible, setTimingEditorVisible] = useState(false);
    const [, setPageParams] = usePage();
    
    if (timingEditorVisible) return <TimingEditor onClose={() => setTimingEditorVisible(false)}/>;
    
    function bindSetting<K extends keyof SettingsType>(field: K): Bind<SettingsType[K]> {
        return [settings[field], val => setSettings(field, val)];
    }
    
    // keybinds
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key == "Escape") setPageParams([Page.MAIN_MENU]);
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => { window.removeEventListener("keydown", handleKeyDown); }
    }, []);
    
    return (
        <div className="absolute cover flex justify-center overflow-auto bg-ctp-base">
            <NowPlaying />
            
            <MuseButton className="fixed top-1 left-1 z-10 text-ctp-mauve" onClick={() => setPageParams([Page.MAIN_MENU])}>
                <ArrowLeft /> main menu
            </MuseButton>
            
            <main className="
                flex flex-col gap-3 p-3 max-w-lg
                [&>h2]:mt-4 [&>h2]:text-lg
            ">
                <h1 className="my-5 text-center text-xl"> Settings </h1>
                
                
                <div className="flex gap-6 justify-center text-ctp-base">
                    <MuseButton 
                        className="bg-ctp-mauve" 
                        onClick={() => setTimingEditorVisible(true)}
                    > edit hit offset </MuseButton>
                    <MuseButton 
                        className="bg-ctp-mauve" 
                        onClick={() => setTimingEditorVisible(true)} 
                    > edit hitring speed </MuseButton>
                </div>
                
                    
                <h2> <Volume2 /> &nbsp; [ volume ] </h2>
                <div 
                    style={{
                        display: "grid",
                        gridTemplateColumns: "fit-content(100%) 1fr",
                    }}
                    className="gap-3 [&>label]:text-end w-full"
                >
                    <span> music </span>
                    <AudioSlider bind={bindSetting("musicVolume")} />
                    <span> sfx </span>
                    <AudioSlider bind={bindSetting("sfxVolume")} />
                    <span> hitsounds </span>
                    <AudioSlider bind={bindSetting("hitsoundVolume")} />
                </div>
                
                <h2> <AppWindow /> &nbsp; [ user interface ] </h2>
                <div className="flex flex-col gap-3">
                    <MuseCheckbox label="fullscreen" bind={bindSetting("fullscreen")} />
                    <MuseCheckbox label="show combo" bind={bindSetting("showCombo")} />
                    <MuseCheckbox label="show accuracy bar" bind={bindSetting("showAccuracyBar")} />
                </div>
                
                {/* buffer */}
                <div className="h-5"> &nbsp; </div>
            </main>
        </div>
    );
}

type AudioSliderProps = Readonly<{
    bind: Bind<number>
}>
function AudioSlider({ bind }: AudioSliderProps) {
    return (
        <div className="flex gap-3 w-full">
            <p className="w-5 shrink-0 text-center text-ctp-yellow">
                { Math.round(bind[0] * 100) }
            </p>
            <Slider min={0} max={2} bind={bind}  />
        </div>
    )
}