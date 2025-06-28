import { Page, usePage } from "../providers/page";
import MuseButton from "./muse-button";

export default function MainMenuButton() {
    const [, setPageParams] = usePage();
    
    return (
        <div className="absolute top-1 left-1 z-10">
            <MuseButton onClick={() => setPageParams([Page.MAIN_MENU])}>
                main menu
            </MuseButton>
        </div>
    );
}