import { appLocalDataDir } from "@tauri-apps/api/path";
import filenamify from "filenamify";

export function stringifyIgnoreNull(obj: any) {
    return JSON.stringify(obj, (_, val) => val == null? undefined : val, 4);
}

export const GLOBALS = {
    userdataFolder: await appLocalDataDir() + "\\userdata",
    keyUnitsEnabled: true
};
export function getChartFolder({id, title}: {id: string, title: string}) {
    return `${GLOBALS.userdataFolder}\\charts\\${id} ${filenamify(title, {replacement: '_'})}`
}
