import { MoveDiagonal2 } from "lucide-react";
import { type SetStateAction, type Dispatch, useState, useReducer, useRef, useEffect, useCallback } from "react";
import type { IAttempt, Question, QuestionWithAnswers } from "../types/types";
import { useStartAttemptStore } from "../stores/attemptStore";
import { Link } from "react-router-dom";
import Loader from "./reusables/Loader";

interface AnswerModalProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    isTraining: boolean;
    attempt: IAttempt | null | undefined;
    questions: Question[] | QuestionWithAnswers[] | [];
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

interface QuizState {
    currentQuestionIndex: number;
    submittedQuestions: Set<number>;
    elapsedTimes: Map<number, number>;
    answersNoTime: (string | null)[];
    answersTimed: (string | null)[];
}

type QuizAction =
    | { type: "RESET"; total: number }
    | { type: "SET_INDEX"; payload: number }
    | { type: "SET_ANSWER_NO_TIME"; payload: (string | null)[] }
    | { type: "SET_ANSWER_TIMED"; payload: (string | null)[] }
    | { type: "ADD_SUBMITTED"; payload: Set<number> }
    | { type: "SET_ELAPSED"; payload: Map<number, number> };

function buildInitial(total: number): QuizState {
    return {
        currentQuestionIndex: 0,
        submittedQuestions: new Set<number>(),
        elapsedTimes: new Map<number, number>(),
        answersNoTime: Array(total).fill(null),
        answersTimed: Array(total).fill(null),
    };
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
    switch (action.type) {
        case "RESET":
            return buildInitial(action.total);
        case "SET_INDEX":
            return { ...state, currentQuestionIndex: action.payload };
        case "SET_ANSWER_NO_TIME":
            return { ...state, answersNoTime: action.payload };
        case "SET_ANSWER_TIMED":
            return { ...state, answersTimed: action.payload };
        case "ADD_SUBMITTED":
            return { ...state, submittedQuestions: action.payload };
        case "SET_ELAPSED":
            return { ...state, elapsedTimes: action.payload };
        default:
            return state;
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

const AnswerModal = ({
    isOpen,
    setIsOpen,
    isTraining,
    attempt,
    questions,
}: AnswerModalProps) => {
    const { answerLoading, answerQuestion } = useStartAttemptStore();

    const activeTab = isTraining ? "no-time" : "timed";

    const [quizState, dispatch] = useReducer(
        quizReducer,
        buildInitial(attempt?.total_questions ?? 0)
    );

    const { currentQuestionIndex, submittedQuestions, elapsedTimes, answersNoTime, answersTimed } = quizState;

    const questionStartTime = useRef<number | null>(null);

    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [size, setSize] = useState({ width: 600, height: 600 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const dragStart = useRef<{ mouseX: number; mouseY: number; divX: number; divY: number } | null>(null);
    const resizeStart = useRef<{ mouseX: number; mouseY: number; width: number; height: number } | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const currentQuestion = questions[currentQuestionIndex] ?? null;

    const isQuestionAnswered =
        !!currentQuestion &&
        "user_answer" in currentQuestion &&
        !!currentQuestion.user_answer?.selected_answer;

    const allAnswered =
        questions.length > 0 &&
        questions.every((q) => "user_answer" in q && q.user_answer?.selected_answer);

    // Reset all state when attempt changes — single dispatch, no cascading renders
    useEffect(() => {
        dispatch({ type: "RESET", total: attempt?.total_questions ?? 0 });
        if (!isTraining && isOpen) {
            questionStartTime.current = Date.now();
        }
    }, [attempt?.id, attempt?.total_questions, isTraining, isOpen]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging && dragStart.current) {
            const dx = e.clientX - dragStart.current.mouseX;
            const dy = e.clientY - dragStart.current.mouseY;
            setPosition({
                x: Math.max(0, dragStart.current.divX + dx),
                y: Math.max(0, dragStart.current.divY + dy),
            });
        } else if (isResizing && resizeStart.current) {
            const dx = e.clientX - resizeStart.current.mouseX;
            const dy = e.clientY - resizeStart.current.mouseY;
            setSize({
                width: Math.max(300, resizeStart.current.width + dx),
                height: Math.max(200, resizeStart.current.height + dy),
            });
        }
    }, [isDragging, isResizing]);

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

    const handleQuestionSwitch = useCallback((newIndex: number) => {
        if (newIndex < 0 || newIndex >= questions.length) return;

        if (questionStartTime.current !== null && currentQuestion && !isQuestionAnswered) {
            const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
            const updated = new Map(elapsedTimes);
            updated.set(currentQuestion.order, (updated.get(currentQuestion.order) || 0) + timeSpent);
            dispatch({ type: "SET_ELAPSED", payload: updated });
        }

        dispatch({ type: "SET_INDEX", payload: newIndex });

        const newQuestion = questions[newIndex];
        const hasSelectedAnswer = newQuestion && "user_answer" in newQuestion && newQuestion.user_answer?.selected_answer;

        if (newQuestion && !hasSelectedAnswer && !submittedQuestions.has(newQuestion.order)) {
            questionStartTime.current = Date.now();
        } else {
            questionStartTime.current = null;
        }
    }, [questions, currentQuestion, submittedQuestions, elapsedTimes, isQuestionAnswered]);

    const handleNoTimeAnswer = useCallback((questionIndex: number, choice: string) => {
        const updated = [...answersNoTime];
        updated[questionIndex] = choice;
        dispatch({ type: "SET_ANSWER_NO_TIME", payload: updated });
    }, [answersNoTime]);

    const handleTimedAnswer = useCallback((choice: string) => {
        if (!currentQuestion || isQuestionAnswered) return;
        const updated = [...answersTimed];
        updated[currentQuestion.order] = choice;
        dispatch({ type: "SET_ANSWER_TIMED", payload: updated });
    }, [currentQuestion, isQuestionAnswered, answersTimed]);

    const handleTimedComplete = useCallback(async () => {
        if (!currentQuestion || !attempt || isQuestionAnswered) return;

        const selectedAnswer = answersTimed[currentQuestion.order];
        if (!selectedAnswer) {
            alert("Please select an answer before completing.");
            return;
        }

        if (submittedQuestions.has(currentQuestion.order)) {
            alert("You have already completed this question.");
            return;
        }

        const timeSpentNow = questionStartTime.current
            ? Math.floor((Date.now() - questionStartTime.current) / 1000)
            : 0;
        const totalTime = (elapsedTimes.get(currentQuestion.order) || 0) + timeSpentNow;

        try {
            await answerQuestion(attempt.id.toString(), {
                question_id: currentQuestion.id,
                selected_answer: selectedAnswer,
                time_taken: totalTime,
            });

            const newSubmitted = new Set(submittedQuestions).add(currentQuestion.order);
            dispatch({ type: "ADD_SUBMITTED", payload: newSubmitted });

            const newElapsed = new Map(elapsedTimes);
            newElapsed.set(currentQuestion.order, totalTime);
            dispatch({ type: "SET_ELAPSED", payload: newElapsed });

            questionStartTime.current = null;

            const nextUnansweredIndex = questions.findIndex((q, index) => {
                const hasSelectedAnswer = "user_answer" in q && q.user_answer?.selected_answer;
                return index > currentQuestionIndex && !hasSelectedAnswer && !newSubmitted.has(q.order);
            });

            if (nextUnansweredIndex !== -1) {
                handleQuestionSwitch(nextUnansweredIndex);
            }
        } catch (error) {
            console.error("Failed to submit answer:", error);
            alert("Failed to submit answer. Please try again.");
        }
    }, [currentQuestion, attempt, answersTimed, submittedQuestions, elapsedTimes, answerQuestion, questions, currentQuestionIndex, handleQuestionSwitch, isQuestionAnswered]);

    const handleSkip = useCallback(() => {
        if (!currentQuestion || isQuestionAnswered) return;

        if (questionStartTime.current !== null) {
            const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
            const updated = new Map(elapsedTimes);
            updated.set(currentQuestion.order, (updated.get(currentQuestion.order) || 0) + timeSpent);
            dispatch({ type: "SET_ELAPSED", payload: updated });
            questionStartTime.current = null;
        }

        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            handleQuestionSwitch(nextIndex);
        }
    }, [currentQuestion, currentQuestionIndex, questions.length, handleQuestionSwitch, isQuestionAnswered, elapsedTimes]);

    const stopPropagation = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/10 bg-opacity-40 z-200"
                onClick={() => setIsOpen(false)}
            />

            {answerLoading ? <Loader /> :
                <div
                    ref={modalRef}
                    className={`z-300 fixed bg-white p-4 overflow-auto shadow-lg rounded-md 
                        ${window.innerWidth < 1024 ? "left-1/2 -translate-x-1/2 bottom-0 cursor-default" : "cursor-move"}`}
                    style={{
                        top: window.innerWidth < 1024 ? "auto" : position.y,
                        left: window.innerWidth < 1024 ? "50%" : position.x,
                        width: window.innerWidth < 1024 ? "100%" : size.width,
                        height: window.innerWidth < 1024 ? "60%" : size.height,
                        userSelect: isDragging || isResizing ? "none" : "auto",
                    }}
                    onMouseDown={handleMouseDown}
                    onClick={stopPropagation}
                >
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-2 right-2 text-xl font-bold cursor-pointer z-10 hover:text-red-500"
                        aria-label="Close Modal"
                        onMouseDown={stopPropagation}
                    >
                        ×
                    </button>

                    <div className="flex flex-wrap gap-4 mb-4 justify-center select-none">
                        <h2 className="text-lg font-semibold">პასუხების ფურცელი</h2>
                    </div>

                    {activeTab === "no-time" && (
                        <div className="overflow-auto max-h-[70vh]">
                            <table className="w-full text-sm sm:text-base table-fixed border">
                                <thead>
                                    <tr>
                                        <th className="border px-1 py-1 w-8 sm:w-10">#</th>
                                        {["ა", "ბ", "გ", "დ"].map((choice) => (
                                            <th key={choice} className="border px-1 py-1">{choice}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.map((_, i) => (
                                        <tr key={i}>
                                            <td className="border text-center">{i + 1}</td>
                                            {["ა", "ბ", "გ", "დ"].map((choice) => (
                                                <td key={choice} className="border text-center">
                                                    <input
                                                        type="radio"
                                                        name={`noTime-${i}`}
                                                        value={choice}
                                                        checked={answersNoTime[i] === choice}
                                                        onChange={() => handleNoTimeAnswer(i, choice)}
                                                        className="mx-auto"
                                                        onMouseDown={stopPropagation}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-4 text-right">
                                <button
                                    onClick={() => alert("Submit clicked (implement your logic)")}
                                    className="border px-6 py-2 hover:bg-gray-100 rounded"
                                    disabled={answerLoading}
                                >
                                    {answerLoading ? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "timed" && (
                        <div className="flex flex-col gap-4">
                            <div className="overflow-x-auto whitespace-nowrap border-b py-2">
                                {questions.map((q, index) => {
                                    const hasSelectedAnswer = "user_answer" in q && q.user_answer?.selected_answer;
                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => handleQuestionSwitch(index)}
                                            className={`inline-block px-3 py-1 mx-1 bg-gray-300 rounded-sm transition-colors ${currentQuestionIndex === index ? "border-2" : "border-0"}`}
                                            onMouseDown={stopPropagation}
                                            title={hasSelectedAnswer ? `Answered: ${q.user_answer?.selected_answer?.toUpperCase()}` : "Not answered"}
                                        >
                                            {q.order}
                                        </button>
                                    );
                                })}
                                {allAnswered && (
                                    <Link
                                        to={`/quiz/result/${attempt?.id}`}
                                        className="inline-block px-3 py-1 mx-1 rounded-sm transition-colors border-2"
                                        onMouseDown={stopPropagation}
                                    >
                                        დასრულება
                                    </Link>
                                )}
                            </div>

                            <div className="text-center text-base font-semibold">
                                კითხვა {currentQuestion?.order} / {questions.length}
                                {isQuestionAnswered && (
                                    <div className="mt-1">
                                        <span className="text-main-color title">შესრულებულია</span>
                                        {currentQuestion && "user_answer" in currentQuestion && currentQuestion.user_answer && (
                                            <div className="text-sm text-gray-600 mt-1">
                                                თქვენი პასუხი: <strong>{currentQuestion.user_answer.selected_answer.toUpperCase()}</strong>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 justify-center max-w-sm mx-auto">
                                {["a", "b", "g", "d"].map((choice, index) => {
                                    const georgianChoices = ["ა", "ბ", "გ", "დ"];
                                    const selectedAnswer = currentQuestion?.user_answer?.selected_answer ?? answersTimed[currentQuestion?.order];
                                    const isSelected = selectedAnswer === choice;
                                    const isDisabled = isQuestionAnswered;

                                    return (
                                        <label
                                            key={choice}
                                            className={`flex items-center gap-2 border p-2 rounded cursor-pointer transition-colors
                                                ${isSelected ? "bg-main-color/10 border-main-color" : "hover:bg-gray-50"}
                                                ${isDisabled ? "cursor-not-allowed" : ""}`}
                                            onMouseDown={stopPropagation}
                                        >
                                            <input
                                                type="radio"
                                                name="timedAnswer"
                                                value={choice}
                                                checked={isSelected}
                                                onChange={() => !isDisabled && handleTimedAnswer(choice)}
                                                disabled={isDisabled}
                                            />
                                            <span className={isSelected ? "text-main-color font-bold" : ""}>
                                                {georgianChoices[index]}
                                            </span>
                                            {isSelected && isDisabled && (
                                                <span className="ml-auto text-main-color">✓</span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>

                            <div className="flex justify-center gap-4 mt-4">
                                <button
                                    onClick={handleSkip}
                                    className="border px-6 py-2 rounded hover:bg-gray-100 transition-colors"
                                    type="button"
                                    disabled={answerLoading || isQuestionAnswered}
                                >
                                    გამოტოვება
                                </button>
                                <button
                                    onClick={handleTimedComplete}
                                    className={`border px-6 py-2 rounded transition-colors ${isQuestionAnswered
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-blue-500 text-white hover:bg-blue-600"}`}
                                    type="button"
                                    disabled={answerLoading || isQuestionAnswered}
                                >
                                    {answerLoading ? "ატვირთვა..." : isQuestionAnswered ? "უკვე შესრულებულია" : "შესრულება"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div
                        data-resize-handle="true"
                        onMouseDown={handleResizeMouseDown}
                        className="w-8 h-8 bg-gray-100 flex items-center justify-center absolute top-1 left-1 cursor-se-resize rounded hover:bg-gray-200 transition-colors"
                        title="Resize"
                    >
                        <MoveDiagonal2 size={16} />
                    </div>
                </div>
            }
        </>
    );
};

export default AnswerModal;