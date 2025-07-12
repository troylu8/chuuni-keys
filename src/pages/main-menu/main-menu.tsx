import { exit } from '@tauri-apps/plugin-process';
import { Page, usePage } from "../../contexts/page";
import MuseButton from '../../components/muse-button';


export default function MainMenu() {
    const [,setPageParams] = usePage();    
    
    return (
        <div className="absolute cover flex flex-col justify-center items-center gap-3 bg-ctp-base">
            <MuseButton onClick={() => setPageParams([Page.CHART_SELECT])}> song select </MuseButton>
            <MuseButton onClick={() => setPageParams([Page.SETTINGS])}> settings </MuseButton>
            <MuseButton onClick={() => exit(0)}> quit </MuseButton>
        </div>
    );
}