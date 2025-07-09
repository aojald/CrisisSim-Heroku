import React, { useState, useEffect, useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { useNotifications } from '../context/NotificationContext';
import { AlertTriangle, Clock, CheckCircle, AlertCircle, ThumbsUp, HelpCircle, Users, Zap } from 'lucide-react';
import DecisionTree from './DecisionTree';
import ResourceCheck from './ResourceCheck';
import ConfidenceRating from './ConfidenceRating';
import { ConfidenceLevel, Resource } from '../types';
import CyberGuide from './tutorial/CyberGuide';
import ProgressIndicator from './ProgressIndicator';
import PlayerDashboard from './PlayerDashboard';
import Chat from './Chat';
import wsClient, { debug } from '../utils/socket';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Simulation() {
  const { state, dispatch } = useSimulation();
  const { unreadCount } = useNotifications();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidenceRating, setConfidenceRating] = useState<ConfidenceLevel | null>(null);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [showConfidenceAlert, setShowConfidenceAlert] = useState(false);
  const [shuffledResources, setShuffledResources] = useState<Resource[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<typeof state.currentScenario.timeline[0]['options']>([]);
  const [showCyberGuide, setShowCyberGuide] = useState(false);
  const [showPlayerDashboard, setShowPlayerDashboard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [waitingForOthers, setWaitingForOthers] = useState(false);

  const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
  const currentDecision = state.currentScenario?.timeline[currentPlayer?.currentStep || 0];
  const isSinglePlayer = state.currentScenario?.mode === 'single';

  // Check if simulation is complete
  const isSimulationComplete = useMemo(() => {
    if (!state.currentScenario || !currentPlayer) {
      return false;
    }
    return currentPlayer.currentStep >= state.currentScenario.timeline.length;
  }, [state.currentScenario, currentPlayer]);

  // Initialize simulation state
  useEffect(() => {
    if (!currentPlayer || !state.currentScenario) {
      console.error('Missing required simulation state:', {
        currentPlayer,
        scenario: state.currentScenario
      });
      return;
    }

    if (currentDecision) {
      debug('Initializing decision point:', {
        step: currentPlayer.currentStep,
        decisionId: currentDecision.id
      });
      setTimeLeft(currentDecision.timeLimit);
      setConfidenceRating(null);
      setSelectedOption(null);
      setSelectedResources([]);
      setShowConfidenceAlert(false);
      setError(null);
      setHasAnswered(false);
      setWaitingForOthers(false);

      if (currentDecision.requiredResources) {
        setShuffledResources(shuffleArray(currentDecision.requiredResources));
      }
      if (currentDecision.options) {
        setShuffledOptions(shuffleArray(currentDecision.options));
      }

      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentDecision, currentPlayer?.currentStep, state.currentScenario]);

  // Listen for simulation events
  useEffect(() => {
    const handleDecisionMade = (data: any) => {
      if (!currentPlayer) return;
      debug('Decision made event received:', {
        playerId: data.playerId,
        currentPlayerId: currentPlayer.id
      });

      // Process decision for any player (not just current player)
      debug('Processing decision for player:', data.playerId);
      dispatch({
        type: 'ADD_RESPONSE',
        payload: {
          playerId: data.playerId,
          response: data.decision
        }
      });
      
      // If it's the current player's decision, update UI state
      if (data.playerId === currentPlayer.id) {
        setHasAnswered(true);
        setWaitingForOthers(!isSinglePlayer);
      }
      
      // If player data is included, update the player in state
      if (data.player) {
        dispatch({
          type: 'ADD_PLAYER',
          payload: data.player
        });
      }
    };

    const handleAdvanceSimulation = (data: any) => {
      debug('Advance simulation event received (raw):', {
      playerId: data.playerId,
      currentPlayerId: state.currentPlayerId,
      step: data.step,
      mode: data.mode,
      hasCurrentPlayer: !!currentPlayer
      });
      if (!currentPlayer) {
      debug('No current player found, skipping advance');
      return;
      }      
      debug('Advance simulation event received (processed):', {
          playerId: data.playerId,
          currentPlayerId: currentPlayer.id,
          step: data.step,
          mode: data.mode
      });
      if (data.playerId === currentPlayer.id) {
        debug('Advancing simulation for current player to step:', data.step);
        dispatch({
          type: 'NEXT_STEP',
          payload: {
            playerId: data.playerId,
            step: data.step // Use server-provided step
          }
        });
        // Reset state for next decision
        setSelectedOption(null);
        setConfidenceRating(null);
        setSelectedResources([]);
        setHasAnswered(false);
        setWaitingForOthers(false);
        setIsSubmitting(false);
        setShowConfidenceAlert(false);
        setError(null);
      }
    };

    const handleSimulationCompleted = () => {
      debug('Simulation completed event received');
      setHasAnswered(false);
      setWaitingForOthers(false);
    };

    // Register event listeners
    wsClient.on('decision_made', handleDecisionMade);
    wsClient.on('advance_simulation', handleAdvanceSimulation);
    wsClient.on('simulation_completed', handleSimulationCompleted);

    // Cleanup listeners on unmount
    return () => {
      wsClient.off('decision_made', handleDecisionMade);
      wsClient.off('advance_simulation', handleAdvanceSimulation);
      wsClient.off('simulation_completed', handleSimulationCompleted);
    };
  }, [currentPlayer, dispatch, isSinglePlayer]);

  const handleOptionSelect = async (optionId: string) => {
    if (!currentDecision || !currentPlayer || isSubmitting || hasAnswered) return;

    if (!confidenceRating) {
      setShowConfidenceAlert(true);
      document.querySelector('.confidence-rating')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      return;
    }

    if (!wsClient.isConnected()) {
      setError('Not connected to server. Attempting to reconnect...');
      try {
        await wsClient.sendDecision(decision);
        setHasAnswered(true);
        // Request latest state to ensure sync after decision
        await wsClient.requestState();
        setError(null);
      } catch (err) {
        setError('Failed to reconnect to server. Please refresh the page.');
        console.error('Reconnection failed:', err);
        return;
      }
    }

    setShowConfidenceAlert(false);
    setSelectedOption(optionId);
    setIsSubmitting(true);
    setError(null);

    const decision = {
      decisionId: currentDecision.id,
      optionId,
      responseTime: currentDecision.timeLimit - timeLeft,
      confidenceLevel: confidenceRating,
      availableResources: selectedResources,
      timestamp: Date.now()
    };

    try {
      await wsClient.sendDecision(decision);
      setHasAnswered(true);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unknown error occurred';
      console.error('Failed to process decision:', errorMessage);
      setError(`Failed to process decision: ${errorMessage}`);
      setSelectedOption(null);
      setHasAnswered(false);
      setWaitingForOthers(false);
      setIsSubmitting(false);
    }
  };

  const handleResourceToggle = (resourceId: string) => {
    if (hasAnswered) return;
    setSelectedResources(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  if (isSimulationComplete) {
    return <DecisionTree />;
  }

  if (!currentDecision || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to load simulation
          </h2>
          <p className="text-gray-600">
            Please refresh the page or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  const roleContext = currentDecision.roleContext[currentPlayer.role] || '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ProgressIndicator />
      {showPlayerDashboard && <PlayerDashboard />}
      {!isSinglePlayer && <Chat showPlayerDashboard={showPlayerDashboard} />}

      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            {error}
          </div>
        </div>
      )}


      {showCyberGuide && <CyberGuide onClose={() => setShowCyberGuide(false)} />}

      <div className="w-full px-2 sm:px-4">
        <div className="flex items-center justify-between mb-6 max-w-[1920px] mx-auto px-2 sm:px-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Decision Point {currentPlayer.currentStep + 1}
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {currentPlayer.name} ({currentPlayer.role})
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Quick Reference Guide Button */}
            <button
              onClick={() => setShowCyberGuide(true)}
              className="flex items-center px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              title="Quick Reference Guide"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden lg:inline ml-2">Guide</span>
            </button>

            {/* Chat Button for Multiplayer */}
            {!isSinglePlayer && (
              <button
                onClick={() => setShowPlayerDashboard(!showPlayerDashboard)}
                className="flex items-center px-3 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-700 dark:hover:bg-green-600 transition-colors relative"
                title="Team Chat"
              >
                <Users className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Chat</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className={`font-mono ${timeLeft < 60 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[1920px] mx-auto ${showPlayerDashboard ? 'pr-96' : ''}`}>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-xl text-gray-800 dark:text-gray-200 leading-relaxed">{currentDecision.text}</p>
                  {roleContext && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mt-4">
                      <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">Role Context</h3>
                      <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                        {roleContext}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {shuffledResources.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <ResourceCheck
                  resources={shuffledResources}
                  selectedResources={selectedResources}
                  onResourceToggle={handleResourceToggle}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!hasAnswered && (
              <>
                <div className="confidence-rating">
                  <ConfidenceRating
                    onRatingSelect={(rating) => {
                      setConfidenceRating(rating);
                      setShowConfidenceAlert(false);
                    }}
                    selectedRating={confidenceRating}
                  />

                  {showConfidenceAlert && (
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4 animate-slide-up">
                      <div className="flex items-center">
                        <ThumbsUp className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-3" />
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Please rate your confidence level before proceeding
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {shuffledOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={selectedOption !== null || isSubmitting}
                      className={`w-full p-6 rounded-lg border-2 transition-all ${
                        selectedOption === option.id
                          ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md bg-white dark:bg-gray-800'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start">
                        {selectedOption === option.id && (
                          <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400 mr-3 flex-shrink-0 mt-1" />
                        )}
                        <div className="text-left flex-1">
                          <p className={`text-lg leading-relaxed ${
                            selectedOption === option.id
                              ? 'text-green-900 dark:text-green-100'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {option.text}
                          </p>
                          {selectedOption === option.id && option.feedback && (
                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 rounded-lg animate-fade-in">
                              <p className="text-green-800 dark:text-green-200 text-sm">
                                {option.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {hasAnswered && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                  <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
                    Decision Submitted
                  </h3>
                </div>
                {waitingForOthers && !isSinglePlayer ? (
                  <p className="text-green-800 dark:text-green-200">
                    Waiting for other players to make their decisions...
                  </p>
                ) : (
                  <p className="text-green-800 dark:text-green-200">
                    Processing your decision...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}