export interface BloodPressure {
    id: string
    date: string
    moment: string
    average_systolic: number
    average_diastolic: number
    average_pulse: number
    readings: BloodPressureReading[]
}

export interface BloodPressureReading {
    id: string
    systolic: number
    diastolic: number
    pulse: number
}

export interface Consultation {
    id: string
    slug: string
    date: string
}