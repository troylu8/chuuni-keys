import { invoke } from "@tauri-apps/api/core";
import { useState, createContext, useContext, useEffect } from "react";

export type ChartMetadata = {
    id: string,
    title: string,
    artists: string,
    chart_author: string,
    audio: string,
    chart: string,
    img?: string
}
type UserData = {
    base_dir: string,
    charts: ChartMetadata[]
}


const UserDataContext = createContext<UserData | null>(null);

export function useUserData() {
    return useContext(UserDataContext);
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function UserDataProvider({ children }: Props) {
    const [userData, setUserData] = useState<UserData | null>(null);
    
    useEffect(() => {
        invoke<UserData>("get_user_data").then(data => {
            console.log(data);
            setUserData(data);
        })
    }, []);
    
    return (
        <UserDataContext.Provider value={userData}>
            { children }
        </UserDataContext.Provider>
    );
}