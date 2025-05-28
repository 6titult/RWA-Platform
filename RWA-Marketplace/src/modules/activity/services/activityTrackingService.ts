/**
 * Activity Tracking Service
 * 
 * This service provides functionality for tracking and managing activity results
 * related to blockchain transactions and user interactions.
 */

import { ActionType, ActionStatus, TestResult } from '../../../types/index';

export interface ActivityTrackingService {
  /**
   * Add a new activity result to the tracking system
   * @param result The activity result to add
   */
  addActivityResult: (result: {
    action: ActionType;
    status: ActionStatus;
    assetId?: number;
    amount?: string;
    txHash?: string;
    error?: string;
    details?: string;
    timestamp?: number;
  }) => void;

  /**
   * Get all tracked activity results
   */
  getResults: () => TestResult[];
}

/**
 * Create an activity tracking service from the provided add function
 * @param addFunction The function to add activity results
 * @param resultsGetter The function to get all results
 * @returns An ActivityTrackingService instance
 */
export function createActivityTrackingService(
  addFunction: (result: {
    action: ActionType;
    status: ActionStatus;
    assetId?: number;
    amount?: string;
    txHash?: string;
    error?: string;
    details?: string;
    timestamp?: number;
  }) => void,
  resultsGetter: () => TestResult[]
): ActivityTrackingService {
  return {
    addActivityResult: addFunction,
    getResults: resultsGetter
  };
}
