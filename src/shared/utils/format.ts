export function formatDate(value: Date | string): string {
    return new Intl.DateTimeFormat("es-CL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date(value));
}

export function formatNumber(value: number): string {
    return new Intl.NumberFormat("es-CL").format(value);
}

export function toDateInputValue(value: Date = new Date()): string {
    return value.toISOString().slice(0, 10);
}
