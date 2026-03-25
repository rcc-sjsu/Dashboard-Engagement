"use client";

import { userState } from "react";

const SEMESTER_OPTIONS = [
    { label: "All Semesters", value: "all"},
    { label: "Fall 2025", value: "fall-2025"},
]

export function SemesterSelect(){
    const [semester, setSemester] = userState("all");

    const handleChange = (value: string) => { 
        setSemester(value);
        console.log("Selected semester:", value);
        
    };

    return (
        <select 
        value={semester} 
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md boarder border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
            {SEMESTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}