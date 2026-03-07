import { MoveDiagonal2, X } from "lucide-react";
import { type SetStateAction, type Dispatch, useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { IAttempt, Question, QuestionWithAnswers } from "../types/types";
import { useStartAttemptStore } from "../stores/attemptStore";
import { Link } from "react-router-dom";
import Loader from "./reusables/Loader";
import { RingLoader } from "react-spinners";

interface AnswerModalProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    isTraining: boolean;
    attempt: IAttempt | null | undefined;
    questions: Question[] | QuestionWithAnswers[] | [];
}

const GEO = ["ა", "ბ", "გ", "დ"];
const KEYS = ["a", "b", "g", "d"];

// ─── localStorage helpers ─────────────────────────────────────────────────────
const storageKey = (attemptId: string | number, mode: "no-time" | "timed") =>
    `answer_modal_${attemptId}_${mode}`;

const loadAnswers = (attemptId: string | number | undefined, mode: "no-time" | "timed", size: number): (string | null)[] => {
    if (!attemptId) return Array(size).fill(null);
    try {
        const raw = localStorage.getItem(storageKey(attemptId, mode));
        if (!raw) return Array(size).fill(null);
        const parsed = JSON.parse(raw) as (string | null)[];
        if (parsed.length !== size) return Array(size).fill(null);
        return parsed;
    } catch {
        return Array(size).fill(null);
    }
};

const saveAnswers = (attemptId: string | number | undefined, mode: "no-time" | "timed", answers: (string | null)[]) => {
    if (!attemptId) return;
    try {
        localStorage.setItem(storageKey(attemptId, mode), JSON.stringify(answers));
    } catch { /* fail silently */ }
};

const clearAnswers = (attemptId: string | number | undefined) => {
    if (!attemptId) return;
    localStorage.removeItem(storageKey(attemptId, "no-time"));
    localStorage.removeItem(storageKey(attemptId, "timed"));
};
// ─────────────────────────────────────────────────────────────────────────────

