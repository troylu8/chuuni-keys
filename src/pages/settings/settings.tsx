import { useState } from "react";
import { useSettings } from "../../providers/settings";
import TimingEditor from "./timing-editor";
import MuseButton from "../../components/muse-button";
import MainMenuButton from "../../components/main-menu-btn";

export default function Settings() {
    const [settings, setSettings] = useSettings();  // TODO
    const [timingEditorVisible, setTimingEditorVisible] = useState(false);
    
    if (timingEditorVisible) return <TimingEditor onClose={() => setTimingEditorVisible(false)}/>;
    
    return (
        <div className="absolute cover flex flex-col gap-3 p-3">
            <MainMenuButton />
            
            <h1> settings </h1>
            <MuseButton onClick={() => setTimingEditorVisible(true)} > edit note timing </MuseButton>
            <p> (other settings here) </p>
        </div>
    );
}