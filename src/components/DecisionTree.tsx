import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls,
  Node,
  Edge,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowProvider,
  ConnectionMode,
  Handle
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { useSimulation } from '../context/SimulationContext';
import { Shield, CheckCircle, XCircle, Activity, Target, Zap, ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import SimulationAnalysis from './analysis/SimulationAnalysis';

const customStyles = `
  .react-flow__edge {
    z-index: 1;
  }
  
  .react-flow__edge-path {
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  
  .react-flow__edge.animated .react-flow__edge-path {
    stroke-dasharray: 5;
    animation: dashdraw 1s linear infinite;
  }
  
  .react-flow__handle {
    width: 8px !important;
    height: 8px !important;
    border: 2px solid white;
    background: currentColor;
  }
  
  .react-flow__node {
    z-index: 2;
  }
  
  @keyframes dashdraw {
    from {
      stroke-dashoffset: 10;
    }
  }
`;

const getConfidenceColors = (confidenceLevel: number) => {
  switch (confidenceLevel) {
    case 5: return { gradient: 'from-emerald-500 to-emerald-600', edge: '#059669' };
    case 4: return { gradient: 'from-green-500 to-green-600', edge: '#16a34a' };
    case 3: return { gradient: 'from-yellow-500 to-yellow-600', edge: '#ca8a04' };
    case 2: return { gradient: 'from-orange-500 to-orange-600', edge: '#ea580c' };
    case 1: return { gradient: 'from-red-500 to-red-600', edge: '#dc2626' };
    default: return { gradient: 'from-blue-500 to-blue-600', edge: '#2563eb' };
  }
};

const RoleNode = ({ data }) => (
  <div className="group transition-all duration-300">
    <Handle
      type="source"
      position={Position.Right}
      style={{ background: '#2563eb' }}
    />
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg min-w-[250px] max-w-[300px]">
      <div className="flex items-center text-white mb-3">
        <Shield className="w-5 h-5 mr-2" />
        <div>
          <span className="font-medium">{data.role}</span>
          {data.playerName && (
            <div className="text-xs text-blue-100 mt-1">{data.playerName}</div>
          )}
        </div>
      </div>
      <div className="text-sm text-blue-50/90 leading-relaxed">
        {data.context}
      </div>
    </div>
  </div>
);

const DecisionNode = ({ data }) => (
  <div className="group transition-all duration-300">
    <Handle
      type="target"
      position={Position.Left}
      style={{ background: '#7c3aed' }}
    />
    <Handle
      type="source"
      position={Position.Right}
      style={{ background: '#7c3aed' }}
    />
    <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 min-w-[300px] max-w-[400px]">
      <div className="flex items-center space-x-2 mb-3">
        <div className="p-1.5 bg-violet-50 rounded-lg">
          <Target className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <div className="text-sm font-medium text-violet-900">Decision Point {data.step}</div>
          <div className="text-xs text-violet-500">Critical Response Required</div>
        </div>
      </div>
      <div className="text-sm text-gray-600 leading-relaxed mb-3">
        {data.text}
      </div>
      {data.resources && data.resources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.resources.map((resource, i) => (
            <div
              key={i}
              className={`text-xs px-2 py-1 rounded-full flex items-center ${
                resource.available
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {resource.available ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              {resource.name}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const OptionNode = ({ data }) => {
  const colors = data.selected ? getConfidenceColors(data.confidenceLevel) : null;
  
  return (
    <div className="group transition-all duration-300">
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: data.selected ? '#2563eb' : '#94a3b8' }}
      />
      {data.selected && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#2563eb' }}
        />
      )}
      <div className={`rounded-xl p-4 shadow-lg min-w-[250px] max-w-[300px] ${
        data.selected
          ? `bg-gradient-to-br ${colors?.gradient} text-white`
          : 'bg-white border border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-3">
          {data.selected ? (
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-1.5" />
              <span className="text-xs font-medium">Selected Response</span>
            </div>
          ) : (
            <div className="flex items-center">
              <ArrowUpRight className="w-4 h-4 mr-1.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Alternative</span>
            </div>
          )}
          {data.selected && (
            <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded-lg">
              Confidence: {data.confidenceLevel}/5
            </div>
          )}
        </div>
        <div className={`text-sm leading-relaxed ${
          data.selected ? 'text-white/90' : 'text-gray-600'
        }`}>
          {data.text}
        </div>
        {data.playerName && (
          <div className="mt-2 text-xs font-medium bg-white/20 px-2 py-1 rounded-lg inline-block">
            {data.playerName}
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  role: RoleNode,
  decision: DecisionNode,
  option: OptionNode,
};

export default function DecisionTree() {
  const { state } = useSimulation();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showAlternatives, setShowAlternatives] = useState(true);
  const [showAnimations, setShowAnimations] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const generateGraph = useCallback(() => {
    if (!state.currentScenario || !state.players.length) return { nodes: [], edges: [] };

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Filter players based on selection
    const playersToShow = selectedPlayer 
      ? state.players.filter(p => p.id === selectedPlayer)
      : state.players;

    // Add nodes and edges for selected player(s)
    playersToShow.forEach((player, playerIndex) => {
      const roleId = `role-${player.id}`;
      
      // Add role node
      newNodes.push({
        id: roleId,
        type: 'role',
        position: { x: 0, y: playerIndex * 200 },
        data: { 
          role: player.role,
          context: state.currentScenario.timeline[0]?.roleContext[player.role] || '',
          playerName: player.name
        }
      });

      // Add decision points and options
      player.responses.forEach((response, index) => {
        const decision = state.currentScenario.timeline[index];
        if (!decision) return;

        const decisionId = `decision-${player.id}-${index}`;
        
        // Add decision node
        newNodes.push({
          id: decisionId,
          type: 'decision',
          position: { x: 0, y: playerIndex * 200 },
          data: {
            step: index + 1,
            text: decision.text,
            playerName: player.name,
            resources: decision.requiredResources?.map(resource => ({
              name: resource.name,
              available: response.availableResources.includes(resource.id)
            }))
          }
        });

        // Connect nodes
        if (index === 0) {
          newEdges.push({
            id: `edge-${roleId}-${decisionId}`,
            source: roleId,
            target: decisionId,
            data: { confidenceLevel: response.confidenceLevel }
          });
        } else {
          const prevOptionId = `option-${player.id}-${index-1}-selected`;
          newEdges.push({
            id: `edge-${prevOptionId}-${decisionId}`,
            source: prevOptionId,
            target: decisionId,
            data: { confidenceLevel: response.confidenceLevel }
          });
        }

        // Add options
        decision.options.forEach((option, optIndex) => {
          const isSelected = option.id === response.optionId;
          const optionId = isSelected 
            ? `option-${player.id}-${index}-selected`
            : `option-${player.id}-${index}-${optIndex}`;

          if (isSelected || showAlternatives) {
            newNodes.push({
              id: optionId,
              type: 'option',
              position: { x: 0, y: playerIndex * 200 },
              data: {
                text: option.text,
                selected: isSelected,
                confidenceLevel: isSelected ? response.confidenceLevel : undefined,
                playerName: isSelected ? player.name : undefined
              }
            });

            newEdges.push({
              id: `edge-${decisionId}-${optionId}`,
              source: decisionId,
              target: optionId,
              data: { 
                confidenceLevel: isSelected ? response.confidenceLevel : undefined
              }
            });
          }
        });
      });
    });

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    dagreGraph.setGraph({ 
      rankdir: 'LR',
      align: 'DL',
      nodesep: 80,
      ranksep: 150,
      edgesep: 40,
      marginx: 50,
      marginy: 50,
      acyclicer: 'greedy',
      ranker: 'network-simplex'
    });

    newNodes.forEach(node => {
      dagreGraph.setNode(node.id, {
        width: node.type === 'role' ? 280 : node.type === 'decision' ? 380 : 280,
        height: node.type === 'role' ? 100 : node.type === 'decision' ? 160 : 100
      });
    });

    newEdges.forEach(edge => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = newNodes.map(node => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWithPosition.width / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2
        },
        targetPosition: Position.Left,
        sourcePosition: Position.Right
      };
    });

    const layoutedEdges = newEdges.map(edge => {
      const isMainPath = edge.source.includes('selected') || edge.source.startsWith('role');
      const isSelectedOption = edge.source.includes('selected') || edge.target.includes('selected');
      
      const colors = edge.data?.confidenceLevel ? getConfidenceColors(edge.data.confidenceLevel) : null;
      const edgeColor = colors?.edge || (isMainPath ? '#2563eb' : '#94a3b8');
      
      return {
        ...edge,
        type: 'default',
        animated: showAnimations && (isMainPath || isSelectedOption),
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: edgeColor
        },
        style: {
          stroke: edgeColor,
          strokeWidth: 2.5,
          opacity: isMainPath || isSelectedOption ? 1 : 0.4
        }
      };
    });

    return { nodes: layoutedNodes, edges: layoutedEdges };
  }, [state.currentScenario, state.players, showAlternatives, showAnimations, selectedPlayer]);

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = generateGraph();
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [generateGraph, setNodes, setEdges]);

  if (!state.currentScenario) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
          Decision Path Analysis
        </h2>
        <p className="text-gray-600 mt-2">
          Visualizing your crisis response journey and decision points
        </p>
      </div>

      <style>{customStyles}</style>

      <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden border border-gray-200">
        <div className="h-[800px]">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ 
                padding: 0.3,
                includeHiddenNodes: false,
                minZoom: 0.3,
                maxZoom: 1.2
              }}
              minZoom={0.2}
              maxZoom={1.5}
              defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
              connectionMode={ConnectionMode.Loose}
              className="transition-all duration-300"
              elementsSelectable={false}
              nodesDraggable={false}
              nodesConnectable={false}
              proOptions={{ hideAttribution: true }}
            >
              <Background 
                color="#94a3b8" 
                size={1.5}
                className="opacity-50"
              />
              <Controls 
                className="bg-white shadow-lg border-none rounded-xl m-4"
                showInteractive={false}
              />
              <Panel position="top-right" className="flex flex-col gap-3">
                {state.players.length > 1 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                    <label className="text-xs font-medium text-gray-500 block mb-2">
                      Filter by Player
                    </label>
                    <select
                      value={selectedPlayer || 'all'}
                      onChange={(e) => setSelectedPlayer(e.target.value === 'all' ? null : e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value="all">All Players</option>
                      {state.players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white/90 transition-all duration-300 shadow-sm hover:shadow"
                >
                  {showAlternatives ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hide Alternatives
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Show Alternatives
                    </>
                  )}
                </button>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500">
                    Use mouse wheel to zoom • Drag to pan
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>

      <SimulationAnalysis />
    </div>
  );
}