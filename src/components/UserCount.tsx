"use client";

import { getUserCount } from "@/actions/user";
import { useEffect, useState } from "react";

export function UserCount() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;
        getUserCount()
            .then((data) => {
                if (mounted) setCount(data);
            })
            .catch(() => {
                if (mounted) setCount(1000);
            });
        return () => {
            mounted = false;
        };
    }, []);

    // 默认回退状态或加载中状态
    if (count === null) {
        return <span>1000+</span>;
    }

    // 格式化数字，例如 1234 -> 1,234
    return <span>{count.toLocaleString()}</span>;
}
