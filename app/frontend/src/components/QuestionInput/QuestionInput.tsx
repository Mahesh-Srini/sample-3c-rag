import { useState, useEffect, useContext, ChangeEvent } from "react";
import { Stack, TextField } from "@fluentui/react";
import { Button, Tooltip } from "@fluentui/react-components";
import { Send28Filled } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { FontIcon } from "@fluentui/react/lib/Icon";

import styles from "./QuestionInput.module.css";
import { SpeechInput } from "./SpeechInput";
import { LoginContext } from "../../loginContext";
import { requireLogin } from "../../authConfig";
import { uploadFileApi } from "../../api/api";

interface Props {
    onSend: (question: string) => void;
    disabled: boolean;
    initQuestion?: string;
    placeholder?: string;
    clearOnSend?: boolean;
    showSpeechInput?: boolean;
}

export const QuestionInput = ({ onSend, disabled, placeholder, clearOnSend, initQuestion, showSpeechInput }: Props) => {
    const [question, setQuestion] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [uploadStatus, setUploadStatus] = useState<string>("");
    const [showUploadStatus, setShowUploadStatus] = useState<boolean>(false);
    const { loggedIn } = useContext(LoginContext);
    const { t } = useTranslation();
    const [isComposing, setIsComposing] = useState(false);

    useEffect(() => {
        initQuestion && setQuestion(initQuestion);
    }, [initQuestion]);

    const sendQuestion = () => {
        if (disabled || !question.trim()) {
            return;
        }

        onSend(question);

        if (clearOnSend) {
            setQuestion("");
        }
    };

    const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
        if (isComposing) return;

        if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            sendQuestion();
        }
    };

    const handleCompositionStart = () => {
        setIsComposing(true);
    };
    const handleCompositionEnd = () => {
        setIsComposing(false);
    };

    const onQuestionChange = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        if (!newValue) {
            setQuestion("");
        } else if (newValue.length <= 1000) {
            setQuestion(newValue);
        }
    };

    const disableRequiredAccessControl = requireLogin && !loggedIn;
    const sendQuestionDisabled = disabled || !question.trim() || disableRequiredAccessControl;

    if (disableRequiredAccessControl) {
        placeholder = "Please login to continue...";
    }

    async function handleFileUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        setIsProcessing(true);
        setUploadStatus("");
        setShowUploadStatus(false);
        try {
            const formData = new FormData();
            let uploadedFileNames: string[] = [];
            for (let i = 0; i < files.length; i++) {
                formData.append("file", files[i]);
                uploadedFileNames.push(files[i].name);
            }
            await uploadFileApi(formData, "");
            // Show a friendly, dismissible message
            if (uploadedFileNames.length === 1) {
                setUploadStatus(
                    `Your file "${uploadedFileNames[0]}" is being processed. You can ask questions about it in a few minutes once processing is complete.`
                );
            } else {
                setUploadStatus(
                    `Your files (${uploadedFileNames.join(", ")}) are being processed. You can ask questions about them in a few minutes once processing is complete.`
                );
            }
            setShowUploadStatus(true);
        } catch (err: any) {
            setUploadStatus("Upload failed: " + (err.message || "Unknown error"));
            setShowUploadStatus(true);
        } finally {
            setIsProcessing(false);
        }
    }

    function getAcceptedDocumentTypes(): string {
        // Define accepted file types for RAG processing
        const documentTypes = [".pdf", ".doc", ".docx", ".txt", ".md", ".rtf"];

        const imageTypes = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

        // Combine document and image types
        return [...documentTypes, ...imageTypes].join(",");
    }

    return (
        <Stack horizontal className={styles.questionInputContainer}>
            <TextField
                className={styles.questionInputTextArea}
                disabled={disableRequiredAccessControl}
                placeholder={placeholder}
                multiline
                resizable={false}
                borderless
                value={question}
                onChange={onQuestionChange}
                onKeyDown={onEnterPress}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
            />
            <div className={styles.questionInputButtonsContainer}>
                <Tooltip content={t("tooltips.submitQuestion")} relationship="label">
                    <Button size="large" icon={<Send28Filled primaryFill="rgba(115, 118, 225, 1)" />} disabled={sendQuestionDisabled} onClick={sendQuestion} />
                </Tooltip>
            </div>
            {showUploadStatus && (
                <div
                    style={{
                        background: uploadStatus.startsWith("Upload failed") ? "#ffeaea" : "#eef7ff",
                        color: uploadStatus.startsWith("Upload failed") ? "#d32f2f" : "#1a237e",
                        border: "1px solid #b4b4ff",
                        borderRadius: "0.5rem",
                        padding: "0.75rem 1.5rem 0.75rem 1rem",
                        marginLeft: "1rem",
                        marginBottom: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        fontSize: "1rem",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.07)"
                    }}
                >
                    <span style={{ flex: 1 }}>{uploadStatus}</span>
                    <button
                        style={{
                            background: "none",
                            border: "none",
                            color: "#735ee1",
                            fontWeight: "bold",
                            fontSize: "1.2rem",
                            cursor: "pointer",
                            marginLeft: "1rem"
                        }}
                        aria-label="Close upload status message"
                        onClick={() => setShowUploadStatus(false)}
                    >
                        ×
                    </button>
                </div>
            )}
            <div className={styles.questionInputButtonArea}>
                <div className={styles.fileInputContainer}>
                    <input
                        type="file"
                        id="unifiedFileInput"
                        data-testid="unifiedFileInput"
                        onChange={event => handleFileUpload(event)}
                        accept={getAcceptedDocumentTypes()}
                        multiple
                        className={styles.fileInput}
                        disabled={isProcessing}
                    />
                    <label htmlFor="unifiedFileInput" className={`${styles.fileLabel} ${isProcessing ? styles.disabled : ""}`} aria-label="Upload Files">
                        <FontIcon className={styles.fileIcon} iconName={"Attach"} aria-label="Upload Files (Documents & Images)" />
                    </label>
                </div>
            </div>
            {showSpeechInput && <SpeechInput updateQuestion={setQuestion} />}
        </Stack>
    );
};
