"use client";

import { useEffect, useState } from "react";

export function CNYProvider({ children }: { children: React.ReactNode }) {
    const [isCNY, setIsCNY] = useState(false);

    useEffect(() => {
        const checkCNY = () => {
            const now = new Date();
            const currentYear = now.getFullYear();

            // 设定春节主题时间范围: 2月17日 - 3月31日
            // Months are 0-indexed in JS Date: 0=Jan, 1=Feb, 2=Mar
            const startDate = new Date(currentYear, 1, 17);
            const endDate = new Date(currentYear, 2, 31);

            // Including the end date fully
            endDate.setHours(23, 59, 59);

            if (now >= startDate && now <= endDate) {
                document.documentElement.setAttribute("data-theme", "cny");
                setIsCNY(true);
            } else {
                document.documentElement.removeAttribute("data-theme");
                setIsCNY(false);
            }
        };

        checkCNY();
    }, []);

    return <>{children}</>;
}
