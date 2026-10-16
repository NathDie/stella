import {strawboardApi} from "../clients.js";
import {Consultation} from "../../models/health.js";

export function getConsultation(): Promise<Consultation> {
    return strawboardApi.get<Consultation>('/consultations/hearth-control');
}