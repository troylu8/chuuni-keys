import { appLocalDataDir } from "@tauri-apps/api/path";
import filenamify from "filenamify";

export function stringifyIgnoreNull(obj: any) {
    return JSON.stringify(obj, (_, val) => val == null? undefined : val, 4);
}

export const USERDATA_DIR = await appLocalDataDir() + "\\userdata";
export const SERVER_URL = "http://localhost:5000";

export const FLAGS = {
    keyUnitsEnabled: true
};
export function getChartFolder({id, title}: {id: string, title: string}) {
    return `${USERDATA_DIR}\\charts\\${id} ${filenamify(title, {replacement: '_'})}`
}
