import React from 'react';
import { ThumbsUp } from 'lucide-react';
import { ConfidenceLevel } from '../types';

interface Props {
  onRatingSelect: (rating: ConfidenceLevel) => void;
  selectedRating: ConfidenceLevel | null;
}

export default function ConfidenceRating({ onRatingSelect, selectedRating }: Props) {
  const getButtonStyles = (rating: number) => {
    // Base gradient colors from red to green
    const gradients = {
      1: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800',
      2: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-700 dark:hover:from-orange-700 dark:hover:to-orange-800',
      3: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 dark:from-yellow-600 dark:to-yellow-700 dark:hover:from-yellow-700 dark:hover:to-yellow-800',
      4: 'from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 dark:from-lime-600 dark:to-lime-700 dark:hover:from-lime-700 dark:hover:to-lime-800',
      5: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800'
    };

    const baseStyle = 'flex-1 h-10 rounded-md flex items-center justify-center text-sm font-medium transition-all';
    const selectedStyle = 'ring-2 ring-offset-2 dark:ring-offset-gray-800 text-white shadow-lg scale-105';
    const unselectedStyle = 'text-white opacity-90 hover:opacity-100 shadow-sm';

    return `${baseStyle} ${
      selectedRating === rating
        ? `bg-gradient-to-br ${gradients[rating as keyof typeof gradients]} ${selectedStyle}`
        : `bg-gradient-to-br ${gradients[rating as keyof typeof gradients]} ${unselectedStyle}`
    }`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center mb-3">
        <ThumbsUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Rate your confidence level
        </h3>
      </div>

      <div className="flex gap-2">
        {([1, 2, 3, 4, 5] as ConfidenceLevel[]).map((rating) => (
          <button
            key={rating}
            onClick={() => onRatingSelect(rating)}
            className={getButtonStyles(rating)}
          >
            {rating}
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Low Confidence</span>
        <span>High Confidence</span>
      </div>
    </div>
  );
}