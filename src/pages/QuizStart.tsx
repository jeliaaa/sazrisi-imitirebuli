import { useEffect, useState } from 'react';
import { useQuizStore } from '../stores/quizStore';
import Loader from '../components/reusables/Loader';
import { useStartAttemptStore } from '../stores/attemptStore';
import { Link } from 'react-router-dom';

const rules = [
    "გამოცდის მსვლელობისას უმჯობესია არ განაახლოთ გვერდი და არ დახუროთ ბრაუზერი.",
    "შეამოწმეთ გაეცით თუ არა ყველა შეკითხვას პასუხი, ტესტის დასრულების ღილაკის დაჭერამდე!",
    "მაღალქულიანი ამოცანები, რომლებსაც პედაგოგის შეფასება სჭირდება, გადაიტანეთ ფურცელზე და დააწერეთ თქვენი კოდი.",
    "გარე დახმარების ნებისმიერი ფორმა მკაცრად აკრძალულია.",
];

const QuizStart = () => {
    const { loading } = useQuizStore();
    const { startAttempt, loading: attemptLoading } = useStartAttemptStore();
    const code = localStorage.getItem("attemptId");
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (code) startAttempt(code);
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, [code, startAttempt]);

    if (loading || attemptLoading) return <Loader />;

    return (
        <div className="flex flex-col min-h-[90dvh]">
            <div className="flex flex-1 items-center justify-center px-6 pt-3">
                <div
                    className={`w-full max-w-5xl transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                >
                    {/* Top label */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-dark-color" />
                        <span className="text-dark-color text-md tracking-[0.25em] uppercase font-mono">
                            საგამოცდო პორტალი
                        </span>
                        <div className="h-px flex-1 bg-dark-color" />
                    </div>

                    {/* Main card */}
                    <div className="bg-[#111827] border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">

                        {/* Card header */}
                        <div className="px-10 pt-10 pb-8 border-b border-slate-700/50">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-slate-500 text-xs tracking-[0.2em] uppercase font-mono mb-2">
                                        აკადემიური შეფასება
                                    </p>
                                    <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">
                                        გამოცდის ინსტრუქციები
                                    </h1>
                                    <p className="text-slate-400 text-sm mt-2 leading-relaxed max-w-md">
                                        გთხოვთ, ყურადღებით გაეცნოთ ყველა ინსტრუქციას გამოცდის დაწყებამდე.
                                    </p>
                                </div>
                                {/* Formal badge */}
                                <div className="shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-slate-800 border border-slate-700">
                                    <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                    </svg>
                                </div>
                            </div>

                            {/* Meta row */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {[
                                    {
                                        label: "30 კითხვა (1 ქულიანები)", icon: (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        )
                                    },
                                    {
                                        label: "180 წუთი - 3 საათი", icon: (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        )
                                    },
                                    {
                                        label: "ერთი მცდელობა", icon: (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                        )
                                    },
                                ].map(({ label, icon }) => (
                                    <span key={label} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono px-3 py-1.5 rounded-lg">
                                        <span className="text-slate-500">{icon}</span>
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Rules section */}
                        <div className="px-10 py-8 border-b border-slate-700/50">
                            <p className="text-slate-500 text-xs uppercase tracking-[0.2em] font-mono mb-5">
                                წესები და ქცევის კოდექსი
                            </p>
                            <ul className="flex flex-col gap-4">
                                {rules.map((rule, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <span className="shrink-0 mt-0.5 w-6 h-6 rounded bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono flex items-center justify-center">
                                            {i + 1}
                                        </span>
                                        <span className="text-slate-300 text-sm leading-relaxed">{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Acknowledgement + CTA */}
                        <div className="px-10 py-2 bg-slate-800/30 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
                                <span className="text-slate-400 text-xs font-mono">სესია დადასტურებულია</span>
                            </div>

                            <Link
                                to="/quiz/progress"
                                className="group inline-flex items-center gap-2.5 bg-slate-100 hover:bg-white text-slate-900 text-sm font-semibold px-7 py-3 rounded-xl transition-all duration-200 active:scale-95 tracking-wide shadow-lg"
                            >
                                გამოცდის დაწყება
                                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* Footer note */}
                    <p className="text-center text-slate-600 text-xs font-mono mt-6 tracking-wide">
                        გაგრძელებით თქვენ ეთანხმებით გამოცდის წესსა და პირობებს.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuizStart;