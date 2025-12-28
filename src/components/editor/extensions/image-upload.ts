import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { uploadMedia, validateFile } from "../utils/upload";

export interface ImageUploadOptions {
    onUploadStart?: (fileName: string) => void;
    onUploadProgress?: (progress: number, fileName: string) => void;
    onUploadComplete?: (url: string, fileName: string) => void;
    onUploadError?: (error: string, fileName: string) => void;
}

export const ImageUpload = Extension.create<ImageUploadOptions>({
    name: "imageUpload",

    addOptions() {
        return {
            onUploadStart: undefined,
            onUploadProgress: undefined,
            onUploadComplete: undefined,
            onUploadError: undefined,
        };
    },

    addProseMirrorPlugins() {
        const options = this.options;

        return [
            new Plugin({
                key: new PluginKey("imageUpload"),
                props: {
                    handleDrop: (view, event) => {
                        const hasFiles =
                            event.dataTransfer &&
                            event.dataTransfer.files &&
                            event.dataTransfer.files.length > 0;

                        if (!hasFiles) {
                            return false;
                        }

                        const files = Array.from(event.dataTransfer.files);
                        const mediaFiles = files.filter((file) => {
                            const validation = validateFile(file);
                            return validation.valid;
                        });

                        if (mediaFiles.length === 0) {
                            return false;
                        }

                        event.preventDefault();

                        const coordinates = view.posAtCoords({
                            left: event.clientX,
                            top: event.clientY,
                        });

                        mediaFiles.forEach(async (file) => {
                            try {
                                options.onUploadStart?.(file.name);

                                const result = await uploadMedia(file, (progress) => {
                                    options.onUploadProgress?.(progress.progress, progress.fileName);
                                });

                                options.onUploadComplete?.(result.url, result.fileName);

                                const { schema } = view.state;

                                if (result.type === "image") {
                                    const node = schema.nodes.image?.create({
                                        src: result.url,
                                        alt: result.fileName,
                                        title: result.fileName,
                                    });

                                    if (node) {
                                        const transaction = view.state.tr.insert(
                                            coordinates?.pos || view.state.selection.from,
                                            node
                                        );
                                        view.dispatch(transaction);
                                    }
                                } else {
                                    // 视频作为链接插入
                                    const videoHtml = `<video src="${result.url}" controls class="max-w-full rounded-lg my-4"></video>`;
                                    const transaction = view.state.tr.insertText(videoHtml);
                                    view.dispatch(transaction);
                                }
                            } catch (error) {
                                const errorMessage = error instanceof Error ? error.message : "上传失败";
                                options.onUploadError?.(errorMessage, file.name);
                            }
                        });

                        return true;
                    },

                    handlePaste: (view, event) => {
                        const hasFiles =
                            event.clipboardData &&
                            event.clipboardData.files &&
                            event.clipboardData.files.length > 0;

                        if (!hasFiles) {
                            return false;
                        }

                        const files = Array.from(event.clipboardData.files);
                        const mediaFiles = files.filter((file) => {
                            const validation = validateFile(file);
                            return validation.valid;
                        });

                        if (mediaFiles.length === 0) {
                            return false;
                        }

                        event.preventDefault();

                        mediaFiles.forEach(async (file) => {
                            try {
                                options.onUploadStart?.(file.name);

                                const result = await uploadMedia(file, (progress) => {
                                    options.onUploadProgress?.(progress.progress, progress.fileName);
                                });

                                options.onUploadComplete?.(result.url, result.fileName);

                                const { schema } = view.state;

                                if (result.type === "image") {
                                    const node = schema.nodes.image?.create({
                                        src: result.url,
                                        alt: result.fileName,
                                        title: result.fileName,
                                    });

                                    if (node) {
                                        const transaction = view.state.tr.replaceSelectionWith(node);
                                        view.dispatch(transaction);
                                    }
                                }
                            } catch (error) {
                                const errorMessage = error instanceof Error ? error.message : "上传失败";
                                options.onUploadError?.(errorMessage, file.name);
                            }
                        });

                        return true;
                    },
                },
            }),
        ];
    },
});

export default ImageUpload;
