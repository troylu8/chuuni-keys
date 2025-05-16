import { useState, createContext, useContext } from "react";

export enum Page {
    MAIN_MENU,
    SONG_SELECT,
    GAME,
}

export type GameInfo = {chartPath: string, audioPath: string, imgPath?: string };
export type GameStats = {};

export type PageParams = [Page] | [Page, GameInfo | GameStats];

const PageContext = createContext<[PageParams, (next: PageParams) => void] | null>(null);

export function usePage() {
    return useContext(PageContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function PageProvider({ children }: Props) {
    const pageParamsState = useState<PageParams>([Page.MAIN_MENU]);
    
    return (
        <PageContext.Provider value={pageParamsState}>
            { children }
        </PageContext.Provider>
    );
}