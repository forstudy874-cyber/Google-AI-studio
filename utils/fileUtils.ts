
export interface GenerativePart {
    mimeType: string;
    base64: string;
}

export const fileToGenerativePart = (file: File): Promise<GenerativePart> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            if (!base64) {
                reject(new Error("Could not extract base64 data from file."));
                return;
            }
            resolve({
                mimeType: file.type,
                base64: base64,
            });
        };
        reader.onerror = error => reject(error);
    });
};
