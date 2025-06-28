import { Page, usePage } from "../providers/page";
import MuseButton from "./muse-button";

export default function MainMenuButton() {
    const [, setPageParams] = usePage();
    
    return (
        <MuseButton className="absolute top-1 left-1 z-10" onClick={() => setPageParams([Page.MAIN_MENU])}>
            main menu
        </MuseButton>
    );
}