const AnswerModal = ({ isOpen, setIsOpen, isTraining, attempt, questions }: AnswerModalProps) => {
    const activeTab = useMemo(() => isTraining ? "no-time" : "timed", [isTraining]);
    // Read-only mode: every question already has a submitted answer
    const isReadOnly = useMemo(() =>
        attempt?.status === 'completed'
        , [attempt?.status]);

    // In read-only mode derive answers directly from question data
    const readOnlyAnswers = useMemo<(string | null)[]>(() => {
        if (!isReadOnly) return [];
        return questions.map(q =>
            ('user_answer' in q ? q.user_answer?.selected_answer ?? null : null)
        );
    }, [isReadOnly, questions]);

    const [answersNoTime, setAnswersNoTime] = useState<(string | null)[]>(() =>
        loadAnswers(attempt?.id, "no-time", questions.length || 0)
    );
    const [answersTimed, setAnswersTimed] = useState<(string | null)[]>(() =>
        loadAnswers(attempt?.id, "timed", questions.length || 0)
    );

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
    const [elapsedTimes, setElapsedTimes] = useState<Map<number, number>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { answerLoading, answerQuestion, submitAttempt } = useStartAttemptStore();

    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [size, setSize] = useState({ width: 760, height: 540 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const dragStart = useRef<{ mouseX: number; mouseY: number; divX: number; divY: number } | null>(null);
    const resizeStart = useRef<{ mouseX: number; mouseY: number; width: number; height: number } | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const currentQuestion = useMemo(() => questions[currentQuestionIndex] || null, [questions, currentQuestionIndex]);

    useEffect(() => {
        if (!attempt?.total_questions) return;
        const sz = attempt.total_questions;
        setAnswersNoTime(loadAnswers(attempt.id, "no-time", sz));
        setAnswersTimed(loadAnswers(attempt.id, "timed", sz));
    }, [attempt?.id, attempt?.total_questions]);

    useEffect(() => {
        if (attempt && !isTraining && isOpen) setQuestionStartTime(Date.now());
    }, [attempt, isTraining, isOpen]);

    useEffect(() => {
        if (questions.length > 0) setCurrentQuestionIndex(0);
    }, [questions]);

    useEffect(() => {
        if (!isReadOnly) saveAnswers(attempt?.id, "no-time", answersNoTime);
    }, [answersNoTime, attempt?.id, isReadOnly]);

    useEffect(() => {
        if (!isReadOnly) saveAnswers(attempt?.id, "timed", answersTimed);
    }, [answersTimed, attempt?.id, isReadOnly]);

    // ─── Drag / resize ────────────────────────────────────────────────────────
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging && dragStart.current) {
            const dx = e.clientX - dragStart.current.mouseX;
            const dy = e.clientY - dragStart.current.mouseY;
            setPosition({
                x: Math.min(Math.max(0, dragStart.current.divX + dx), window.innerWidth - size.width),
                y: Math.min(Math.max(0, dragStart.current.divY + dy), window.innerHeight - size.height),
            });
        } else if (isResizing && resizeStart.current) {
            const dx = e.clientX - resizeStart.current.mouseX;
            const dy = e.clientY - resizeStart.current.mouseY;
            setSize({
                width: Math.min(Math.max(320, resizeStart.current.width + dx), window.innerWidth - position.x),
                height: Math.min(Math.max(240, resizeStart.current.height + dy), window.innerHeight - position.y),
            });
        }
    }, [isDragging, isResizing, position.x, position.y, size.width, size.height]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
        dragStart.current = null;
        resizeStart.current = null;
    }, []);

    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).dataset.resizeHandle) return;
        e.preventDefault();
        dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, divX: position.x, divY: position.y };
        setIsDragging(true);
    }, [position]);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, width: size.width, height: size.height };
        setIsResizing(true);
    }, [size]);

    // ─── Question navigation ──────────────────────────────────────────────────
    const handleQuestionSwitch = useCallback((newIndex: number) => {
        if (newIndex < 0 || newIndex >= questions.length) return;
        if (questionStartTime !== null && currentQuestion) {
            const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
            setElapsedTimes(prev => {
                const u = new Map(prev);
                u.set(currentQuestion.order, (u.get(currentQuestion.order) || 0) + timeSpent);
                return u;
            });
        }
        setCurrentQuestionIndex(newIndex);
        setQuestionStartTime(Date.now());
    }, [questions, questionStartTime, currentQuestion]);

    // ─── Answer handlers (no-op in read-only mode) ────────────────────────────
    const handleNoTimeAnswer = useCallback((questionIndex: number, choice: string) => {
        setAnswersNoTime(prev => {
            const u = [...prev];
            u[questionIndex] = u[questionIndex] === choice ? null : choice;
            return u;
        });
    }, []);

    const handleTimedAnswer = useCallback((questionIndex: number, choice: string) => {
        setAnswersTimed(prev => {
            const u = [...prev];
            u[questionIndex] = u[questionIndex] === choice ? null : choice;
            return u;
        });
    }, []);

    // ─── Submit all ───────────────────────────────────────────────────────────
    const handleSubmitAll = useCallback(async (answers: (string | null)[], mode: "no-time" | "timed") => {
        if (!attempt) return;
        setIsSubmitting(true);
        try {
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const answer = answers[i];
                if (!answer) continue;
                const timeSpent = mode === "timed" ? (elapsedTimes.get(q.order) || 0) : 0;
                await answerQuestion(attempt.code, {
                    question_id: q.id,
                    selected_answer: answer,
                    time_taken: timeSpent,
                });
            }
            clearAnswers(attempt.id);
            submitAttempt(attempt.code)
            window.location.reload();
        } catch (err) {
            console.error("Submit failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    }, [attempt, questions, elapsedTimes, answerQuestion, submitAttempt]);

    const stopPropagation = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

    const noTimeAnsweredCount = useMemo(() => answersNoTime.filter(Boolean).length, [answersNoTime]);
    const timedAnsweredCount = useMemo(() => answersTimed.filter(Boolean).length, [answersTimed]);

    if (!isOpen) return null;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    const loading = answerLoading || isSubmitting;

    // ─── Answer grid ──────────────────────────────────────────────────────────
    const renderAnswerGrid = (
        answers: (string | null)[],
        onAnswer: (qIndex: number, choice: string) => void,
        activeColIndex?: number
    ) => (
        <table className="border-separate" style={{ borderSpacing: "5px" }}>
            <tbody>
                {/* Row 0: question number badges */}
                <tr>
                    <td className="w-6" />
                    {questions.map((q, i) => {
                        const isAnswered = !!answers[i];
                        // const isCurrent = activeColIndex === i;

                        return (
                            <td key={q.id} className="text-center p-0">
                                <button
                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-200 focus:outline-none
                                        ${isAnswered
                                            ? "bg-main-color text-white shadow-sm"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"}
                                                `}
                                    onClick={() => activeColIndex !== undefined && handleQuestionSwitch(i)}
                                    onMouseDown={stopPropagation}
                                    title={`კითხვა ${q.order}`}
                                    // In read-only mode the badges are not interactive for switching
                                    disabled={isReadOnly && activeColIndex === undefined}
                                >
                                    {q.order}
                                </button>
                            </td>
                        );
                    })}
                </tr>

                {/* Rows 1–4: one row per choice */}
                {KEYS.map((choiceKey, choiceIndex) => (
                    <tr key={choiceKey}>
                        <td className="text-center pr-1">
                            <span className="text-xs font-bold text-gray-400 select-none">
                                {GEO[choiceIndex]}
                            </span>
                        </td>
                        {questions.map((q, i) => {
                            const isSelected = answers[i] === choiceKey;
                            const isCurrent = activeColIndex === i;
                            return (
                                <td key={q.id} className="text-center p-0">
                                    <button
                                        onClick={() => !isReadOnly && onAnswer(i, choiceKey)}
                                        onMouseDown={stopPropagation}
                                        disabled={isReadOnly}
                                        className={`w-7 h-7 rounded-md border text-xs font-semibold transition-all duration-150 focus:outline-none
                                            ${isReadOnly
                                                ? isSelected
                                                    // read-only selected: solid, no hover effects
                                                    ? "bg-main-color border-main-color text-white cursor-default"
                                                    : "border-gray-100 text-gray-200 cursor-default bg-white"
                                                : isSelected
                                                    ? "bg-blue-400 border-blue-400 text-white shadow shadow-blue-200 scale-105"
                                                    : isCurrent
                                                        ? "border-blue-200 text-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500"
                                                        : "border-gray-200 text-gray-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-400"
                                            }`}
                                        title={`კითხვა ${q.order} — ${GEO[choiceIndex]}`}
                                    >
                                        {isSelected ? GEO[choiceIndex] : "·"}
                                    </button>
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );

    // ─── Read-only footer ─────────────────────────────────────────────────────
    const renderReadOnlyFooter = () => {
        const answeredCount = readOnlyAnswers.filter(Boolean).length;
        return (
            <div className="shrink-0 border-t bg-gray-50 px-4 py-3 flex items-center justify-between gap-3 select-none">
                <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-main-color inline-block" />
                        <span className="text-gray-600 font-medium">{answeredCount} შესრულებული</span>
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                        <span className="text-gray-500">{questions.length - answeredCount} გამოტოვებული</span>
                    </span>
                </div>

                <div className="flex flex-wrap gap-0.75 max-w-40">
                    {readOnlyAnswers.map((a, i) => (
                        <span
                            key={i}
                            title={`კითხვა ${i + 1}${a ? ` — ${a.toUpperCase()}` : " — გამოტოვებული"}`}
                            className={`inline-block w-2 h-2 rounded-full transition-colors duration-200 ${a ? "bg-main-color" : "bg-gray-200"}`}
                        />
                    ))}
                </div>

                <Link
                    onClick={() =>{localStorage.removeItem('attemptId')} }
                    to={`/`}
                    onMouseDown={stopPropagation}
                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-main-color text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200 transition-all duration-150 active:scale-95"
                >
                    შედეგი →
                </Link>
            </div>
        );
    };

    // ─── Editable footer ──────────────────────────────────────────────────────
    const renderFooter = (
        answeredCount: number,
        total: number,
        answers: (string | null)[],
        onSubmit: () => void,
        extra?: React.ReactNode
    ) => (
        <div className="shrink-0 border-t bg-gray-50 px-4 py-3 flex items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-main-color inline-block" />
                    <span className="text-gray-600 font-medium">{answeredCount} შესრულებული</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                    <span className="text-gray-500">{total - answeredCount} დარჩენილი</span>
                </span>
            </div>

            <div className="flex flex-wrap gap-0.75 max-w-40">
                {Array.from({ length: total }, (_, i) => (
                    <span
                        key={i}
                        title={`კითხვა ${i + 1}${answers[i] ? ` — ${answers[i]!.toUpperCase()}` : " — გამოტოვებული"}`}
                        className={`inline-block w-2 h-2 rounded-full transition-colors duration-200 ${answers[i] ? "bg-main-color" : "bg-gray-200"}`}
                    />
                ))}
            </div>

            {extra}

            <button
                onClick={onSubmit}
                onMouseDown={stopPropagation}
                disabled={loading || answeredCount === 0}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95
                    ${answeredCount === total
                        ? "bg-main-color text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200"
                        : answeredCount > 0
                            ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
            >
                {loading ? <RingLoader size={20} color="white" /> : `გაგზავნა${answeredCount > 0 ? ` (${answeredCount})` : ""}`}
            </button>
        </div>
    );

    return (
        <>
            <div
                className="fixed inset-0 bg-black/20 z-200"
                onClick={() => setIsOpen(false)}
            />

            {loading && !isSubmitting ? <Loader /> :
                <div
                    ref={modalRef}
                    className={`z-300 fixed bg-white shadow-xl flex flex-col overflow-hidden
                        ${isMobile ? "left-0 right-0 bottom-0 rounded-t-xl" : "rounded-xl cursor-move"}`}
                    style={{
                        top: isMobile ? "auto" : position.y,
                        left: isMobile ? 0 : position.x,
                        width: isMobile ? "100%" : size.width,
                        height: isMobile ? "75vh" : size.height,
                        userSelect: isDragging || isResizing ? "none" : "auto",
                    }}
                    onMouseDown={handleMouseDown}
                    onClick={stopPropagation}
                >
                    {/* Title bar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 shrink-0 select-none">
                        <div className="flex items-center gap-2">
                            {!isMobile && (
                                <div
                                    data-resize-handle="true"
                                    onMouseDown={handleResizeMouseDown}
                                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-se-resize"
                                    title="Resize"
                                >
                                    <MoveDiagonal2 size={14} />
                                </div>
                            )}
                            <h2 className="text-sm font-semibold text-gray-700 tracking-wide">
                                პასუხების ფურცელი
                            </h2>
                            {isReadOnly && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    წაკითხვა
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">
                                {isReadOnly
                                    ? `${readOnlyAnswers.filter(Boolean).length} / ${questions.length}`
                                    : `${activeTab === "no-time" ? noTimeAnsweredCount : timedAnsweredCount} / ${questions.length}`
                                }
                            </span>
                            <button
                                onClick={() => setIsOpen(false)}
                                onMouseDown={stopPropagation}
                                className="text-gray-400 hover:text-red-400 transition-colors"
                                aria-label="Close"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {/* ── Read-only mode ────────────────────────────────────── */}
                    {isReadOnly && (
                        <>
                            <div className="flex-1 overflow-auto p-4">
                                {renderAnswerGrid(readOnlyAnswers, () => { })}
                            </div>
                            {renderReadOnlyFooter()}
                        </>
                    )}

                    {/* ── No-Time Tab ──────────────────────────────────────── */}
                    {!isReadOnly && activeTab === "no-time" && (
                        <>
                            <div className="flex-1 overflow-auto p-4">
                                {renderAnswerGrid(answersNoTime, handleNoTimeAnswer)}
                            </div>
                            {renderFooter(
                                noTimeAnsweredCount,
                                questions.length,
                                answersNoTime,
                                () => handleSubmitAll(answersNoTime, "no-time")
                            )}
                        </>
                    )}

                    {/* ── Timed Tab ────────────────────────────────────────── */}
                    {!isReadOnly && activeTab === "timed" && (
                        <>
                            <div className="flex-1 overflow-auto p-4">
                                {renderAnswerGrid(answersTimed, handleTimedAnswer, currentQuestionIndex)}
                            </div>
                            {renderFooter(
                                timedAnsweredCount,
                                questions.length,
                                answersTimed,
                                () => handleSubmitAll(answersTimed, "timed")
                                // <div className="flex items-center gap-1.5">
                                //     <button
                                //         onClick={() => handleQuestionSwitch(currentQuestionIndex - 1)}
                                //         disabled={currentQuestionIndex === 0}
                                //         onMouseDown={stopPropagation}
                                //         className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                //     >
                                //         ←
                                //     </button>
                                //     <span className="text-xs text-gray-400 tabular-nums w-10 text-center">
                                //         {currentQuestionIndex + 1}/{questions.length}
                                //     </span>
                                //     <button
                                //         onClick={() => handleQuestionSwitch(currentQuestionIndex + 1)}
                                //         disabled={currentQuestionIndex === questions.length - 1}
                                //         onMouseDown={stopPropagation}
                                //         className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                //     >
                                //         →
                                //     </button>
                                // </div>
                            )}
                        </>
                    )}
                </div>
            }
        </>
    );
};

export default AnswerModal;
