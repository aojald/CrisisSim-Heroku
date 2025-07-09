import React, { useEffect, useState } from 'react';
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
import { X, Shield, Target, ArrowUpRight, Clock, AlertCircle, Users, Zap } from 'lucide-react';
import { Scenario } from '../../types';
import 'reactflow/dist/style.css';

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
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 min-w-[500px] max-w-[600px]">
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 bg-violet-50 rounded-lg">
          <Target className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <div className="text-sm font-medium text-violet-900">Decision Point {data.step}</div>
          <div className="text-xs text-violet-500">
            <Clock className="w-3 h-3 inline mr-1" />
            {Math.floor(data.timeLimit / 60)}:{(data.timeLimit % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-600 leading-relaxed">
        {data.text}
      </div>
      {data.roleContext && (
        <div className="mt-3 bg-blue-50 rounded-lg p-2">
          <div className="flex items-center text-xs font-medium text-blue-700 mb-1">
            <Users className="w-3 h-3 mr-1" />
            Role Context
          </div>
          <div className="text-xs text-blue-600 leading-relaxed">
            {data.roleContext}
          </div>
        </div>
      )}
    </div>
  </div>
);

const OptionNode = ({ data }) => (
  <div className="group transition-all duration-300">
    <Handle
      type="target"
      position={Position.Left}
      style={{ background: '#94a3b8' }}
    />
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 min-w-[400px] max-w-[500px]">
      <div className="flex items-center mb-3">
        <ArrowUpRight className="w-4 h-4 mr-1.5 text-gray-400" />
        <span className="text-xs font-medium text-gray-500">Response Option</span>
      </div>
      <div className="text-sm text-gray-600 leading-relaxed mb-3">
        {data.text}
      </div>
      {data.impact && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(data.impact).map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-2">
              <div className="text-xs font-medium text-gray-700 capitalize mb-1">
                {key}
              </div>
              <div className="flex items-center">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 ml-2">
                  {value}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const nodeTypes = {
  decision: DecisionNode,
  option: OptionNode,
};

interface Props {
  scenario: Scenario;
  onClose: () => void;
}

export default function ScenarioPreview({ scenario, onClose }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!scenario || !scenario.timeline) return;

    const generateGraph = () => {
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Add decision node
      const decision = scenario.timeline[currentStep];
      if (!decision) return { nodes: [], edges: [] };

      const decisionId = `decision-${currentStep}`;
      newNodes.push({
        id: decisionId,
        type: 'decision',
        position: { x: 0, y: 0 },
        data: {
          step: currentStep + 1,
          text: decision.text,
          timeLimit: decision.timeLimit,
          roleContext: decision.roleContext.CEO
        }
      });

      // Calculate vertical spacing based on number of options
      const optionCount = decision.options.length;
      const verticalGap = 200;
      const totalHeight = optionCount * verticalGap;
      const startY = -totalHeight / 2;

      // Add options with calculated vertical positions
      decision.options.forEach((option, optIndex) => {
        const optionId = `option-${currentStep}-${optIndex}`;
        newNodes.push({
          id: optionId,
          type: 'option',
          position: { 
            x: 600,
            y: startY + (optIndex * verticalGap)
          },
          data: {
            text: option.text,
            impact: option.impact
          }
        });

        newEdges.push({
          id: `edge-${decisionId}-${optionId}`,
          source: decisionId,
          target: optionId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#94a3b8'
          }
        });
      });

      // Layout calculation
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      
      dagreGraph.setGraph({ 
        rankdir: 'LR',
        align: 'UL',
        nodesep: 120,
        ranksep: 250,
        edgesep: 80,
        marginx: 50,
        marginy: 100,
        acyclicer: 'greedy',
        ranker: 'network-simplex'
      });

      newNodes.forEach(node => {
        dagreGraph.setNode(node.id, {
          width: node.type === 'decision' ? 500 : 400,
          height: node.type === 'decision' ? 220 : 180,
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 20,
          paddingBottom: 20
        });
      });

      newEdges.forEach(edge => {
        dagreGraph.setEdge(edge.source, edge.target, {
          weight: 1,
          minlen: 2
        });
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
          sourcePosition: Position.Right,
          style: {
            ...node.style,
            zIndex: node.type === 'decision' ? 2 : 1
          }
        };
      });

      return { nodes: layoutedNodes, edges: newEdges };
    };

    const { nodes: layoutedNodes, edges: layoutedEdges } = generateGraph();
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [scenario, currentStep, setNodes, setEdges]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{scenario.title}</h2>
            <p className="text-sm text-gray-500 mt-1">Decision Flow Preview</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 h-[calc(90vh-80px)]">
          <style>{customStyles}</style>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{
                padding: 0.5,
                includeHiddenNodes: false,
                minZoom: 0.2,
                maxZoom: 1.2
              }}
              minZoom={0.1}
              maxZoom={1.5}
              defaultViewport={{ x: 0, y: 0, zoom: 0.4 }}
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
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500">
                    Use mouse wheel to zoom • Drag to pan
                  </div>
                </div>
              </Panel>
              <Panel position="bottom-center" className="mb-4">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                  <div className="flex items-center space-x-2">
                    {scenario.timeline.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          currentStep === index
                            ? 'bg-blue-100 text-blue-600'
                            : 'hover:bg-gray-100 text-gray-400'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}