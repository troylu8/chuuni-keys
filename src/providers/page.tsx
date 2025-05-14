import { useState, createContext, useContext } from "react";

export enum Page {
    MAIN_MENU,
    SONG_SELECT,
    GAME
}

const PageContext = createContext<[Page, (next: Page) => void] | null>(null);

export function usePage() {
    return useContext(PageContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function PageProvider({ children }: Props) {
    const pageState = useState(Page.GAME);
    
    return (
        <PageContext.Provider value={pageState}>
            { children }
        </PageContext.Provider>
    );
}