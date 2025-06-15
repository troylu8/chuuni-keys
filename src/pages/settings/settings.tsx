import { useState } from "react";
import { Page, usePage } from "../../providers/page";
import { useSettings } from "../../providers/settings";
import TimingEditor from "./timing-editor";
import MuseButton from "../../components/muse-button";

export default function Settings() {
    const [,setPageParams] = usePage();
    const [settings, setSettings] = useSettings(); 
    const [timingEditorVisible, setTimingEditorVisible] = useState(false);
    
    if (timingEditorVisible) return <TimingEditor onClose={() => setTimingEditorVisible(false)}/>;
    
    return (
        <div className="absolute cover flex flex-col gap-3 p-3">
            <MuseButton onClick={() => setPageParams([Page.MAIN_MENU])}> back to main menu </MuseButton>
            <h1> settings </h1>
            <MuseButton onClick={() => setTimingEditorVisible(true)} > edit note timing </MuseButton>
            <p> (other settings here) </p>
        </div>
    );
}