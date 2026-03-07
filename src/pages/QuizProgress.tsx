import PDFViewer from "../components/PdfViewer";
import { useEffect, useState } from "react";
import { Pen, Sheet } from "lucide-react";
import Loader from "../components/reusables/Loader";
import { NoteCanvas } from "../components/NoteCanvas";
import { useStartAttemptStore } from "../stores/attemptStore";
import AnswerModal from "../components/AnswerModal";

type ActiveModal = "answers" | "notes" | null;

const QuizProgress = () => {
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);

    const {
        loading,
        attempt,
        startAttempt,
        fetchQuestions,
        questions
    } = useStartAttemptStore();

    const code = localStorage.getItem("attemptId") || "";
    useEffect(() => {
        startAttempt(code);
        fetchQuestions(code);
    }, [startAttempt, code, fetchQuestions]);

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="h-screen overflow-hidden">
            {attempt?.quiz_file && <PDFViewer fileUrl={attempt.quiz_file} />}

            {activeModal === "answers" && (
                <AnswerModal
                    key={attempt?.id}
                    isOpen
                    setIsOpen={() => setActiveModal(null)}
                    isTraining={false}
                    attempt={attempt}
                    questions={questions}
                />
            )}

            {activeModal === "notes" && (
                <NoteCanvas onClose={() => setActiveModal(null)} />
            )}

            <div className="fixed z-50 right-5 md:bottom-5 bottom-20 flex flex-col gap-y-3 justify-center items-center">
                <div
                    title="answers"
                    onClick={() => setActiveModal("answers")}
                    className="cursor-pointer hover:-translate-y-2 transition-all aspect-square bg-main-color w-20 flex justify-center items-center rounded-full"
                >
                    <Sheet size={40} color="white" />
                </div>

                <div
                    onClick={() => setActiveModal("notes")}
                    className="cursor-pointer hover:-translate-y-2 transition-all aspect-square bg-main-color w-20 flex justify-center items-center rounded-full"
                >
                    <Pen size={40} color="white" />
                </div>
            </div>
        </div>
    );
};

export default QuizProgress;

