import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiV3 } from "../utils/axios";
import { AxiosError } from "axios";
import type { IAttempt, Question, SubmittedAnswer } from "../types/types";

interface StartAttemptState {
  loading: boolean;
  error: string | null;
  success: boolean;
  attempt: IAttempt | null;
  questions: Question[] | [];
  answerLoading: boolean;
  answerQuestion: (attemptId: string, answer: SubmittedAnswer) => Promise<void>;

  startAttempt: (attemptId: string | number) => Promise<boolean>;
  fetchQuestions: (attemptId: string | number) => Promise<boolean>;
  submitAttempt: (attemptId: string) => Promise<void>;
  clearAttempt: () => void;
}

export const useStartAttemptStore = create<StartAttemptState>()(
  persist(
  (set) => ({
  loading: false,
  error: null,
  success: false,
  attempt: null,
  questions: [],
  answerLoading: false,
  startAttempt: async (attemptId) => {
    try {
      set({ loading: true, error: null, success: false });
      const res = await apiV3.post(`/quiz/attempts/${attemptId}/start/`);
      set({ success: true, attempt: res.data });
      return true;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;

      set({
        error: err.response?.data?.detail || "Failed to start attempt",
        success: false,
      });

      return false;
    } finally {
      set({ loading: false });
    }
  },

  fetchQuestions: async (attemptId) => {
    try {
      set({ loading: true, error: null, success: false });
      const res = await apiV3.get(`quiz/attempts/${attemptId}/questions/`);
      console.log("Fetched questions:", res.data);
      set({ success: true, questions: res.data });
      return true;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;

      set({
        error: err.response?.data?.detail || "Failed to start attempt",
        success: false,
      });

      return false;
    } finally {
      set({ loading: false });
    }
  },

  answerQuestion: async (attemptId: string, answer: SubmittedAnswer) => {
    set({ answerLoading: true });

    try {
      const res = await apiV3.post(`/quiz/attempts/${attemptId}/answer/`, answer);
      const updatedQuestion = res.data.updated_question;

      set((state) => ({
        answerLoading: false,
        attempt: res.data.updated_attempt,
        questions: state.questions.map((q) =>
          q.id === updatedQuestion.id ? updatedQuestion : q
        ),
      }));
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      set({ answerLoading: false });
    }
  },
  submitAttempt: async (attemptId: string) => {
    set({ answerLoading: true });

    try {
      await apiV3.post(`quiz/attempts/${attemptId}/complete/`);
      set({ answerLoading: false });
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      set({ answerLoading: false });
    }
  },
  clearAttempt: () => set({ attempt: null, questions: [], error: null, success: false }),
  }),
  {
    name: "attempt-storage",
    partialize: (state) => ({ attempt: state.attempt }),
  }
));
