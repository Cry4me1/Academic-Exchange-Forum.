declare module 'lunar-javascript' {
    export class Lunar {
        static fromDate(date: Date): Lunar;
        getMonth(): number;
        getDay(): number;
        getYear(): number;
        getMonthInChinese(): string;
        getDayInChinese(): string;
    }
}
