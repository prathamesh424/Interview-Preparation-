
import { SavedQuestion } from "@/types";

const SAVED_QUESTIONS_KEY = 'interviewAce_saved_questions';

export const storageService = {
  // --- Generic Local Storage Methods ---
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      // Add basic check for 'undefined' string which can happen
      if (item === null || item === 'undefined') return null; 
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error getting item "${key}" from localStorage:`, error);
      // Attempt to remove corrupted item
      localStorage.removeItem(key); 
      return null;
    }
  },

  setItem<T>(key: string, value: T): void {
    try {
      if (value === undefined) {
         // Don't store undefined, remove the key instead
         this.removeItem(key);
      } else {
         localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting item "${key}" in localStorage:`, error);
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item "${key}" from localStorage:`, error);
    }
  },
  // --- End Generic Methods ---

  // --- Specific methods for Saved Questions ---
  getSavedQuestions(): SavedQuestion[] {
    try {
      // Revert to original implementation to avoid 'this' typing issue
      const savedData = localStorage.getItem(SAVED_QUESTIONS_KEY);
      return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
      console.error("Error loading saved questions:", error);
      return [];
    }
  },

  saveQuestion(question: SavedQuestion): void {
    try {
      const savedQuestions = this.getSavedQuestions();
      const existingIndex = savedQuestions.findIndex(q => q.id === question.id);
      
      if (existingIndex >= 0) {
        // Update existing question
        savedQuestions[existingIndex] = question;
      } else {
        // Add new question
        savedQuestions.push(question);
      }
      
      localStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(savedQuestions));
    } catch (error) {
      console.error("Error saving question:", error);
    }
  },

  deleteQuestion(questionId: string): void {
    try {
      const savedQuestions = this.getSavedQuestions();
      const updatedQuestions = savedQuestions.filter(q => q.id !== questionId);
      localStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  },

  updateQuestionTags(questionId: string, tags: string[]): void {
    try {
      const savedQuestions = this.getSavedQuestions();
      const questionIndex = savedQuestions.findIndex(q => q.id === questionId);
      
      if (questionIndex >= 0) {
        savedQuestions[questionIndex].tags = tags;
        localStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(savedQuestions));
      }
    } catch (error) {
      console.error("Error updating question tags:", error);
    }
  },

  updateQuestionNotes(questionId: string, notes: string): void {
    try {
      const savedQuestions = this.getSavedQuestions();
      const questionIndex = savedQuestions.findIndex(q => q.id === questionId);
      
      if (questionIndex >= 0) {
        savedQuestions[questionIndex].notes = notes;
        localStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(savedQuestions));
      }
    } catch (error) {
      console.error("Error updating question notes:", error);
    }
  },

  updateQuestionSubject(questionId: string, subject: string): void {
    try {
      const savedQuestions = this.getSavedQuestions();
      const questionIndex = savedQuestions.findIndex(q => q.id === questionId);
      
      if (questionIndex >= 0) {
        savedQuestions[questionIndex].subject = subject;
        localStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(savedQuestions));
      }
    } catch (error) {
      console.error("Error updating question subject:", error);
    }
  },

  getAllSubjects(): string[] {
    try {
      const savedQuestions = this.getSavedQuestions();
      const subjects: string[] = savedQuestions
        .map(q => q.subject)
        .filter((subject): subject is string => subject !== undefined && subject !== null);
      
      return [...new Set(subjects)];
    } catch (error) {
      console.error("Error getting subjects:", error);
      return [];
    }
  },

  getAllTags(): string[] {
    try {
      const savedQuestions = this.getSavedQuestions();
      const allTags: string[] = savedQuestions
        .flatMap(q => q.tags || [])
        .filter((tag): tag is string => tag !== undefined && tag !== null);
      
      return [...new Set(allTags)];
    } catch (error) {
      console.error("Error getting tags:", error);
      return [];
    }
  }
};
