import {strawboardApi} from "../clients.js";
import {BloodPressure} from "../../models/health.js";

export function getBloodPressures(): Promise<BloodPressure[]> {
    return strawboardApi.get<BloodPressure[]>('/blood-pressures/current-year');
}