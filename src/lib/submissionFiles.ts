const MEDIA_MIME_PREFIXES = ["image/", "audio/", "video/"];

const MEDIA_EXTENSIONS = new Set([
  "3g2",
  "3gp",
  "aac",
  "aif",
  "aiff",
  "apng",
  "avi",
  "avif",
  "bmp",
  "flac",
  "gif",
  "heic",
  "heif",
  "ico",
  "jpeg",
  "jpg",
  "m4a",
  "m4v",
  "mkv",
  "mov",
  "mp3",
  "mp4",
  "mpeg",
  "mpg",
  "ogg",
  "ogv",
  "opus",
  "png",
  "svg",
  "tif",
  "tiff",
  "wav",
  "webm",
  "webp",
  "wma",
  "wmv",
]);

const VIEWABLE_DOCUMENT_EXTENSIONS = new Set([
  "csv",
  "doc",
  "docx",
  "ods",
  "pdf",
  "ppt",
  "pptx",
  "rtf",
  "txt",
  "xls",
  "xlsm",
  "xlsx",
]);

export const NON_MEDIA_FILE_HELP_TEXT =
  "Any non-media file is accepted. PDF, Word, PowerPoint, and Excel files can be previewed.";

export const getFileExtension = (fileNameOrPath: string) => {
  const withoutQuery = fileNameOrPath.split("?")[0]?.split("#")[0] || "";
  const fileName = withoutQuery.split("/").pop() || withoutQuery;
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
};

export const isMediaFile = (file: File) => {
  const mimeType = file.type.toLowerCase();
  const extension = getFileExtension(file.name);

  return (
    MEDIA_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) ||
    MEDIA_EXTENSIONS.has(extension)
  );
};

export const isAllowedSubmissionFile = (file: File) => !isMediaFile(file);

export const isViewableSubmissionFile = (fileNameOrPath: string) => {
  const extension = getFileExtension(fileNameOrPath);
  return VIEWABLE_DOCUMENT_EXTENSIONS.has(extension);
};

export const sanitizeFileName = (fileName: string) => {
  const cleaned = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "submission-file";
};
