
import { StudyPlanItem } from "@/types";
import { v4 as uuidv4 } from "uuid";

const STUDY_PLANS_KEY = 'interviewAce_study_plans';

export const prepPlannerService = {
  getStudyPlans(): StudyPlanItem[] {
    try {
      const storedPlans = localStorage.getItem(STUDY_PLANS_KEY);
      return storedPlans ? JSON.parse(storedPlans) : [];
    } catch (error) {
      console.error("Error loading study plans:", error);
      return [];
    }
  },

  getStudyPlansByUserId(userId: string): StudyPlanItem[] {
    try {
      const allPlans = this.getStudyPlans();
      return allPlans.filter(plan => plan.userId === userId);
    } catch (error) {
      console.error("Error filtering study plans:", error);
      return [];
    }
  },

  saveStudyPlan(plan: Omit<StudyPlanItem, 'id'>): StudyPlanItem {
    try {
      const allPlans = this.getStudyPlans();
      const newPlan = { ...plan, id: uuidv4() };
      
      allPlans.push(newPlan);
      localStorage.setItem(STUDY_PLANS_KEY, JSON.stringify(allPlans));
      
      return newPlan;
    } catch (error) {
      console.error("Error saving study plan:", error);
      throw error;
    }
  },

  updateStudyPlan(plan: StudyPlanItem): StudyPlanItem {
    try {
      const allPlans = this.getStudyPlans();
      const planIndex = allPlans.findIndex(p => p.id === plan.id);
      
      if (planIndex >= 0) {
        allPlans[planIndex] = plan;
        localStorage.setItem(STUDY_PLANS_KEY, JSON.stringify(allPlans));
        return plan;
      } else {
        throw new Error("Study plan not found");
      }
    } catch (error) {
      console.error("Error updating study plan:", error);
      throw error;
    }
  },

  deleteStudyPlan(planId: string): void {
    try {
      const allPlans = this.getStudyPlans();
      const updatedPlans = allPlans.filter(p => p.id !== planId);
      
      localStorage.setItem(STUDY_PLANS_KEY, JSON.stringify(updatedPlans));
    } catch (error) {
      console.error("Error deleting study plan:", error);
      throw error;
    }
  }
};
